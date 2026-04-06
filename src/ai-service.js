import axios from 'axios';
import dotenv from 'dotenv';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { buildGlossaryPrompt } from './glossary.js';
import { getCachedTranslation, setCachedTranslation } from './translation-cache.js';

dotenv.config();

// ============================================================
// OpenRouter Key Pool — Smart Rotation & Health Tracking
// ============================================================

const orKeyPool = [];
const orKeyHealth = new Map(); // key -> { failures, lastFailure, cooldownUntil, usageToday, usageDate }
const activeKeys = new Set(); // Tracks keys currently running a prompt.
/**
 * Initialize OpenRouter key pool from env vars
 */
export function initKeyPool() {
  for (let i = 0; i < 20; i++) {
    const keyName = i === 0 ? 'OPENROUTER_API_KEY' : `OPENROUTER_API_KEY_${i}`;
    if (process.env[keyName]) {
      orKeyPool.push(process.env[keyName]);
      orKeyHealth.set(process.env[keyName], {
        failures: 0, lastFailure: 0, cooldownUntil: 0,
        usageToday: 0, usageDate: new Date().toISOString().split('T')[0],
      });
    }
  }

  console.log(chalk.green(`🔑 OpenRouter Key Pool: ${orKeyPool.length} keys loaded`));
}

/**
 * Get the best available API key (least-used-first, skip cooldown keys)
 */
function getBestOrKey() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  for (const [key, health] of orKeyHealth.entries()) {
    if (health.usageDate !== today) {
      health.usageToday = 0;
      health.usageDate = today;
      health.failures = 0;
    }
  }

  const available = orKeyPool
    .filter(key => {
      const health = orKeyHealth.get(key);
      return (!health.cooldownUntil || health.cooldownUntil < now) && !activeKeys.has(key);
    })
    .sort((a, b) => orKeyHealth.get(a).usageToday - orKeyHealth.get(b).usageToday);

  if (available.length === 0) {
    // Return null so the calling loop waits for an available key.
    return null;
  }

  return available[0];
}

/**
 * Mark an OpenRouter key as failed
 */
function markOrKeyFailed(key, isRateLimit = false) {
  const health = orKeyHealth.get(key);
  if (!health) return;
  health.failures++;
  health.lastFailure = Date.now();
  if (isRateLimit) {
    const cooldownMs = Math.min(30000 * Math.pow(2, health.failures - 1), 600000);
    health.cooldownUntil = Date.now() + cooldownMs;
    console.log(chalk.yellow(`⏳ OR Key ${key.substring(0, 8)}... cooldown ${cooldownMs / 1000}s (failure #${health.failures})`));
  }
}

/**
 * Mark an OpenRouter key as successful
 */
function markOrKeySuccess(key) {
  const health = orKeyHealth.get(key);
  if (!health) return;
  health.usageToday++;
  if (health.failures > 0) health.failures = Math.max(0, health.failures - 1);
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(prompt, retries = 5) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const apiKey = getBestOrKey();
    if (!apiKey) {
      lastError = new Error('Tất cả API keys đều đang bận hoặc đang bị khóa (cooldown).');
      // Wait randomly 2-4 seconds for a key to be freed up
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
      continue;
    }

    activeKeys.add(apiKey);
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 8192,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://viethoabot.com',
            'X-Title': 'VietHoa Bot',
          },
          timeout: 120000,
        }
      );

      const text = response.data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response from OpenRouter');

      markOrKeySuccess(apiKey);
      return cleanResponse(text);
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      if (status === 429 || status === 402) {
        markOrKeyFailed(apiKey, true);
        console.log(chalk.yellow(`⚠️ OR Key ${apiKey.substring(0, 8)}... ${status === 402 ? 'no credits' : 'rate limited'}. Trying next...`));
      } else if (status === 403) {
        markOrKeyFailed(apiKey, true);
        console.log(chalk.red(`❌ OR Key ${apiKey.substring(0, 8)}... forbidden (invalid key?)`));
      } else {
        markOrKeyFailed(apiKey, false);
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(chalk.red(`❌ OpenRouter error (attempt ${attempt + 1}): ${errorMsg} (Status: ${status})`));
      }

      if (attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(r => setTimeout(r, backoff));
      }
    } finally {
      activeKeys.delete(apiKey);
    }
  }

  throw lastError || new Error('All OpenRouter API attempts failed');
}

/**
 * Get quota status for keys
 */
export function getQuotaStatus() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  return orKeyPool.map((key, i) => {
    const health = orKeyHealth.get(key);
    const inCooldown = health.cooldownUntil && health.cooldownUntil > now;
    return {
      provider: 'OpenRouter',
      index: i + 1,
      keyPreview: `${key.substring(0, 8)}...${key.substring(key.length - 4)}`,
      usageToday: health.usageDate === today ? health.usageToday : 0,
      failures: health.failures,
      status: inCooldown ? '❌ Cooldown' : health.failures > 5 ? '⚠️ Unstable' : '✅ OK',
      cooldownLeft: inCooldown ? Math.ceil((health.cooldownUntil - now) / 1000) : 0,
    };
  });
}

// ============================================================
// Selective Translation — Pre-scan & Filter
// ============================================================

/**
 * Pre-scan content to identify lines that need translation
 * Returns { linesToTranslate: [{index, content}], skippedLines: [{index, content, reason}] }
 */
export function prescanContent(content, format) {
  const lines = content.split('\n');
  const linesToTranslate = [];
  const skippedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      skippedLines.push({ index: i, content: line, reason: 'empty' });
      continue;
    }

    // Skip comment-only lines
    if (isCommentLine(trimmed, format)) {
      skippedLines.push({ index: i, content: line, reason: 'comment' });
      continue;
    }

    // Skip lines that are purely technical (no translatable text)
    if (isPurelyTechnical(trimmed, format)) {
      skippedLines.push({ index: i, content: line, reason: 'technical' });
      continue;
    }

    // Skip lines already in Vietnamese
    if (isVietnameseText(trimmed)) {
      skippedLines.push({ index: i, content: line, reason: 'already_vietnamese' });
      continue;
    }

    linesToTranslate.push({ index: i, content: line });
  }

  return { linesToTranslate, skippedLines, totalLines: lines.length };
}

function isCommentLine(trimmed, format) {
  if (format === 'yaml' || format === 'properties' || format === 'config') {
    return trimmed.startsWith('#');
  }
  if (format === 'sk') {
    return trimmed.startsWith('#') || trimmed.startsWith('//');
  }
  return false;
}

function isPurelyTechnical(trimmed, format) {
  // YAML: lines that are only keys with no string value
  if (format === 'yaml') {
    // "key:" with no value or boolean/number value
    if (/^[\w\-\.]+:\s*$/.test(trimmed)) return true;
    if (/^[\w\-\.]+:\s*(true|false|\d+\.?\d*)\s*$/.test(trimmed)) return true;
    // Section header "key:"
    if (/^[\w\-\.]+:$/.test(trimmed)) return true;
  }

  // JSON: structural lines
  if (format === 'json') {
    if (/^[\{\}\[\],]+$/.test(trimmed)) return true;
    // Key with number/boolean value
    if (/^"[\w\-\.]+"\s*:\s*(\d+\.?\d*|true|false|null)\s*,?\s*$/.test(trimmed)) return true;
  }

  // Properties: empty value
  if (format === 'properties' || format === 'lang') {
    if (/^[\w\-\.]+=$/.test(trimmed)) return true;
    if (/^[\w\-\.]+=\d+\.?\d*$/.test(trimmed)) return true;
  }

  // Pure numbers, booleans
  if (/^\d+\.?\d*$/.test(trimmed)) return true;
  if (/^(true|false)$/i.test(trimmed)) return true;

  return false;
}

function isVietnameseText(text) {
  // Vietnamese-specific Unicode ranges (diacritical marks)
  const vnChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựìíỉĩịỳýỷỹỵđ]/i;
  // Check if significant portion has Vietnamese chars
  const vnMatches = text.match(vnChars);
  if (!vnMatches) return false;

  // If more than 3 Vietnamese characters, likely Vietnamese
  const allVnChars = text.match(new RegExp(vnChars.source, 'gi'));
  return allVnChars && allVnChars.length >= 3;
}

/**
 * Merge translated lines back with skipped lines
 */
export function mergeTranslatedLines(translatedLines, skippedLines, totalLines) {
  const result = new Array(totalLines);

  // Place skipped lines at their original positions
  for (const { index, content } of skippedLines) {
    result[index] = content;
  }

  // Place translated lines at their original positions
  let translatedIndex = 0;
  for (let i = 0; i < totalLines; i++) {
    if (result[i] === undefined) {
      if (translatedIndex < translatedLines.length) {
        result[i] = translatedLines[translatedIndex];
        translatedIndex++;
      } else {
        result[i] = ''; // Fallback
      }
    }
  }

  return result.join('\n');
}

// ============================================================
// Token-Efficient Prompts
// ============================================================

/**
 * Build a compact, efficient translation prompt
 */
function buildTranslationPrompt(content, format, chunkNum = 1, totalChunks = 1) {
  const glossary = buildGlossaryPrompt();

  const chunkInfo = totalChunks > 1 ? `\nChunk ${chunkNum}/${totalChunks}. Maintain context continuity.` : '';

  return `ROLE: Expert Minecraft plugin translator. Auto-detect source language → Vietnamese.
RULES:
- Keep ALL formatting, placeholders (%x%), and color codes (&x, §x) exactly as-is
- Translate ONLY user-facing text values
- Return EXACTLY the SAME number of lines as the input
- Do NOT merge, split, or add any empty lines
- If unsure, keep the original text
${glossary}
FORMAT: ${format}${chunkInfo}

TRANSLATE:
${content}

OUTPUT (translated ${format} only, no explanation, no code fences):`;
}

/**
 * Build prompt for short text translation
 */
function buildShortTextPrompt(text) {
  return `Auto-detect language and translate to Vietnamese. Return ONLY the translation, nothing else.
Text: "${text}"`;
}

// ============================================================
// Main Translation Functions
// ============================================================

// Adaptive chunk sizing
function getChunkSize(contentLength) {
  if (contentLength < 2000) return contentLength + 100;
  return 2000; // Smaller chunks force AI to maintain structure better
}

/**
 * Split text into chunks (adaptive sizing)
 */
function splitIntoChunks(text, maxChunkSize) {
  if (text.length <= maxChunkSize) return [text];

  const chunks = [];
  let currentChunk = '';
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      let remaining = line;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, maxChunkSize));
        remaining = remaining.substring(maxChunkSize);
      }
      continue;
    }

    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }

    currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

/**
 * Clean AI response (remove code fences, etc.)
 */
function cleanResponse(text) {
  let cleaned = text;

  // Remove markdown code fences
  const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk|plain)?\n?([\s\S]*?)```/;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1];
  }

  // Remove leading/trailing whitespace but preserve internal structure
  cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '');

  return cleaned;
}

/**
 * Main OpenRouter translation function with all optimizations
 */
export async function translateWithOpenRouter(contentToTranslate, format, userId, progressCallback = null) {
  const chunkSize = getChunkSize(contentToTranslate.length);
  const chunks = splitIntoChunks(contentToTranslate, chunkSize);
  const originalLineCount = contentToTranslate.split('\n').length;
  const originalLines = contentToTranslate.split('\n');
  const warnings = [];

  console.log(chalk.green(`📦 ${chunks.length} chunks (adaptive size: ${chunkSize} chars)`));

  if (progressCallback) progressCallback(0, chunks.length);

  // Pool-based Concurrency: Limit tasks up to the TOTAL NUMBER OF KEYS available!
  const limit = pLimit(orKeyPool.length || 1);

  const results = new Array(chunks.length);
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const tasks = chunks.map((chunk, index) =>
    limit(async () => {
      console.log(chalk.magenta(`🔄 Chunk ${index + 1}/${chunks.length}...`));

      try {
        const prompt = buildTranslationPrompt(chunk, format, index + 1, chunks.length);
        let translated = await callOpenRouter(prompt);

        // Verify line count
        const originalChunkLines = chunk.split('\n').length;
        const translatedChunkLines = translated.split('\n').length;

        if (translatedChunkLines !== originalChunkLines) {
          console.warn(chalk.yellow(`⚠️ Chunk ${index + 1} line mismatch: ${originalChunkLines} → ${translatedChunkLines}. Skipping chunk to prevent file corruption!`));
          warnings.push(`Chunk ${index + 1} (giữ nguyên tiếng Anh vì AI làm hỏng cấu trúc dòng)`);
          throw new Error('Dịch lệch số dòng (Translation shifted). Bỏ qua chunk này để an toàn file.');
        }

        results[index] = translated;
      } catch (error) {
        console.error(chalk.red(`❌ Chunk ${index + 1} failed completely: ${error.message}`));
        // Fallback to original content
        results[index] = chunk;
      }

      if (progressCallback) {
        const completed = results.filter(r => r !== undefined).length;
        progressCallback(completed, chunks.length);
      }
    })
  );

  await Promise.all(tasks);

  // Join chunks with newline separator
  let translatedContent = results.join('\n');

  // Final line count check
  const finalLines = translatedContent.split('\n').length;
  if (finalLines !== originalLineCount) {
    console.warn(chalk.yellow(`⚠️ Final line mismatch: ${originalLineCount} → ${finalLines}. Fixing...`));
    translatedContent = fixLineCount(contentToTranslate, translatedContent);
  }

  // Preserve special formatting
  translatedContent = preserveSpecialFormatting(contentToTranslate, translatedContent);

  return { content: translatedContent, warnings };
}

/**
 * Translate a short text string
 */
export async function translateShortText(text, userId) {
  // Check cache first
  const cached = getCachedTranslation(text, 'shorttext');
  if (cached) return cached;

  const prompt = buildShortTextPrompt(text);
  let result;

  // Try OpenRouter first
  try {
    result = await callOpenRouter(prompt);
  } catch (error) {
    console.log(chalk.yellow(`⚠️ OpenRouter failed for short text, trying Google Translate...`));
    // Fallback to Google Translate
    try {
      result = await translateWithGoogleFree(text);
      console.log(chalk.green('✅ Google Translate fallback succeeded'));
    } catch (gtError) {
      throw new Error('Tất cả AI đều hết quota. Vui lòng thử lại sau.');
    }
  }

  const cleaned = result.replace(/^["']|["']$/g, '').trim();
  // Cache the result
  setCachedTranslation(text, 'shorttext', cleaned);
  return cleaned;
}

/**
 * Google Translate free fallback
 */
export async function translateWithGoogleFree(text, targetLang = 'vi') {
  try {
    const url = `https://translate.googleapis.com/translate_a/single`;
    const response = await axios.get(url, {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: targetLang,
        dt: 't',
        q: text,
      },
      timeout: 15000,
    });

    if (response.data && response.data[0]) {
      return response.data[0].map(segment => segment[0]).join('');
    }
    throw new Error('Invalid Google Translate response');
  } catch (error) {
    console.error(chalk.red(`Google Translate fallback error: ${error.message}`));
    throw error;
  }
}

// ============================================================
// Utility Functions
// ============================================================

function extractContentFromPrompt(prompt) {
  const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
  const match = prompt.match(codeBlockRegex);
  return match?.[1] || prompt;
}

function fixLineCount(original, translated) {
  const origLines = original.split('\n');
  const transLines = translated.split('\n');
  const fixed = [];

  for (let i = 0; i < origLines.length; i++) {
    fixed.push(i < transLines.length ? transLines[i] : origLines[i]);
  }

  return fixed.join('\n');
}

function preserveSpecialFormatting(original, translated) {
  const origLines = original.split('\n');
  const transLines = translated.split('\n');

  if (origLines.length !== transLines.length) return translated;

  const fixed = [];
  const specialFormatRegex = /([&§][0-9a-fklmnor])|(%[a-zA-Z0-9_]+%)|\{[a-zA-Z0-9_]+\}|<[a-zA-Z0-9_]+>/g;

  for (let i = 0; i < origLines.length; i++) {
    let line = transLines[i];
    const origFormats = origLines[i].match(specialFormatRegex);

    if (origFormats) {
      const transFormats = line.match(specialFormatRegex);
      if (!transFormats || origFormats.length !== transFormats.length) {
        for (const fmt of origFormats) {
          if (!line.includes(fmt)) {
            // Try to find where it should go (simplified)
            line += fmt;
          }
        }
      }
    }

    fixed.push(line);
  }

  return fixed.join('\n');
}