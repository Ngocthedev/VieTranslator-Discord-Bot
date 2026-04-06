import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYS_PATH = path.join(__dirname, '../data/api-keys.json');

let apiKeys = {};

/**
 * Initialize API key manager
 */
export async function initApiKeyManager() {
  await fs.ensureDir(path.dirname(KEYS_PATH));
  
  try {
    if (await fs.pathExists(KEYS_PATH)) {
      apiKeys = await fs.readJson(KEYS_PATH);
    } else {
      apiKeys = {};
      await saveKeys();
    }
  } catch (error) {
    console.error('Error loading API keys:', error.message);
    apiKeys = {};
  }
  
  console.log(chalk.green(`🔑 API Key Manager initialized: ${Object.keys(apiKeys).length} keys loaded`));
}

/**
 * Create a new API key
 * @param {string} name - Key name/description
 * @param {string} ownerDiscordId - Discord ID of the admin who created it
 * @param {object} options - Additional options
 * @returns {object} Created key info
 */
export async function createApiKey(name, ownerDiscordId, options = {}) {
  const key = `vtb_${uuidv4().replace(/-/g, '')}`;
  const now = new Date();
  
  const expiresAt = options.expiresDays
    ? new Date(now.getTime() + options.expiresDays * 24 * 60 * 60 * 1000).toISOString()
    : null; // null = never expires
  
  const keyData = {
    key,
    name,
    owner: ownerDiscordId,
    createdAt: now.toISOString(),
    expiresAt,
    isActive: true,
    config: {
      dailyLimitPerUser: options.dailyLimitPerUser || 10,
      dailyLimitTotal: options.dailyLimitTotal || 500,
      allowedFormats: options.allowedFormats || ['yaml', 'json', 'properties', 'text', 'lang', 'cfg', 'conf', 'config', 'ini', 'sk'],
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB default
    },
    stats: {
      totalRequests: 0,
      totalUsers: 0,
      todayRequests: 0,
      todayDate: now.toISOString().split('T')[0],
    }
  };
  
  apiKeys[key] = keyData;
  await saveKeys();
  
  console.log(chalk.green(`🔑 API Key created: ${name} (${key.substring(0, 12)}...)`));
  return keyData;
}

/**
 * Validate an API key
 * @returns {{ valid: boolean, keyData: object|null, reason: string|null }}
 */
export function validateApiKey(key) {
  const keyData = apiKeys[key];
  
  if (!keyData) {
    return { valid: false, keyData: null, reason: 'Key không tồn tại' };
  }
  
  if (!keyData.isActive) {
    return { valid: false, keyData, reason: 'Key đã bị vô hiệu hoá' };
  }
  
  if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
    return { valid: false, keyData, reason: 'Key đã hết hạn' };
  }
  
  return { valid: true, keyData, reason: null };
}

/**
 * Get API key data
 */
export function getApiKey(key) {
  return apiKeys[key] || null;
}

/**
 * List all API keys
 */
export function listApiKeys() {
  return Object.values(apiKeys).map(k => ({
    key: `${k.key.substring(0, 12)}...${k.key.substring(k.key.length - 4)}`,
    fullKey: k.key,
    name: k.name,
    owner: k.owner,
    isActive: k.isActive,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt,
    dailyLimitPerUser: k.config.dailyLimitPerUser,
    totalRequests: k.stats.totalRequests,
  }));
}

/**
 * Toggle API key active state
 */
export async function toggleApiKey(key) {
  const keyData = apiKeys[key];
  if (!keyData) return null;
  
  keyData.isActive = !keyData.isActive;
  await saveKeys();
  
  return keyData;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(key) {
  if (!apiKeys[key]) return false;
  delete apiKeys[key];
  await saveKeys();
  return true;
}

/**
 * Increment usage stats for a key
 */
export async function incrementKeyUsage(key) {
  const keyData = apiKeys[key];
  if (!keyData) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Reset daily counter if new day
  if (keyData.stats.todayDate !== today) {
    keyData.stats.todayRequests = 0;
    keyData.stats.todayDate = today;
  }
  
  keyData.stats.totalRequests++;
  keyData.stats.todayRequests++;
  
  // Don't save on every increment (batched save via flush)
  // Save every 10 requests
  if (keyData.stats.totalRequests % 10 === 0) {
    await saveKeys();
  }
}

/**
 * Find API key by partial key or name
 */
export function findApiKey(query) {
  // Search by exact key
  if (apiKeys[query]) return apiKeys[query];
  
  // Search by partial key
  const byPartialKey = Object.values(apiKeys).find(k => 
    k.key.startsWith(query) || k.key.endsWith(query) || k.key.includes(query)
  );
  if (byPartialKey) return byPartialKey;
  
  // Search by name (case-insensitive)
  const byName = Object.values(apiKeys).find(k => 
    k.name.toLowerCase().includes(query.toLowerCase())
  );
  return byName || null;
}

/**
 * Save keys to disk
 */
async function saveKeys() {
  try {
    await fs.writeJson(KEYS_PATH, apiKeys, { spaces: 2 });
  } catch (error) {
    console.error('Error saving API keys:', error.message);
  }
}
