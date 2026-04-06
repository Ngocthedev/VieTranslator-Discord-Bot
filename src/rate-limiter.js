import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

// Rate limit config from env
const DISCORD_PER_DAY = parseInt(process.env.RATE_LIMIT_DISCORD_PER_DAY) || 5;
const API_PER_MINUTE = parseInt(process.env.RATE_LIMIT_API_PER_MINUTE) || 60;
const API_PER_DAY = parseInt(process.env.RATE_LIMIT_API_PER_DAY) || 500;
const WEB_USER_PER_DAY = parseInt(process.env.RATE_LIMIT_WEB_USER_PER_DAY) || 10;
const COOLDOWN_SECONDS = parseInt(process.env.RATE_LIMIT_COOLDOWN_SECONDS) || 30;

// In-memory stores
const discordLimits = new Map();   // userId -> { count, date, lastRequest }
const apiKeyLimits = new Map();    // apiKey -> { minuteCount, minuteStart, dayCount, date }
const webUserLimits = new Map();   // `${apiKey}:${userId}` -> { count, date }

/**
 * Get today's date string for daily reset
 */
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check Discord user rate limit
 * @returns {{ allowed: boolean, remaining: number, resetAt: string, cooldownLeft: number }}
 */
export function checkDiscordLimit(userId) {
  const today = getTodayKey();
  let data = discordLimits.get(userId);
  
  // Reset if new day
  if (!data || data.date !== today) {
    data = { count: 0, date: today, lastRequest: 0 };
    discordLimits.set(userId, data);
  }
  
  // Check cooldown
  const now = Date.now();
  const cooldownLeft = Math.max(0, COOLDOWN_SECONDS * 1000 - (now - data.lastRequest));
  if (cooldownLeft > 0) {
    return {
      allowed: false,
      remaining: DISCORD_PER_DAY - data.count,
      limit: DISCORD_PER_DAY,
      resetAt: getResetTime(),
      cooldownLeft: Math.ceil(cooldownLeft / 1000),
      reason: 'cooldown'
    };
  }
  
  // Check daily limit
  if (data.count >= DISCORD_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      limit: DISCORD_PER_DAY,
      resetAt: getResetTime(),
      cooldownLeft: 0,
      reason: 'daily_limit'
    };
  }
  
  return {
    allowed: true,
    remaining: DISCORD_PER_DAY - data.count,
    limit: DISCORD_PER_DAY,
    resetAt: getResetTime(),
    cooldownLeft: 0,
    reason: null
  };
}

/**
 * Consume a Discord rate limit use
 */
export function consumeDiscordLimit(userId) {
  const today = getTodayKey();
  let data = discordLimits.get(userId);
  if (!data || data.date !== today) {
    data = { count: 0, date: today, lastRequest: 0 };
  }
  data.count++;
  data.lastRequest = Date.now();
  discordLimits.set(userId, data);
  console.log(chalk.cyan(`📊 Discord limit: ${userId} used ${data.count}/${DISCORD_PER_DAY}`));
}

/**
 * Check Web API key rate limit
 * @returns {{ allowed: boolean, remaining: number, reason: string|null }}
 */
export function checkApiKeyLimit(apiKey) {
  const today = getTodayKey();
  const now = Date.now();
  let data = apiKeyLimits.get(apiKey);
  
  if (!data || data.date !== today) {
    data = { minuteCount: 0, minuteStart: now, dayCount: 0, date: today };
    apiKeyLimits.set(apiKey, data);
  }
  
  // Reset minute window
  if (now - data.minuteStart > 60000) {
    data.minuteCount = 0;
    data.minuteStart = now;
  }
  
  // Check per-minute limit
  if (data.minuteCount >= API_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      limit: API_PER_MINUTE,
      reason: 'minute_limit',
      retryAfter: Math.ceil((data.minuteStart + 60000 - now) / 1000)
    };
  }
  
  // Check daily limit
  if (data.dayCount >= API_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      limit: API_PER_DAY,
      reason: 'daily_limit',
      resetAt: getResetTime()
    };
  }
  
  return {
    allowed: true,
    remainingMinute: API_PER_MINUTE - data.minuteCount,
    remainingDay: API_PER_DAY - data.dayCount,
    reason: null
  };
}

/**
 * Consume an API key rate limit use
 */
export function consumeApiKeyLimit(apiKey) {
  const today = getTodayKey();
  const now = Date.now();
  let data = apiKeyLimits.get(apiKey);
  if (!data || data.date !== today) {
    data = { minuteCount: 0, minuteStart: now, dayCount: 0, date: today };
  }
  if (now - data.minuteStart > 60000) {
    data.minuteCount = 0;
    data.minuteStart = now;
  }
  data.minuteCount++;
  data.dayCount++;
  apiKeyLimits.set(apiKey, data);
}

/**
 * Check per-user web limit
 * @param {string} apiKey - The API key 
 * @param {string} userId - User ID from the website
 * @param {number} customLimit - Custom daily limit for this key (optional)
 * @returns {{ allowed: boolean, remaining: number, limit: number }}
 */
export function checkWebUserLimit(apiKey, userId, customLimit = null) {
  const today = getTodayKey();
  const limitKey = `${apiKey}:${userId}`;
  const dailyLimit = customLimit || WEB_USER_PER_DAY;
  let data = webUserLimits.get(limitKey);
  
  if (!data || data.date !== today) {
    data = { count: 0, date: today };
    webUserLimits.set(limitKey, data);
  }
  
  if (data.count >= dailyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: dailyLimit,
      resetAt: getResetTime(),
      reason: 'user_daily_limit'
    };
  }
  
  return {
    allowed: true,
    remaining: dailyLimit - data.count,
    limit: dailyLimit,
    resetAt: getResetTime(),
    reason: null
  };
}

/**
 * Consume a web user rate limit use
 */
export function consumeWebUserLimit(apiKey, userId) {
  const today = getTodayKey();
  const limitKey = `${apiKey}:${userId}`;
  let data = webUserLimits.get(limitKey);
  if (!data || data.date !== today) {
    data = { count: 0, date: today };
  }
  data.count++;
  webUserLimits.set(limitKey, data);
}

/**
 * Get next reset time (midnight local)
 */
function getResetTime() {
  const now = new Date();
  const reset = new Date(now);
  reset.setDate(reset.getDate() + 1);
  reset.setHours(0, 0, 0, 0);
  return reset.toISOString();
}

/**
 * Get Discord user's current usage stats
 */
export function getDiscordUsageStats(userId) {
  const today = getTodayKey();
  const data = discordLimits.get(userId);
  if (!data || data.date !== today) {
    return { used: 0, limit: DISCORD_PER_DAY, remaining: DISCORD_PER_DAY };
  }
  return {
    used: data.count,
    limit: DISCORD_PER_DAY,
    remaining: DISCORD_PER_DAY - data.count
  };
}

/**
 * Get Web user usage stats
 */
export function getWebUserUsageStats(apiKey, userId, customLimit = null) {
  const today = getTodayKey();
  const limitKey = `${apiKey}:${userId}`;
  const dailyLimit = customLimit || WEB_USER_PER_DAY;
  const data = webUserLimits.get(limitKey);
  if (!data || data.date !== today) {
    return { used: 0, limit: dailyLimit, remaining: dailyLimit };
  }
  return {
    used: data.count,
    limit: dailyLimit,
    remaining: dailyLimit - data.count
  };
}
