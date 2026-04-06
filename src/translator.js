import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import chalk from 'chalk';
import {
  translateWithOpenRouter,
  translateWithGoogleFree,
  prescanContent,
  mergeTranslatedLines
} from './ai-service.js';
import { getCachedTranslation, setCachedTranslation } from './translation-cache.js';

/**
 * Translates a file to Vietnamese with all optimizations
 * @param {string} filePath - Path to the file
 * @param {string} fileExtension - File extension
 * @param {string} userId - User ID for API key allocation
 * @param {function} progressCallback - Callback for progress updates
 * @returns {Promise<string>} - Translated content
 */
export async function translateFile(filePath, fileExtension, userId, progressCallback = null) {
  // Read file content
  const content = await fs.readFile(filePath, 'utf8');
  const stats = await fs.stat(filePath);
  const fileSizeKB = Math.round(stats.size / 1024);
  const format = getFormat(fileExtension);

  console.log(chalk.blue(`📄 Processing: ${path.basename(filePath)} (${fileSizeKB} KB, format: ${format})`));

  // === Step 1: Check cache ===
  const cached = getCachedTranslation(content, format);
  if (cached) {
    console.log(chalk.green('💾 Cache HIT — returning cached translation'));
    if (progressCallback) progressCallback(1, 1);
    return cached;
  }

  // === Step 2: Pre-scan for selective translation ===
  const { linesToTranslate, skippedLines, totalLines } = prescanContent(content, format);

  const skipPercent = Math.round((skippedLines.length / totalLines) * 100);
  console.log(chalk.cyan(`🔍 Pre-scan: ${totalLines} lines total, ${linesToTranslate.length} to translate, ${skippedLines.length} skipped (${skipPercent}%)`));

  // If nothing to translate, return original
  if (linesToTranslate.length === 0) {
    console.log(chalk.yellow('⚠️ No translatable content found. Returning original.'));
    if (progressCallback) progressCallback(1, 1);
    return content;
  }

  // === Step 3: Build content to translate (only translatable lines) ===
  const contentToTranslate = linesToTranslate.map(l => l.content).join('\n');

  console.log(chalk.green(`📦 Sending ${contentToTranslate.length} chars to AI (saved ${content.length - contentToTranslate.length} chars)`));

  // === Step 4: Translate ===
  let translatedContent;
  let warnings = [];

  try {
    console.log(chalk.yellow(`🤖 Using AI: OpenRouter`));
    const result = await translateWithOpenRouter(contentToTranslate, format, userId, progressCallback);
    translatedContent = result.content;
    warnings = result.warnings || [];
  } catch (error) {
    console.error(chalk.red(`❌ Primary AI failed: ${error.message}`));
    throw new Error(`Lời gọi OpenRouter bị lỗi. Vui lòng thử lại sau. (${error.message})`);
  }

  // === Step 5: Merge translated lines back with skipped lines ===
  const translatedLines = translatedContent.split('\n');
  const finalContent = mergeTranslatedLines(translatedLines, skippedLines, totalLines);

  // === Step 6: Validate output ===
  const validatedContent = validateTranslation(content, finalContent, fileExtension);

  // === Step 7: Cache result ===
  setCachedTranslation(content, format, validatedContent);

  console.log(chalk.green('✅ Translation completed and cached'));
  return { content: validatedContent, warnings };
}

/**
 * Translate raw content string (for Web API)
 */
export async function translateContent(content, format, userId, progressCallback = null) {
  // Check cache
  const cached = getCachedTranslation(content, format);
  if (cached) {
    console.log(chalk.green('💾 Cache HIT'));
    return { content: cached, cached: true, warnings: [] };
  }

  // Pre-scan
  const { linesToTranslate, skippedLines, totalLines } = prescanContent(content, format);

  if (linesToTranslate.length === 0) {
    return { content, cached: false, warnings: [] };
  }

  const contentToTranslate = linesToTranslate.map(l => l.content).join('\n');

  // Translate
  let translatedContent;
  let warnings = [];
  try {
    const result = await translateWithOpenRouter(contentToTranslate, format, userId, progressCallback);
    translatedContent = result.content;
    warnings = result.warnings || [];
  } catch (error) {
    throw new Error(`Lời gọi OpenRouter bị lỗi. Vui lòng thử lại sau. (${error.message})`);
  }

  // Merge
  const translatedLines = translatedContent.split('\n');
  const finalContent = mergeTranslatedLines(translatedLines, skippedLines, totalLines);

  // Validate
  const validated = validateTranslation(content, finalContent, `.${format}`);

  // Cache
  setCachedTranslation(content, format, validated);

  return { content: validated, cached: false, warnings };
}

/**
 * Get format from file extension
 */
function getFormat(ext) {
  const map = {
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.json': 'json',
    '.properties': 'properties',
    '.lang': 'lang',
    '.cfg': 'config',
    '.conf': 'config',
    '.config': 'config',
    '.ini': 'config',
    '.sk': 'sk',
    '.txt': 'text',
  };
  return map[ext] || 'text';
}

/**
 * Validate translated content
 */
function validateTranslation(original, translated, fileExtension) {
  let result = translated;

  // Line count check
  const origLines = original.split('\n').length;
  const transLines = translated.split('\n').length;

  if (origLines !== transLines) {
    console.warn(chalk.yellow(`⚠️ Line count mismatch: ${origLines} → ${transLines}. Fixing...`));
    const origArr = original.split('\n');
    const transArr = translated.split('\n');
    const fixed = [];

    for (let i = 0; i < origLines; i++) {
      fixed.push(i < transArr.length ? transArr[i] : origArr[i]);
    }

    result = fixed.join('\n');
  }

  // Format-specific validation
  if (fileExtension === '.yml' || fileExtension === '.yaml') {
    try {
      yaml.load(result);
      console.log(chalk.green('✅ YAML validation passed'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ YAML validation failed: ${error.message}`));
      result = fixYamlStructure(original, result);
    }
  } else if (fileExtension === '.json') {
    try {
      JSON.parse(result);
      console.log(chalk.green('✅ JSON validation passed'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ JSON validation failed: ${error.message}`));
      result = fixJsonStructure(original, result);
    }
  }

  return result;
}

/**
 * Fix YAML structure issues
 */
function fixYamlStructure(original, translated) {
  const origLines = original.split('\n');
  const transLines = translated.split('\n');
  if (origLines.length !== transLines.length) return translated;

  const fixed = [];
  for (let i = 0; i < origLines.length; i++) {
    const orig = origLines[i];
    let trans = transLines[i];

    // Preserve YAML key structure
    const keyMatch = orig.match(/^(\s*)([\w\-\.]+)(:)(\s.*)$/);
    if (keyMatch) {
      const [_, indent, key, colon, rest] = keyMatch;
      const transKeyMatch = trans.match(/^(\s*)([\w\-\.]+)(:)(\s.*)$/);
      if (!transKeyMatch || transKeyMatch[2] !== key) {
        const transValue = trans.replace(/^\s*[\w\-\.]+:\s*/, '').trim();
        trans = `${indent}${key}: ${transValue}`;
      }
    }

    // Preserve list items
    const listMatch = orig.match(/^(\s*)-(\s.*)$/);
    if (listMatch) {
      const transListMatch = trans.match(/^(\s*)-(\s.*)$/);
      if (!transListMatch) {
        trans = `${listMatch[1]}- ${trans.trim()}`;
      }
    }

    fixed.push(trans);
  }

  const result = fixed.join('\n');
  try {
    yaml.load(result);
    console.log(chalk.green('✅ YAML fix successful'));
  } catch (e) {
    console.warn(chalk.yellow('⚠️ YAML fix incomplete'));
  }
  return result;
}

/**
 * Fix JSON structure issues
 */
function fixJsonStructure(original, translated) {
  const origLines = original.split('\n');
  const transLines = translated.split('\n');
  if (origLines.length !== transLines.length) return translated;

  const fixed = [];
  for (let i = 0; i < origLines.length; i++) {
    const orig = origLines[i];
    let trans = transLines[i];

    // Preserve JSON key
    const keyMatch = orig.match(/^(\s*)("[\w\-\.]+")(\s*:\s*)(.*)$/);
    if (keyMatch) {
      const [_, indent, key, sep, value] = keyMatch;
      const transKeyMatch = trans.match(/^(\s*)("[\w\-\.]+")(\s*:\s*)(.*)$/);
      if (!transKeyMatch || transKeyMatch[2] !== key) {
        const transValue = trans.replace(/^\s*"[\w\-\.]+"\s*:\s*/, '').trim();
        trans = `${indent}${key}${sep}${transValue}`;
      }
    }

    // Preserve structural characters
    for (const char of ['{', '}', '[', ']', ',']) {
      const origHas = orig.trimEnd().endsWith(char);
      const transHas = trans.trimEnd().endsWith(char);
      if (origHas && !transHas) {
        trans = trans.trimEnd() + char;
      }
    }

    fixed.push(trans);
  }

  const result = fixed.join('\n');
  try {
    JSON.parse(result);
    console.log(chalk.green('✅ JSON fix successful'));
  } catch (e) {
    console.warn(chalk.yellow('⚠️ JSON fix incomplete'));
  }
  return result;
}