import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to user data files
const dataDir = path.join(__dirname, '../data');
const whitelistPath = path.join(dataDir, 'whitelist.json');
const blacklistPath = path.join(dataDir, 'blacklist.json');
const userSettingsPath = path.join(dataDir, 'user-settings.json');

// Create data directory if it doesn't exist
fs.ensureDirSync(dataDir);

// Initialize cache for faster access
const userCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Initialize data files if they don't exist
if (!fs.existsSync(whitelistPath)) {
  fs.writeJSONSync(whitelistPath, {}, { spaces: 2 });
}

if (!fs.existsSync(blacklistPath)) {
  fs.writeJSONSync(blacklistPath, {}, { spaces: 2 });
}

if (!fs.existsSync(userSettingsPath)) {
  fs.writeJSONSync(userSettingsPath, {}, { spaces: 2 });
}

/**
 * Convert duration string to milliseconds
 * @param {string} duration - Duration string (e.g., "5min", "2d", "1month", "3years", "inf")
 * @returns {number|null} - Duration in milliseconds or null for infinite
 */
function parseDuration(duration) {
  if (!duration || duration.toLowerCase() === 'inf') {
    return null; // Infinite duration
  }

  const regex = /^(\d+)(min|d|month|years)$/i;
  const match = duration.match(regex);

  if (!match) {
    throw new Error('Invalid duration format. Use format like "5min", "2d", "1month", "3years", or "inf"');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const MS_PER_MINUTE = 60 * 1000;
  const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
  const MS_PER_MONTH = 30 * MS_PER_DAY; // Approximate
  const MS_PER_YEAR = 365 * MS_PER_DAY; // Approximate

  switch (unit) {
    case 'min':
      return value * MS_PER_MINUTE;
    case 'd':
      return value * MS_PER_DAY;
    case 'month':
      return value * MS_PER_MONTH;
    case 'years':
      return value * MS_PER_YEAR;
    default:
      throw new Error('Invalid duration unit');
  }
}

/**
 * Format duration for display
 * @param {number|null} durationMs - Duration in milliseconds or null for infinite
 * @returns {string} - Formatted duration string
 */
function formatDuration(durationMs) {
  if (durationMs === null) {
    return 'vĩnh viễn';
  }

  const MS_PER_MINUTE = 60 * 1000;
  const MS_PER_HOUR = 60 * MS_PER_MINUTE;
  const MS_PER_DAY = 24 * MS_PER_HOUR;
  const MS_PER_MONTH = 30 * MS_PER_DAY; // Approximate
  const MS_PER_YEAR = 365 * MS_PER_DAY; // Approximate

  if (durationMs < MS_PER_HOUR) {
    return `${Math.ceil(durationMs / MS_PER_MINUTE)} phút`;
  } else if (durationMs < MS_PER_DAY) {
    return `${Math.ceil(durationMs / MS_PER_HOUR)} giờ`;
  } else if (durationMs < MS_PER_MONTH) {
    return `${Math.ceil(durationMs / MS_PER_DAY)} ngày`;
  } else if (durationMs < MS_PER_YEAR) {
    return `${Math.ceil(durationMs / MS_PER_MONTH)} tháng`;
  } else {
    return `${Math.ceil(durationMs / MS_PER_YEAR)} năm`;
  }
}

/**
 * Add a user to the whitelist
 * @param {string} userId - User ID
 * @param {string} duration - Duration string
 * @returns {object} - Result with success status and message
 */
export async function addToWhitelist(userId, duration) {
  try {
    // Parse duration
    const durationMs = parseDuration(duration);
    
    // Calculate expiry time
    const expiryTime = durationMs ? Date.now() + durationMs : null;
    
    // Read current whitelist
    const whitelist = await fs.readJSON(whitelistPath);
    
    // Add user to whitelist
    whitelist[userId] = {
      addedAt: Date.now(),
      expiryTime: expiryTime
    };
    
    // Save whitelist
    await fs.writeJSON(whitelistPath, whitelist, { spaces: 2 });
    
    // Update cache
    userCache.del(`whitelist_${userId}`);
    
    return {
      success: true,
      message: `Người dùng ${userId} đã được thêm vào danh sách trắng ${expiryTime ? 'trong ' + formatDuration(durationMs) : 'vĩnh viễn'}.`
    };
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return {
      success: false,
      message: `Lỗi khi thêm vào danh sách trắng: ${error.message}`
    };
  }
}

/**
 * Remove a user from the whitelist
 * @param {string} userId - User ID
 * @returns {object} - Result with success status and message
 */
export async function removeFromWhitelist(userId) {
  try {
    // Read current whitelist
    const whitelist = await fs.readJSON(whitelistPath);
    
    // Check if user is in whitelist
    if (!whitelist[userId]) {
      return {
        success: false,
        message: `Người dùng ${userId} không có trong danh sách trắng.`
      };
    }
    
    // Remove user from whitelist
    delete whitelist[userId];
    
    // Save whitelist
    await fs.writeJSON(whitelistPath, whitelist, { spaces: 2 });
    
    // Update cache
    userCache.del(`whitelist_${userId}`);
    
    return {
      success: true,
      message: `Người dùng ${userId} đã được xóa khỏi danh sách trắng.`
    };
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return {
      success: false,
      message: `Lỗi khi xóa khỏi danh sách trắng: ${error.message}`
    };
  }
}

/**
 * Add a user to the blacklist
 * @param {string} userId - User ID
 * @param {string} duration - Duration string
 * @returns {object} - Result with success status and message
 */
export async function addToBlacklist(userId, duration) {
  try {
    // Don't allow blacklisting the bot owner
    if (userId === process.env.BOT_OWNER_ID) {
      return {
        success: false,
        message: 'Không thể thêm chủ sở hữu bot vào danh sách đen.'
      };
    }

    // Parse duration
    const durationMs = parseDuration(duration);
    
    // Calculate expiry time
    const expiryTime = durationMs ? Date.now() + durationMs : null;
    
    // Read current blacklist
    const blacklist = await fs.readJSON(blacklistPath);
    
    // Add user to blacklist
    blacklist[userId] = {
      addedAt: Date.now(),
      expiryTime: expiryTime
    };
    
    // Save blacklist
    await fs.writeJSON(blacklistPath, blacklist, { spaces: 2 });
    
    // Update cache
    userCache.del(`blacklist_${userId}`);
    
    return {
      success: true,
      message: `Người dùng ${userId} đã được thêm vào danh sách đen ${expiryTime ? 'trong ' + formatDuration(durationMs) : 'vĩnh viễn'}.`
    };
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    return {
      success: false,
      message: `Lỗi khi thêm vào danh sách đen: ${error.message}`
    };
  }
}

/**
 * Remove a user from the blacklist
 * @param {string} userId - User ID
 * @returns {object} - Result with success status and message
 */
export async function removeFromBlacklist(userId) {
  try {
    // Read current blacklist
    const blacklist = await fs.readJSON(blacklistPath);
    
    // Check if user is in blacklist
    if (!blacklist[userId]) {
      return {
        success: false,
        message: `Người dùng ${userId} không có trong danh sách đen.`
      };
    }
    
    // Remove user from blacklist
    delete blacklist[userId];
    
    // Save blacklist
    await fs.writeJSON(blacklistPath, blacklist, { spaces: 2 });
    
    // Update cache
    userCache.del(`blacklist_${userId}`);
    
    return {
      success: true,
      message: `Người dùng ${userId} đã được xóa khỏi danh sách đen.`
    };
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    return {
      success: false,
      message: `Lỗi khi xóa khỏi danh sách đen: ${error.message}`
    };
  }
}

/**
 * Check if a user is in the whitelist
 * @param {string} userId - User ID
 * @returns {boolean} - True if user is in whitelist or whitelist is empty
 */
export async function isWhitelisted(userId) {
  try {
    // Bot owner is always whitelisted
    if (userId === process.env.BOT_OWNER_ID) {
      return true;
    }

    // Check cache first
    const cachedResult = userCache.get(`whitelist_${userId}`);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // Read whitelist
    const whitelist = await fs.readJSON(whitelistPath);
    
    // If whitelist is empty, everyone is allowed
    if (Object.keys(whitelist).length === 0) {
      userCache.set(`whitelist_${userId}`, true);
      return true;
    }
    
    // Check if user is in whitelist
    if (!whitelist[userId]) {
      userCache.set(`whitelist_${userId}`, false);
      return false;
    }
    
    // Check if whitelist entry has expired
    const entry = whitelist[userId];
    if (entry.expiryTime && entry.expiryTime < Date.now()) {
      // Remove expired entry
      delete whitelist[userId];
      await fs.writeJSON(whitelistPath, whitelist, { spaces: 2 });
      userCache.set(`whitelist_${userId}`, false);
      return false;
    }
    
    userCache.set(`whitelist_${userId}`, true);
    return true;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
}

/**
 * Check if a user is in the blacklist
 * @param {string} userId - User ID
 * @returns {boolean} - True if user is in blacklist
 */
export async function isBlacklisted(userId) {
  try {
    // Bot owner can never be blacklisted
    if (userId === process.env.BOT_OWNER_ID) {
      return false;
    }

    // Check cache first
    const cachedResult = userCache.get(`blacklist_${userId}`);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // Read blacklist
    const blacklist = await fs.readJSON(blacklistPath);
    
    // Check if user is in blacklist
    if (!blacklist[userId]) {
      userCache.set(`blacklist_${userId}`, false);
      return false;
    }
    
    // Check if blacklist entry has expired
    const entry = blacklist[userId];
    if (entry.expiryTime && entry.expiryTime < Date.now()) {
      // Remove expired entry
      delete blacklist[userId];
      await fs.writeJSON(blacklistPath, blacklist, { spaces: 2 });
      userCache.set(`blacklist_${userId}`, false);
      return false;
    }
    
    userCache.set(`blacklist_${userId}`, true);
    return true;
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return false;
  }
}

/**
 * Set the maximum number of API keys a user can use
 * @param {string} userId - User ID
 * @param {number} maxKeys - Maximum number of API keys
 * @returns {object} - Result with success status and message
 */
export async function setMaxApiKeys(userId, maxKeys) {
  try {
    // Validate maxKeys
    const maxKeysNum = parseInt(maxKeys, 10);
    if (isNaN(maxKeysNum) || maxKeysNum < 1 || maxKeysNum > 10) {
      return {
        success: false,
        message: 'Số lượng API key phải là một số từ 1 đến 10.'
      };
    }
    
    // Read user settings
    const userSettings = await fs.readJSON(userSettingsPath);
    
    // Initialize user settings if not exists
    if (!userSettings[userId]) {
      userSettings[userId] = {};
    }
    
    // Set max API keys
    userSettings[userId].maxApiKeys = maxKeysNum;
    
    // Save user settings
    await fs.writeJSON(userSettingsPath, userSettings, { spaces: 2 });
    
    // Update cache
    userCache.del(`user_settings_${userId}`);
    
    return {
      success: true,
      message: `Đã đặt số lượng API key tối đa cho người dùng ${userId} thành ${maxKeysNum}.`
    };
  } catch (error) {
    console.error('Error setting max API keys:', error);
    return {
      success: false,
      message: `Lỗi khi đặt số lượng API key tối đa: ${error.message}`
    };
  }
}

/**
 * Reduce the maximum number of API keys a user can use
 * @param {string} userId - User ID
 * @param {number} reduceBy - Number of keys to reduce by
 * @returns {object} - Result with success status and message
 */
export async function reduceMaxApiKeys(userId, reduceBy) {
  try {
    // Validate reduceBy
    const reduceByNum = parseInt(reduceBy, 10);
    if (isNaN(reduceByNum) || reduceByNum < 1) {
      return {
        success: false,
        message: 'Số lượng API key cần giảm phải là một số dương.'
      };
    }
    
    // Read user settings
    const userSettings = await fs.readJSON(userSettingsPath);
    
    // Check if user has settings
    if (!userSettings[userId] || !userSettings[userId].maxApiKeys) {
      return {
        success: false,
        message: `Người dùng ${userId} chưa được đặt số lượng API key tối đa.`
      };
    }
    
    // Calculate new max API keys
    const currentMaxKeys = userSettings[userId].maxApiKeys;
    const newMaxKeys = Math.max(1, currentMaxKeys - reduceByNum);
    
    // Set new max API keys
    userSettings[userId].maxApiKeys = newMaxKeys;
    
    // Save user settings
    await fs.writeJSON(userSettingsPath, userSettings, { spaces: 2 });
    
    // Update cache
    userCache.del(`user_settings_${userId}`);
    
    return {
      success: true,
      message: `Đã giảm số lượng API key tối đa cho người dùng ${userId} từ ${currentMaxKeys} xuống ${newMaxKeys}.`
    };
  } catch (error) {
    console.error('Error reducing max API keys:', error);
    return {
      success: false,
      message: `Lỗi khi giảm số lượng API key tối đa: ${error.message}`
    };
  }
}

/**
 * Get the maximum number of API keys a user can use
 * @param {string} userId - User ID
 * @returns {number} - Maximum number of API keys (default: 1)
 */
export async function getMaxApiKeys(userId) {
  try {
    // Bot owner always gets maximum keys
    if (userId === process.env.BOT_OWNER_ID) {
      return 10;
    }

    // Check cache first
    const cachedSettings = userCache.get(`user_settings_${userId}`);
    if (cachedSettings !== undefined && cachedSettings.maxApiKeys !== undefined) {
      return cachedSettings.maxApiKeys;
    }
    
    // Read user settings
    const userSettings = await fs.readJSON(userSettingsPath);
    
    // Get max API keys (default: 1)
    const maxApiKeys = userSettings[userId]?.maxApiKeys || 1;
    
    // Update cache
    userCache.set(`user_settings_${userId}`, { maxApiKeys });
    
    return maxApiKeys;
  } catch (error) {
    console.error('Error getting max API keys:', error);
    return 1; // Default to 1 on error
  }
}

/**
 * Check if a user can use the bot
 * @param {string} userId - User ID
 * @returns {Promise<{allowed: boolean, reason: string|null}>} - Result with allowed status and reason
 */
export async function canUseBot(userId) {
  try {
    // Bot owner can always use the bot
    if (userId === process.env.BOT_OWNER_ID) {
      return {
        allowed: true,
        reason: null
      };
    }

    // Check if user is blacklisted
    const blacklisted = await isBlacklisted(userId);
    if (blacklisted) {
      return {
        allowed: false,
        reason: 'Bạn đang trong danh sách đen và không thể sử dụng bot.'
      };
    }
    
    // Check if user is whitelisted (if whitelist is not empty)
    const whitelisted = await isWhitelisted(userId);
    if (!whitelisted) {
      return {
        allowed: false,
        reason: 'Bạn không có trong danh sách trắng. Vui lòng liên hệ quản trị viên để được thêm vào.'
      };
    }
    
    return {
      allowed: true,
      reason: null
    };
  } catch (error) {
    console.error('Error checking if user can use bot:', error);
    return {
      allowed: false,
      reason: 'Đã xảy ra lỗi khi kiểm tra quyền sử dụng bot.'
    };
  }
}