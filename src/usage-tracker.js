import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_PATH = path.join(__dirname, '../data/usage-logs.json');

// In-memory logs (flushed to disk periodically)
let logs = [];
let flushInterval = null;

/**
 * Initialize usage tracker
 */
export async function initUsageTracker() {
  await fs.ensureDir(path.dirname(LOGS_PATH));
  
  try {
    if (await fs.pathExists(LOGS_PATH)) {
      const data = await fs.readJson(LOGS_PATH);
      logs = Array.isArray(data) ? data : [];
      // Cleanup old logs (keep last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      logs = logs.filter(log => new Date(log.timestamp).getTime() > thirtyDaysAgo);
    }
  } catch (error) {
    console.error('Error loading usage logs:', error.message);
    logs = [];
  }
  
  // Flush to disk every 5 minutes
  flushInterval = setInterval(flushLogs, 5 * 60 * 1000);
  
  console.log(chalk.green(`📊 Usage tracker initialized with ${logs.length} historical logs`));
}

/**
 * Log a translation request
 */
export async function logRequest(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: data.source || 'unknown',    // 'discord' or 'web'
    apiKey: data.apiKey || null,           // Web API key (null for discord)
    userId: data.userId,                   // Discord user ID or web user ID
    format: data.format || 'text',
    contentSize: data.contentSize || 0,    // bytes
    status: data.status || 'success',      // success, error, cached
    tokensUsed: data.tokensUsed || 0,
    translationTime: data.translationTime || 0, // ms
    cached: data.cached || false,
    error: data.error || null,
  };
  
  logs.push(entry);
  
  // Auto-flush if too many pending
  if (logs.length % 50 === 0) {
    await flushLogs();
  }
  
  return entry;
}

/**
 * Get usage stats for a specific API key today
 */
export function getApiKeyStatsToday(apiKey) {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => 
    l.apiKey === apiKey && 
    l.timestamp.startsWith(today) &&
    l.status === 'success'
  );
  
  const uniqueUsers = new Set(todayLogs.map(l => l.userId));
  const totalTokens = todayLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0);
  const totalSize = todayLogs.reduce((sum, l) => sum + (l.contentSize || 0), 0);
  const cachedCount = todayLogs.filter(l => l.cached).length;
  
  return {
    totalRequests: todayLogs.length,
    uniqueUsers: uniqueUsers.size,
    totalTokens,
    totalSize,
    cachedRequests: cachedCount,
    users: [...uniqueUsers].map(userId => {
      const userLogs = todayLogs.filter(l => l.userId === userId);
      return {
        userId,
        requests: userLogs.length,
        tokensUsed: userLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0),
      };
    })
  };
}

/**
 * Get usage stats for a specific user under an API key
 */
export function getUserStats(apiKey, userId) {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l =>
    l.apiKey === apiKey &&
    l.userId === userId &&
    l.timestamp.startsWith(today)
  );
  
  const last7Days = logs.filter(l => {
    const logDate = new Date(l.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return l.apiKey === apiKey && l.userId === userId && logDate > weekAgo;
  });
  
  return {
    today: {
      requests: todayLogs.filter(l => l.status === 'success').length,
      errors: todayLogs.filter(l => l.status === 'error').length,
      cached: todayLogs.filter(l => l.cached).length,
    },
    last7Days: {
      requests: last7Days.filter(l => l.status === 'success').length,
      errors: last7Days.filter(l => l.status === 'error').length,
    }
  };
}

/**
 * Get overall stats
 */
export function getOverallStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
  
  return {
    totalLogsStored: logs.length,
    today: {
      total: todayLogs.length,
      success: todayLogs.filter(l => l.status === 'success').length,
      errors: todayLogs.filter(l => l.status === 'error').length,
      cached: todayLogs.filter(l => l.cached).length,
      discord: todayLogs.filter(l => l.source === 'discord').length,
      web: todayLogs.filter(l => l.source === 'web').length,
      uniqueUsers: new Set(todayLogs.map(l => l.userId)).size,
    }
  };
}

/**
 * Flush logs to disk
 */
async function flushLogs() {
  try {
    await fs.writeJson(LOGS_PATH, logs, { spaces: 2 });
  } catch (error) {
    console.error('Error flushing logs:', error.message);
  }
}

/**
 * Cleanup and shutdown
 */
export async function shutdownTracker() {
  if (flushInterval) {
    clearInterval(flushInterval);
  }
  await flushLogs();
}
