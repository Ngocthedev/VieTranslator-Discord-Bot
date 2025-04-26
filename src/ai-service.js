import axios from 'axios';
import dotenv from 'dotenv';
// import { getMaxApiKeys } from './user-management.js';
import chalk from 'chalk';
import pLimit from 'p-limit';

dotenv.config();

// Maximum chunk size (in characters) to send to AI models
const MAX_CHUNK_SIZE = 2500;

/**
 * Get available Gemini API keys
 * @param {string} userId - User ID to determine max keys
 * @returns {Promise<Array<string>>} - Array of API keys
 */


async function getGeminiApiKeys(userId) {
  let keys = [];

  const maxKeys = 9; // Maximum number of keys to use

  let availableKeysCount = 0;

  for (let i = 0; i < 10; i++) {
    const keyName = i === 0 ? 'GEMINI_API_KEY' : `GEMINI_API_KEY_${i}`;
    if (process.env[keyName]) {
      availableKeysCount++;
      
      if (keys.length < maxKeys) {
        keys.push(process.env[keyName]);
      }
    }
  }

  console.log(chalk.cyan(`Người dùng ${userId} có thể sử dụng tối đa ${maxKeys} khóa API. Đã tìm thấy ${keys.length} khóa có sẵn trong tổng số ${availableKeysCount} khóa được cấu hình.`));

  return keys;
}


/**
 * Splits text into manageable chunks for AI processing
 * @param {string} text - Text to split
 * @param {number} maxChunkSize - Maximum size of each chunk
 * @returns {Array<string>} - Array of text chunks
 */
function splitIntoChunks(text, maxChunkSize = MAX_CHUNK_SIZE) {
  // If text is small enough, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let currentChunk = '';
  
  // Split by lines to avoid breaking in the middle of a line
  const lines = text.split('\n');
  
  for (const line of lines) {
    // If the line itself is longer than the max chunk size, split it
    if (line.length > maxChunkSize) {
      // If we have content in the current chunk, add it first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // Split the long line into multiple chunks
      let remainingLine = line;
      while (remainingLine.length > 0) {
        const chunkSize = Math.min(remainingLine.length, maxChunkSize);
        chunks.push(remainingLine.substring(0, chunkSize));
        remainingLine = remainingLine.substring(chunkSize);
      }
      continue;
    }
    
    // If adding this line would exceed the chunk size, start a new chunk
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    // Add the line to the current chunk
    if (currentChunk.length > 0) {
      currentChunk += '\n';
    }
    currentChunk += line;
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Translates text using Google's Gemini API with parallel processing
 * @param {string} prompt - Translation prompt
 * @param {string} outputFormat - Expected output format
 * @param {string} userId - User ID for API key allocation
 * @param {function} progressCallback - Callback for progress updates
 * @returns {Promise<string>} - Translated content
 */
export async function translateWithGemini(prompt, outputFormat, userId, progressCallback = null) {
  try {
    // Get available API keys for this user
    const apiKeys = await getGeminiApiKeys(userId);
    if (apiKeys.length === 0) {
      throw new Error('No Gemini API keys available');
    }

    // Extract the content to translate from the prompt
    const contentToTranslate = extractContentToTranslate(prompt);
    
    // Split content into chunks if it's too large
    const chunks = splitIntoChunks(contentToTranslate);
    console.log(chalk.green(`File split into ${chunks.length} chunks for translation`));
    
    // Count original lines for integrity check
    const originalLineCount = contentToTranslate.split('\n').length;
    console.log(chalk.blue(`Original line count: ${originalLineCount}`));
    
    // Store original lines for comparison and fallback
    const originalLines = contentToTranslate.split('\n');
    
    // Update progress
    if (progressCallback) {
      progressCallback(0, chunks.length);
    }
    
    // Process chunks in parallel based on available API keys
    const results = new Array(chunks.length);
    const originalChunks = [...chunks]; // Keep a copy of original chunks for fallback
    const chunkGroups = [];
    
    // Distribute chunks among available API keys
    for (let i = 0; i < apiKeys.length; i++) {
      chunkGroups.push([]);
    }
    
    // Assign chunks to groups (round-robin)
    for (let i = 0; i < chunks.length; i++) {
      const groupIndex = i % apiKeys.length;
      chunkGroups[groupIndex].push({
        index: i,
        content: chunks[i]
      });
    }
    
    // Log chunk distribution
    for (let i = 0; i < chunkGroups.length; i++) {
      console.log(chalk.yellow(`API key ${i + 1} will process ${chunkGroups[i].length} chunks: ${chunkGroups[i].map(c => c.index + 1).join(', ')}`));
    }
    
    // Create a concurrency limiter for each API key
    const concurrencyLimit = 2; // Process up to 2 chunks per API key simultaneously
    const limit = pLimit(apiKeys.length * concurrencyLimit);
    
    // Create translation tasks
    const tasks = [];
    
    chunkGroups.forEach((group, groupIndex) => {
      const apiKey = apiKeys[groupIndex];
      
      group.forEach(({ index, content }) => {
        tasks.push(limit(async () => {
          console.log(chalk.magenta(`Translating chunk ${index + 1}/${chunks.length} with API key ${groupIndex + 1}...`));
          
          let retryCount = 0;
          const maxRetries = 3; // Increased from 2 to 3 for better reliability
          
          while (retryCount <= maxRetries) {
            try {
              // Create a chunk-specific prompt
              const chunkPrompt = createChunkPrompt(prompt, content, index + 1, chunks.length, outputFormat);
              
              const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                  contents: [
                    {
                      parts: [
                        {
                          text: chunkPrompt
                        }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192,
                  }
                },
                {
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  timeout: 120000 // Increased timeout to 120 seconds
                }
              );

              // Extract the translated content from the response
              const generatedText = response.data.candidates[0].content.parts[0].text;
              
              // Clean up the response to extract just the translated content
              let chunkTranslated = generatedText;
              
              // If the response contains markdown code blocks, extract the content
              const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
              const match = generatedText.match(codeBlockRegex);
              if (match && match[1]) {
                chunkTranslated = match[1];
              }
              
              // Verify the chunk has the same number of lines as the original
              const originalChunkLines = content.split('\n').length;
              const translatedChunkLines = chunkTranslated.split('\n').length;
              
              if (originalChunkLines !== translatedChunkLines) {
                console.warn(chalk.yellow(`Chunk ${index + 1} line count mismatch! Original: ${originalChunkLines}, Translated: ${translatedChunkLines}. Fixing...`));
                
                // Fix line count for this chunk
                if (translatedChunkLines < originalChunkLines) {
                  // Add missing lines from original content
                  const originalChunkLinesArray = content.split('\n');
                  const translatedChunkLinesArray = chunkTranslated.split('\n');
                  
                  const fixedLines = [];
                  let translatedIndex = 0;
                  
                  for (let j = 0; j < originalChunkLines; j++) {
                    if (translatedIndex < translatedChunkLinesArray.length) {
                      fixedLines.push(translatedChunkLinesArray[translatedIndex]);
                      translatedIndex++;
                    } else {
                      // If we run out of translated lines, use original lines
                      fixedLines.push(originalChunkLinesArray[j]);
                    }
                  }
                  
                  chunkTranslated = fixedLines.join('\n');
                } else if (translatedChunkLines > originalChunkLines) {
                  // Trim excess lines
                  const translatedChunkLinesArray = chunkTranslated.split('\n');
                  chunkTranslated = translatedChunkLinesArray.slice(0, originalChunkLines).join('\n');
                }
              }
              
              // Store the result at the correct index
              results[index] = chunkTranslated;
              
              // Update progress
              if (progressCallback) {
                const completedChunks = results.filter(r => r !== undefined).length;
                progressCallback(completedChunks, chunks.length);
              }
              
              return; // Success, exit the retry loop
            } catch (error) {
              retryCount++;
              console.error(chalk.red(`Error translating chunk ${index + 1} with API key ${groupIndex + 1} (Attempt ${retryCount}/${maxRetries + 1}):`, error.message));
              
              if (retryCount > maxRetries) {
                // Use original content as fallback after max retries
                console.log(chalk.yellow(`Using original content as fallback for chunk ${index + 1}`));
                results[index] = originalChunks[index];
                
                // Update progress
                if (progressCallback) {
                  const completedChunks = results.filter(r => r !== undefined).length;
                  progressCallback(completedChunks, chunks.length);
                }
                
                return; // Exit the retry loop
              }
              
              // Wait before retrying with exponential backoff
              const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
          }
        }));
      });
    });
    
    // Execute all translation tasks
    await Promise.all(tasks);
    
    // Combine all translated chunks
    let translatedContent = results.join('');
    
    // Verify line count integrity
    const translatedLineCount = translatedContent.split('\n').length;
    console.log(chalk.blue(`Translated line count: ${translatedLineCount}`));
    
    if (translatedLineCount !== originalLineCount) {
      console.warn(chalk.yellow(`Line count mismatch! Original: ${originalLineCount}, Translated: ${translatedLineCount}`));
      
      // Try to fix line count issues with a more robust approach
      const translatedLines = translatedContent.split('\n');
      const fixedLines = [];
      
      // Ensure we have exactly the same number of lines as the original
      for (let i = 0; i < originalLineCount; i++) {
        if (i < translatedLines.length) {
          // Use translated line if available
          fixedLines.push(translatedLines[i]);
        } else {
          // Use original line as fallback
          fixedLines.push(originalLines[i]);
        }
      }
      
      translatedContent = fixedLines.join('\n');
      console.log(chalk.green(`Fixed line count. New line count: ${translatedContent.split('\n').length}`));
    }
    
    // Perform a final verification of special characters and formatting
    translatedContent = preserveSpecialFormatting(contentToTranslate, translatedContent);
    
    return translatedContent;
  } catch (error) {
    console.error(chalk.red('Error with Gemini API:', error.response?.data || error.message));
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Translates text using OpenAI's API
 * @param {string} prompt - Translation prompt
 * @param {string} outputFormat - Expected output format
 * @param {string} userId - User ID for API key allocation
 * @param {function} progressCallback - Callback for progress updates
 * @returns {Promise<string>} - Translated content
 */
export async function translateWithOpenAI(prompt, outputFormat, userId, progressCallback = null) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // Extract the content to translate from the prompt
    const contentToTranslate = extractContentToTranslate(prompt);
    
    // Split content into chunks if it's too large
    const chunks = splitIntoChunks(contentToTranslate);
    console.log(chalk.green(`File split into ${chunks.length} chunks for translation`));
    
    // Count original lines for integrity check
    const originalLineCount = contentToTranslate.split('\n').length;
    console.log(chalk.blue(`Original line count: ${originalLineCount}`));
    
    // Store original lines for comparison and fallback
    const originalLines = contentToTranslate.split('\n');
    
    // Update progress
    if (progressCallback) {
      progressCallback(0, chunks.length);
    }
    
    // Create a concurrency limiter
    const concurrencyLimit = 3; // Process up to 3 chunks simultaneously
    const limit = pLimit(concurrencyLimit);
    
    // Create translation tasks
    const tasks = chunks.map((chunk, index) => {
      return limit(async () => {
        console.log(chalk.magenta(`Translating chunk ${index+1}/${chunks.length}...`));
        
        let retryCount = 0;
        const maxRetries = 3; // Increased from 2 to 3 for better reliability
        
        while (retryCount <= maxRetries) {
          try {
            // Create a chunk-specific prompt
            const chunkPrompt = createChunkPrompt(prompt, chunk, index+1, chunks.length, outputFormat);
            
            const response = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: 'gpt-4',
                messages: [
                  {
                    role: 'system',
                    content: `You are an expert in translating Minecraft plugins from English to Vietnamese. Translate the provided content to Vietnamese while preserving the structure and format. Return the translated content in ${outputFormat} format. Maintain any special fonts or formatting in the text.`
                  },
                  {
                    role: 'user',
                    content: chunkPrompt
                  }
                ],
                temperature: 0.3,
                max_tokens: 4000
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
                },
                timeout: 120000 // Increased timeout to 120 seconds
              }
            );

            // Extract the translated content from the response
            const generatedText = response.data.choices[0].message.content;
            
            // Clean up the response to extract just the translated content
            let chunkTranslated = generatedText;
            
            // If the response contains markdown code blocks, extract the content
            const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
            const match = generatedText.match(codeBlockRegex);
            if (match && match[1]) {
              chunkTranslated = match[1];
            }
            
            // Verify the chunk has the same number of lines as the original
            const originalChunkLines = chunk.split('\n').length;
            const translatedChunkLines = chunkTranslated.split('\n').length;
            
            if (originalChunkLines !== translatedChunkLines) {
              console.warn(chalk.yellow(`Chunk ${index + 1} line count mismatch! Original: ${originalChunkLines}, Translated: ${translatedChunkLines}. Fixing...`));
              
              // Fix line count for this chunk
              if (translatedChunkLines < originalChunkLines) {
                // Add missing lines from original content
                const originalChunkLinesArray = chunk.split('\n');
                const translatedChunkLinesArray = chunkTranslated.split('\n');
                
                const fixedLines = [];
                let translatedIndex = 0;
                
                for (let j = 0; j < originalChunkLines; j++) {
                  if (translatedIndex < translatedChunkLinesArray.length) {
                    fixedLines.push(translatedChunkLinesArray[translatedIndex]);
                    translatedIndex++;
                  } else {
                    // If we run out of translated lines, use original lines
                    fixedLines.push(originalChunkLinesArray[j]);
                  }
                }
                
                chunkTranslated = fixedLines.join('\n');
              } else if (translatedChunkLines > originalChunkLines) {
                // Trim excess lines
                const translatedChunkLinesArray = chunkTranslated.split('\n');
                chunkTranslated = translatedChunkLinesArray.slice(0, originalChunkLines).join('\n');
              }
            }
            
            return { index, content: chunkTranslated };
          } catch (error) {
            retryCount++;
            console.error(chalk.red(`Error translating chunk ${index+1} (Attempt ${retryCount}/${maxRetries + 1}):`, error.message));
            
            if (retryCount > maxRetries) {
              // Use original content as fallback after max retries
              console.log(chalk.yellow(`Using original content as fallback for chunk ${index+1}`));
              return { index, content: chunks[index] };
            }
            
            // Wait before retrying with exponential backoff
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      });
    });
    
    // Execute all translation tasks
    const results = await Promise.all(tasks);
    
    // Sort results by index and extract content
    const sortedResults = results
      .sort((a, b) => a.index - b.index)
      .map(result => result.content);
    
    // Combine all translated chunks
    let translatedContent = sortedResults.join('');
    
    // Verify line count integrity
    const translatedLineCount = translatedContent.split('\n').length;
    console.log(chalk.blue(`Translated line count: ${translatedLineCount}`));
    
    if (translatedLineCount !== originalLineCount) {
      console.warn(chalk.yellow(`Line count mismatch! Original: ${originalLineCount}, Translated: ${translatedLineCount}`));
      
      // Try to fix line count issues with a more robust approach
      const translatedLines = translatedContent.split('\n');
      const fixedLines = [];
      
      // Ensure we have exactly the same number of lines as the original
      for (let i = 0; i < originalLineCount; i++) {
        if (i < translatedLines.length) {
          // Use translated line if available
          fixedLines.push(translatedLines[i]);
        } else {
          // Use original line as fallback
          fixedLines.push(originalLines[i]);
        }
      }
      
      translatedContent = fixedLines.join('\n');
      console.log(chalk.green(`Fixed line count. New line count: ${translatedContent.split('\n').length}`));
    }
    
    // Perform a final verification of special characters and formatting
    translatedContent = preserveSpecialFormatting(contentToTranslate, translatedContent);
    
    return translatedContent;
  } catch (error) {
    console.error(chalk.red('Error with OpenAI API:', error.response?.data || error.message));
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Translates a short text while preserving special fonts
 * @param {string} text - Text to translate
 * @param {string} userId - User ID for API key allocation
 * @returns {Promise<string>} - Translated text
 */
export async function translateShortText(text, userId) {
  try {
    // Detect if text has special font
    const hasSpecialFont = /[^\u0000-\u007F]/.test(text) && !/[\u0080-\u9FFF]/.test(text);
    
    // Get available API keys for this user
    const apiKeys = await getGeminiApiKeys(userId);
    if (apiKeys.length === 0) {
      throw new Error('No Gemini API keys available');
    }
    
    // Use the first available API key
    const apiKey = apiKeys[0];
    
    // Create prompt based on whether text has special font
    let prompt;
    if (hasSpecialFont) {
      prompt = `
Translate the following text from English to Vietnamese. 
IMPORTANT: The text uses a special font/formatting that MUST be preserved exactly in your translation.
Identify the special characters/formatting and ensure they are maintained in the Vietnamese translation.

Text to translate: "${text}"

Return ONLY the translated text with the same special font/formatting, nothing else.
`;
    } else {
      prompt = `
Translate the following text from English to Vietnamese:

"${text}"

Return ONLY the translated text, nothing else.
`;
    }
    
    let retryCount = 0;
    const maxRetries = 3; // Increased from 2 to 3 for better reliability
    
    while (retryCount <= maxRetries) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 1000,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          }
        );

        // Extract the translated content from the response
        const translatedText = response.data.candidates[0].content.parts[0].text.trim();
        
        // Remove any quotes that might be in the response
        return translatedText.replace(/^["']|["']$/g, '');
      } catch (error) {
        retryCount++;
        console.error(chalk.red(`Error translating short text (Attempt ${retryCount}/${maxRetries + 1}):`, error.message));
        
        if (retryCount > maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    throw new Error('Failed to translate after multiple attempts');
  } catch (error) {
    console.error(chalk.red('Error translating short text:', error.response?.data || error.message));
    throw new Error(`Translation error: ${error.message}`);
  }
}

/**
 * Extracts the content to translate from the prompt
 * @param {string} prompt - The full prompt
 * @returns {string} - The content to translate
 */
function extractContentToTranslate(prompt) {
  const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
  const match = prompt.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1];
  }
  return prompt;
}

/**
 * Creates a prompt for a specific chunk of content
 * @param {string} originalPrompt - The original full prompt
 * @param {string} chunk - The chunk of content to translate
 * @param {number} chunkNumber - The current chunk number
 * @param {number} totalChunks - The total number of chunks
 * @param {string} outputFormat - The expected output format
 * @returns {string} - A chunk-specific prompt
 */
function createChunkPrompt(originalPrompt, chunk, chunkNumber, totalChunks, outputFormat) {
  // Extract the instructions from the original prompt
  const instructionsMatch = originalPrompt.match(/(.*?)```/s);
  let instructions = '';
  
  if (instructionsMatch && instructionsMatch[1]) {
    instructions = instructionsMatch[1];
  }
  
  return `${instructions}
This is chunk ${chunkNumber} of ${totalChunks} from a larger file.

\`\`\`${outputFormat}
${chunk}
\`\`\`

Translate this chunk to Vietnamese and return it in ${outputFormat} format. Only return the translated content without any explanations or markdown formatting. Maintain the exact same structure, indentation, and line breaks.

IMPORTANT: 
1. Preserve any special fonts or formatting in the text
2. DO NOT translate keys, variable names, or technical parameters
3. DO NOT add or remove any lines
4. Maintain the exact same number of lines as the original
5. Preserve all whitespace and indentation
6. Preserve all special characters, symbols, and formatting
7. If you're unsure about translating something, leave it as is
`;
}

/**
 * Preserves special formatting between original and translated content
 * @param {string} originalContent - The original content
 * @param {string} translatedContent - The translated content
 * @returns {string} - Content with preserved special formatting
 */
function preserveSpecialFormatting(originalContent, translatedContent) {
  const originalLines = originalContent.split('\n');
  const translatedLines = translatedContent.split('\n');
  
  // Ensure we have the same number of lines
  if (originalLines.length !== translatedLines.length) {
    console.warn(chalk.yellow(`Line count mismatch during format preservation! Original: ${originalLines.length}, Translated: ${translatedLines.length}`));
    return translatedContent;
  }
  
  const fixedLines = [];
  
  for (let i = 0; i < originalLines.length; i++) {
    const originalLine = originalLines[i];
    let translatedLine = translatedLines[i];
    
    // Check for special formatting characters
    const specialFormatRegex = /([&§][0-9a-fklmnor])|(%[a-zA-Z0-9_]+%)|(\{[a-zA-Z0-9_]+\})|(<[a-zA-Z0-9_]+>)/g;
    const originalSpecialFormats = originalLine.match(specialFormatRegex);
    
    if (originalSpecialFormats) {
      // Check if translated line is missing any special formats
      const translatedSpecialFormats = translatedLine.match(specialFormatRegex);
      
      if (!translatedSpecialFormats || 
          originalSpecialFormats.length !== translatedSpecialFormats.length ||
          !originalSpecialFormats.every(format => translatedSpecialFormats.includes(format))) {
        
        // If special formatting is missing or incorrect, try to preserve it
        let fixedLine = translatedLine;
        
        // For each special format in the original, ensure it exists in the translation
        for (const format of originalSpecialFormats) {
          if (!translatedLine.includes(format)) {
            // Try to find a suitable position to insert the format
            // For simplicity, we'll just append it if it's missing
            fixedLine += format;
          }
        }
        
        translatedLine = fixedLine;
      }
    }
    
    // Check for special fonts (small caps, etc.)
    if (/[ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ]/.test(originalLine)) {
      // If original has special font but translated doesn't, try to convert
      if (!/[ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ]/.test(translatedLine)) {
        // This is a simplified approach - a full implementation would map each character
        console.log(chalk.yellow(`Line ${i+1} has special font that may not be preserved correctly`));
      }
    }
    
    fixedLines.push(translatedLine);
  }
  
  return fixedLines.join('\n');
}