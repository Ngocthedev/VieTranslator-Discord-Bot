import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import { translateWithGemini, translateWithOpenAI } from './ai-service.js';
// import { canUseBot } from './user-management.js';
import chalk from 'chalk';

/**
 * Translates a file to Vietnamese
 * @param {string} filePath - Path to the file
 * @param {string} fileExtension - File extension
 * @param {string} userId - User ID for permission checking and API key allocation
 * @param {function} progressCallback - Callback for progress updates
 * @returns {Promise<string>} - Translated content
 */
export async function translateFile(filePath, fileExtension, userId, progressCallback = null) {
  // Check if user can use the bot
  // const { allowed, reason } = await canUseBot(userId);
  // if (!allowed) {
  //   throw new Error(reason);
  // }
  
  // Read file content
  const content = await fs.readFile(filePath, 'utf8');
  
  // Get file size for logging
  const stats = await fs.stat(filePath);
  const fileSizeKB = Math.round(stats.size / 1024);
  console.log(chalk.blue(`Processing file: ${path.basename(filePath)} (${fileSizeKB} KB)`));
  
  // Parse file based on extension
  let parsedContent;
  let translationPrompt;
  let outputFormat;
  
  switch (fileExtension) {
    case '.yml':
    case '.yaml':
      try {
        parsedContent = yaml.load(content);
        translationPrompt = createYamlTranslationPrompt(content, parsedContent);
        outputFormat = 'yaml';
      } catch (error) {
        console.error(chalk.red('Error parsing YAML:', error));
        translationPrompt = createGenericTranslationPrompt(content);
        outputFormat = 'text';
      }
      break;
    case '.json':
      try {
        parsedContent = JSON.parse(content);
        translationPrompt = createJsonTranslationPrompt(content, parsedContent);
        outputFormat = 'json';
      } catch (error) {
        console.error(chalk.red('Error parsing JSON:', error));
        translationPrompt = createGenericTranslationPrompt(content);
        outputFormat = 'text';
      }
      break;
    case '.properties':
    case '.lang':
      translationPrompt = createPropertiesTranslationPrompt(content);
      outputFormat = 'properties';
      break;
    case '.cfg':
    case '.conf':
    case '.config':
    case '.ini':
      translationPrompt = createConfigTranslationPrompt(content);
      outputFormat = 'config';
      break;
    case '.sk':
      translationPrompt = createSkriptTranslationPrompt(content);
      outputFormat = 'sk';
      break;
    default:
      translationPrompt = createGenericTranslationPrompt(content);
      outputFormat = 'text';
  }
  
  console.log(chalk.green(`Translation started with format: ${outputFormat}`));
  
  // Choose AI service based on environment variable
  const aiModel = process.env.DEFAULT_AI_MODEL || 'gemini';
  let translatedContent;
  
  try {
    console.log(chalk.yellow(`Using AI model: ${aiModel}`));
    
    if (aiModel === 'openai' && process.env.OPENAI_API_KEY) {
      translatedContent = await translateWithOpenAI(translationPrompt, outputFormat, userId, progressCallback);
    } else {
      translatedContent = await translateWithGemini(translationPrompt, outputFormat, userId, progressCallback);
    }
    
    // Verify integrity of translation
    const originalLineCount = content.split('\n').length;
    const translatedLineCount = translatedContent.split('\n').length;
    
    console.log(chalk.blue(`Original line count: ${originalLineCount}, Translated line count: ${translatedLineCount}`));
    
    if (translatedLineCount !== originalLineCount) {
      console.warn(chalk.yellow(`Line count mismatch! Attempting to fix...`));
      
      // Try to fix line count issues with a more robust approach
      const originalLines = content.split('\n');
      const translatedLines = translatedContent.split('\n');
      const fixedLines = [];
      
      // Ensure we have exactly the same number of lines as the original
      for (let i = 0; i < originalLineCount; i++) {
        if (i < translatedLines.length) {
          // Use translated line if available
          fixedLines.push(translatedLines[i]);
        } else {
          // Use original line as fallback
          console.log(chalk.yellow(`Adding missing line ${i+1} from original content`));
          fixedLines.push(originalLines[i]);
        }
      }
      
      translatedContent = fixedLines.join('\n');
      console.log(chalk.green(`Fixed line count. New line count: ${translatedContent.split('\n').length}`));
    }
    
    // Perform additional validation based on file type
    if (fileExtension === '.yml' || fileExtension === '.yaml') {
      try {
        // Try to parse the translated YAML to ensure it's valid
        const parsed = yaml.load(translatedContent);
        console.log(chalk.green('Translated YAML validation successful'));
      } catch (error) {
        console.error(chalk.red('Translated YAML validation failed:', error));
        console.log(chalk.yellow('Attempting to fix YAML structure...'));
        
        // If YAML parsing fails, try to fix common issues
        translatedContent = fixYamlStructure(content, translatedContent);
      }
    } else if (fileExtension === '.json') {
      try {
        // Try to parse the translated JSON to ensure it's valid
        const parsed = JSON.parse(translatedContent);
        console.log(chalk.green('Translated JSON validation successful'));
      } catch (error) {
        console.error(chalk.red('Translated JSON validation failed:', error));
        console.log(chalk.yellow('Attempting to fix JSON structure...'));
        
        // If JSON parsing fails, try to fix common issues
        translatedContent = fixJsonStructure(content, translatedContent);
      }
    }
    
    console.log(chalk.green('Translation completed successfully'));
    return translatedContent;
  } catch (error) {
    console.error(chalk.red('Translation failed:', error));
    throw error;
  }
}

/**
 * Creates a translation prompt for YAML files
 * @param {string} rawContent - Raw file content
 * @param {object} parsedContent - Parsed YAML content
 * @returns {string} - Translation prompt
 */
function createYamlTranslationPrompt(rawContent, parsedContent) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a YAML configuration file from a Minecraft plugin:

\`\`\`yaml
${rawContent}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. YAML keys
2. Technical values like command names, permissions, plugin names
3. Placeholders like %player%, {player}, <player>
4. Color codes like &a, &b, &c, §a, §b, §c
5. Variables, technical parameters

Return the entire YAML file translated, maintaining the exact structure, format, and indentation.
Ensure the YAML remains valid and can be loaded by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Ensure all quotes, brackets, and special characters remain intact
6. If you're unsure about translating something, leave it as is
`;
}

/**
 * Creates a translation prompt for JSON files
 * @param {string} rawContent - Raw file content
 * @param {object} parsedContent - Parsed JSON content
 * @returns {string} - Translation prompt
 */
function createJsonTranslationPrompt(rawContent, parsedContent) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a JSON file from a Minecraft plugin:

\`\`\`json
${rawContent}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. JSON keys
2. Technical values like command names, permissions, plugin names
3. Placeholders like %player%, {player}, <player>
4. Color codes like &a, &b, &c, §a, §b, §c
5. Variables, technical parameters

Return the entire JSON file translated, maintaining the exact structure and format.
Ensure the JSON remains valid and can be loaded by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Ensure all quotes, brackets, and special characters remain intact
6. If you're unsure about translating something, leave it as is
`;
}

/**
 * Creates a translation prompt for properties files
 * @param {string} content - File content
 * @returns {string} - Translation prompt
 */
function createPropertiesTranslationPrompt(content) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a properties/lang file from a Minecraft plugin:

\`\`\`properties
${content}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. Keys on the left side of the = sign
2. Technical values like command names, permissions, plugin names
3. Placeholders like %player%, {player}, <player>
4. Color codes like &a, &b, &c, §a, §b, §c
5. Variables, technical parameters

Return the entire file translated, maintaining the exact structure and format.
Ensure the file remains valid and can be loaded by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Ensure all special characters remain intact
6. If you're unsure about translating something, leave it as is
`;
}

/**
 * Creates a translation prompt for config files
 * @param {string} content - File content
 * @returns {string} - Translation prompt
 */
function createConfigTranslationPrompt(content) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a configuration file from a Minecraft plugin:

\`\`\`config
${content}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. Configuration keys
2. Technical values like command names, permissions, plugin names
3. Placeholders like %player%, {player}, <player>
4. Color codes like &a, &b, &c, §a, §b, §c
5. Variables, technical parameters
6. Technical comments explaining configuration

Return the entire file translated, maintaining the exact structure and format.
Ensure the file remains valid and can be loaded by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Ensure all special characters remain intact
6. If you're unsure about translating something, leave it as is
`;
}

/**
 * Creates a translation prompt for Skript files
 * @param {string} content - File content
 * @returns {string} - Translation prompt
 */
function createSkriptTranslationPrompt(content) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a Skript file from a Minecraft plugin:

\`\`\`sk
${content}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. Skript syntax and commands
2. Variable names and function names
3. Technical values like command names, permissions, plugin names
4. Placeholders like %player%, {player}, <player>
5. Color codes like &a, &b, &c, §a, §b, §c
6. Variables, technical parameters
7. Code logic and structure

Return the entire Skript file translated, maintaining the exact structure and format.
Ensure the Skript remains valid and can be executed by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Only translate comments and user-visible messages
6. Ensure all special characters remain intact
7. If you're unsure about translating something, leave it as is
`;
}

/**
 * Creates a translation prompt for generic text files
 * @param {string} content - File content
 * @returns {string} - Translation prompt
 */
function createGenericTranslationPrompt(content) {
  return `
You are an expert in translating Minecraft plugins from English to Vietnamese.

Here is a text file from a Minecraft plugin:

\`\`\`text
${content}
\`\`\`

Translate all user-facing text to Vietnamese, but DO NOT translate:
1. Configuration keys
2. Technical values like command names, permissions, plugin names
3. Placeholders like %player%, {player}, <player>
4. Color codes like &a, &b, &c, §a, §b, §c
5. Variables, technical parameters
6. Source code, programming syntax

Return the entire file translated, maintaining the exact structure and format.
Ensure the file remains valid and can be loaded by the plugin.

IMPORTANT:
1. Preserve any special fonts or formatting in the text
2. DO NOT add or remove any lines
3. Maintain the exact same number of lines as the original
4. Preserve all whitespace and indentation
5. Ensure all special characters remain intact
6. If you're unsure about translating something, leave it as is
`;
}

/**
 * Fixes YAML structure issues in translated content
 * @param {string} originalContent - Original content
 * @param {string} translatedContent - Translated content
 * @returns {string} - Fixed translated content
 */
function fixYamlStructure(originalContent, translatedContent) {
  const originalLines = originalContent.split('\n');
  const translatedLines = translatedContent.split('\n');
  
  // Ensure we have the same number of lines
  if (originalLines.length !== translatedLines.length) {
    console.warn(chalk.yellow(`Line count mismatch during YAML fix! Original: ${originalLines.length}, Translated: ${translatedLines.length}`));
    return translatedContent;
  }
  
  const fixedLines = [];
  
  for (let i = 0; i < originalLines.length; i++) {
    const originalLine = originalLines[i];
    let translatedLine = translatedLines[i];
    
    // Check for common YAML structural elements
    const keyColonMatch = originalLine.match(/^(\s*)([\w\-\.]+)(:)(\s.*)$/);
    if (keyColonMatch) {
      // This line has a key-value pair, ensure the key and colon are preserved
      const [_, indent, key, colon, rest] = keyColonMatch;
      
      // Extract the key-colon part from the translated line
      const translatedKeyMatch = translatedLine.match(/^(\s*)([\w\-\.]+)(:)(\s.*)$/);
      if (!translatedKeyMatch || translatedKeyMatch[2] !== key) {
        // If the key is missing or different in the translation, fix it
        const translatedRest = translatedLine.replace(/^\s*[\w\-\.]+:\s*/, '').trim();
        translatedLine = `${indent}${key}:${rest.length > 1 ? ' ' + translatedRest : ''}`;
      }
    }
    
    // Check for list items
    const listItemMatch = originalLine.match(/^(\s*)-(\s.*)$/);
    if (listItemMatch) {
      // This line is a list item, ensure the dash and spacing are preserved
      const [_, indent, rest] = listItemMatch;
      
      // Check if the translated line has the correct list item format
      const translatedListMatch = translatedLine.match(/^(\s*)-(\s.*)$/);
      if (!translatedListMatch) {
        // If the list format is missing in the translation, fix it
        const translatedContent = translatedLine.trim();
        translatedLine = `${indent}- ${translatedContent}`;
      }
    }
    
    // Check for quotes that might be missing or malformed
    if (originalLine.includes('"') || originalLine.includes("'")) {
      // Count quotes in original and translated
      const originalQuoteCount = (originalLine.match(/"/g) || []).length + (originalLine.match(/'/g) || []).length;
      const translatedQuoteCount = (translatedLine.match(/"/g) || []).length + (translatedLine.match(/'/g) || []).length;
      
      if (originalQuoteCount !== translatedQuoteCount) {
        console.warn(chalk.yellow(`Quote mismatch on line ${i+1}. Original: ${originalQuoteCount}, Translated: ${translatedQuoteCount}`));
        
        // This is a simplified fix - a more robust solution would parse the YAML structure
        // For now, we'll just use the original line structure with translated content where possible
        const quoteMatch = originalLine.match(/(.*?)(['"])(.*?)(['"])(.*)/);
        if (quoteMatch) {
          const [_, before, openQuote, content, closeQuote, after] = quoteMatch;
          
          // Try to extract the translated content
          const translatedContent = translatedLine.replace(/^.*?['"]/, '').replace(/['"].*$/, '');
          
          // Reconstruct the line with proper quotes
          translatedLine = `${before}${openQuote}${translatedContent}${closeQuote}${after}`;
        }
      }
    }
    
    fixedLines.push(translatedLine);
  }
  
  const result = fixedLines.join('\n');
  
  // Verify the fixed YAML is valid
  try {
    yaml.load(result);
    console.log(chalk.green('YAML structure fixed successfully'));
  } catch (error) {
    console.error(chalk.red('YAML structure fix failed:', error));
    console.log(chalk.yellow('Returning best effort fix, but YAML may still have issues'));
  }
  
  return result;
}

/**
 * Fixes JSON structure issues in translated content
 * @param {string} originalContent - Original content
 * @param {string} translatedContent - Translated content
 * @returns {string} - Fixed translated content
 */
function fixJsonStructure(originalContent, translatedContent) {
  const originalLines = originalContent.split('\n');
  const translatedLines = translatedContent.split('\n');
  
  // Ensure we have the same number of lines
  if (originalLines.length !== translatedLines.length) {
    console.warn(chalk.yellow(`Line count mismatch during JSON fix! Original: ${originalLines.length}, Translated: ${translatedLines.length}`));
    return translatedContent;
  }
  
  const fixedLines = [];
  
  for (let i = 0; i < originalLines.length; i++) {
    const originalLine = originalLines[i];
    let translatedLine = translatedLines[i];
    
    // Check for JSON key-value pairs
    const keyMatch = originalLine.match(/^(\s*)("[\w\-\.]+")(\s*:\s*)(.*)$/);
    if (keyMatch) {
      // This line has a key-value pair, ensure the key is preserved
      const [_, indent, key, separator, value] = keyMatch;
      
      // Extract the key part from the translated line
      const translatedKeyMatch = translatedLine.match(/^(\s*)("[\w\-\.]+")(\s*:\s*)(.*)$/);
      if (!translatedKeyMatch || translatedKeyMatch[2] !== key) {
        // If the key is missing or different in the translation, fix it
        const translatedValue = translatedLine.replace(/^\s*"[\w\-\.]+"\s*:\s*/, '').trim();
        translatedLine = `${indent}${key}${separator}${translatedValue}`;
      }
    }
    
    // Check for quotes that might be missing or malformed in values
    if (originalLine.includes('"')) {
      // Count quotes in original and translated
      const originalQuoteCount = (originalLine.match(/"/g) || []).length;
      const translatedQuoteCount = (translatedLine.match(/"/g) || []).length;
      
      if (originalQuoteCount !== translatedQuoteCount) {
        console.warn(chalk.yellow(`Quote mismatch on line ${i+1}. Original: ${originalQuoteCount}, Translated: ${translatedQuoteCount}`));
        
        // This is a simplified fix - a more robust solution would parse the JSON structure
        // For now, we'll try to fix common issues with string values
        
        // Check if this is a string value
        const stringValueMatch = originalLine.match(/^(\s*"[\w\-\.]+"\s*:\s*)(")(.*)(")(\s*,?\s*)$/);
        if (stringValueMatch) {
          const [_, keyPart, openQuote, content, closeQuote, end] = stringValueMatch;
          
          // Try to extract the translated content
          const translatedContent = translatedLine.replace(/^.*?"[\w\-\.]+"\s*:\s*"/, '').replace(/".*$/, '');
          
          // Reconstruct the line with proper quotes
          translatedLine = `${keyPart}${openQuote}${translatedContent}${closeQuote}${end}`;
        }
      }
    }
    
    // Check for brackets, braces, and commas
    ['[', ']', '{', '}', ','].forEach(char => {
      if (originalLine.includes(char) && !translatedLine.includes(char)) {
        console.warn(chalk.yellow(`Missing character '${char}' on line ${i+1}`));
        
        // Find the position of the character in the original line
        const pos = originalLine.indexOf(char);
        
        // Insert the character at the same position in the translated line
        // This is a simplified approach and might not work for all cases
        if (pos < translatedLine.length) {
          translatedLine = translatedLine.substring(0, pos) + char + translatedLine.substring(pos);
        } else {
          translatedLine += char;
        }
      }
    });
    
    fixedLines.push(translatedLine);
  }
  
  const result = fixedLines.join('\n');
  
  // Verify the fixed JSON is valid
  try {
    JSON.parse(result);
    console.log(chalk.green('JSON structure fixed successfully'));
  } catch (error) {
    console.error(chalk.red('JSON structure fix failed:', error));
    console.log(chalk.yellow('Returning best effort fix, but JSON may still have issues'));
  }
  
  return result;
}