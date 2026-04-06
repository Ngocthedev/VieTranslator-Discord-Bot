import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { validateApiKey, incrementKeyUsage } from './api-key-manager.js';
import { checkApiKeyLimit, consumeApiKeyLimit, checkWebUserLimit, consumeWebUserLimit, getWebUserUsageStats } from './rate-limiter.js';
import { logRequest, getOverallStats, getUserStats, getApiKeyStatsToday } from './usage-tracker.js';
import { translateContent } from './translator.js';
import { translateShortText } from './ai-service.js';
import { getCacheStats } from './translation-cache.js';
import { getQuotaStatus } from './ai-service.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.API_CORS_ORIGINS === '*' ? '*' : process.env.API_CORS_ORIGINS?.split(','),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// Auth Middleware
// ============================================================

function extractApiKey(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Check X-API-Key header
  return req.headers['x-api-key'] || null;
}

function requireAuth(req, res, next) {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'API key is required. Use Authorization: Bearer <key> or X-API-Key header.',
    });
  }

  const { valid, keyData, reason } = validateApiKey(apiKey);
  if (!valid) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: reason,
    });
  }

  // Check API key rate limit
  const keyLimit = checkApiKeyLimit(apiKey);
  if (!keyLimit.allowed) {
    return res.status(429).json({
      error: keyLimit.reason === 'minute_limit' ? 'RATE_LIMIT_MINUTE' : 'RATE_LIMIT_DAILY',
      message: keyLimit.reason === 'minute_limit'
        ? `Quá giới hạn ${keyLimit.limit} requests/phút. Thử lại sau ${keyLimit.retryAfter}s.`
        : `Quá giới hạn ${keyLimit.limit} requests/ngày. Reset lúc 00:00.`,
      retryAfter: keyLimit.retryAfter || undefined,
      resetAt: keyLimit.resetAt || undefined,
    });
  }

  req.apiKey = apiKey;
  req.keyData = keyData;
  next();
}

// ============================================================
// API Routes
// ============================================================

/**
 * POST /api/v1/translate — Translate file content
 */
app.post('/api/v1/translate', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const { content, format = 'text', target_lang = 'vi', user_id } = req.body;

  // Validate request
  if (!content) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Missing "content" field',
    });
  }

  if (!user_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Missing "user_id" field. Each request must identify the end user.',
    });
  }

  // Check content size
  const maxSize = req.keyData.config.maxFileSize || 5 * 1024 * 1024;
  if (Buffer.byteLength(content, 'utf8') > maxSize) {
    return res.status(413).json({
      error: 'CONTENT_TOO_LARGE',
      message: `Content exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    });
  }

  // Check format
  const allowedFormats = req.keyData.config.allowedFormats || [];
  if (allowedFormats.length > 0 && !allowedFormats.includes(format)) {
    return res.status(400).json({
      error: 'UNSUPPORTED_FORMAT',
      message: `Format "${format}" is not allowed. Allowed: ${allowedFormats.join(', ')}`,
    });
  }

  // Check per-user daily limit
  const dailyLimit = req.keyData.config.dailyLimitPerUser || 10;
  const userLimit = checkWebUserLimit(req.apiKey, user_id, dailyLimit);
  if (!userLimit.allowed) {
    return res.status(429).json({
      error: 'USER_DAILY_LIMIT_EXCEEDED',
      message: 'Bạn đã hết lượt dịch hôm nay.',
      remaining: 0,
      limit: userLimit.limit,
      resetAt: userLimit.resetAt,
    });
  }

  try {
    console.log(chalk.cyan(`🌐 Web API: translate request from user ${user_id} (key: ${req.apiKey.substring(0, 12)}...)`));

    const result = await translateContent(content, format, `web_${user_id}`);

    // Consume rate limits
    consumeApiKeyLimit(req.apiKey);
    consumeWebUserLimit(req.apiKey, user_id);
    await incrementKeyUsage(req.apiKey);

    // Log the request
    const translationTime = Date.now() - startTime;
    await logRequest({
      source: 'web',
      apiKey: req.apiKey,
      userId: user_id,
      format,
      contentSize: Buffer.byteLength(content, 'utf8'),
      status: 'success',
      translationTime,
      cached: result.cached,
    });

    // Get remaining usage
    const usage = getWebUserUsageStats(req.apiKey, user_id, dailyLimit);

      res.json({
        success: true,
        data: {
          translated: result.content,
          cached: result.cached,
          warnings: result.warnings,
          format,
          originalSize: content.length,
          translatedSize: result.content.length,
          translationTimeMs: translationTime,
        },
        usage: {
          remaining: usage.remaining,
          limit: usage.limit,
          used: usage.used,
        }
      });
  } catch (error) {
    console.error(chalk.red(`❌ Web translate error: ${error.message}`));

    await logRequest({
      source: 'web',
      apiKey: req.apiKey,
      userId: user_id,
      format,
      contentSize: Buffer.byteLength(content, 'utf8'),
      status: 'error',
      error: error.message,
    });

    res.status(500).json({
      error: 'TRANSLATION_FAILED',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/translate/text — Translate short text
 */
app.post('/api/v1/translate/text', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const { text, user_id } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Missing "text" field',
    });
  }

  if (!user_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Missing "user_id" field',
    });
  }

  if (text.length > 5000) {
    return res.status(400).json({
      error: 'TEXT_TOO_LONG',
      message: 'Text must be under 5000 characters. Use /translate for larger content.',
    });
  }

  // Check per-user daily limit
  const dailyLimit = req.keyData.config.dailyLimitPerUser || 10;
  const userLimit = checkWebUserLimit(req.apiKey, user_id, dailyLimit);
  if (!userLimit.allowed) {
    return res.status(429).json({
      error: 'USER_DAILY_LIMIT_EXCEEDED',
      message: 'Bạn đã hết lượt dịch hôm nay.',
      remaining: 0,
      limit: userLimit.limit,
      resetAt: userLimit.resetAt,
    });
  }

  try {
    const translated = await translateShortText(text, `web_${user_id}`);

    consumeApiKeyLimit(req.apiKey);
    consumeWebUserLimit(req.apiKey, user_id);
    await incrementKeyUsage(req.apiKey);

    const translationTime = Date.now() - startTime;
    await logRequest({
      source: 'web',
      apiKey: req.apiKey,
      userId: user_id,
      format: 'text',
      contentSize: text.length,
      status: 'success',
      translationTime,
    });

    const usage = getWebUserUsageStats(req.apiKey, user_id, dailyLimit);

    res.json({
      success: true,
      data: {
        original: text,
        translated,
        translationTimeMs: translationTime,
      },
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
        used: usage.used,
      }
    });
  } catch (error) {
    await logRequest({
      source: 'web',
      apiKey: req.apiKey,
      userId: user_id,
      format: 'text',
      contentSize: text.length,
      status: 'error',
      error: error.message,
    });

    res.status(500).json({
      error: 'TRANSLATION_FAILED',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/status — Health check & server stats (public)
 */
app.get('/api/v1/status', (req, res) => {
  const stats = getOverallStats();
  const cacheStats = getCacheStats();

  res.json({
    status: 'online',
    version: '2.0.0',
    uptime: Math.floor(process.uptime()),
    stats: {
      today: stats.today,
      cache: {
        entries: cacheStats.entries,
        hitRate: `${cacheStats.hitRate}%`,
      }
    }
  });
});

/**
 * GET /api/v1/key/info — API key info (authenticated)
 */
app.get('/api/v1/key/info', requireAuth, (req, res) => {
  const keyData = req.keyData;
  const keyStats = getApiKeyStatsToday(req.apiKey);

  res.json({
    success: true,
    key: {
      name: keyData.name,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      isActive: keyData.isActive,
      config: keyData.config,
    },
    usage: {
      today: keyStats,
      total: keyData.stats.totalRequests,
    }
  });
});

/**
 * GET /api/v1/user/:userId/usage — User usage stats (authenticated)
 */
app.get('/api/v1/user/:userId/usage', requireAuth, (req, res) => {
  const { userId } = req.params;
  const dailyLimit = req.keyData.config.dailyLimitPerUser || 10;
  const usage = getWebUserUsageStats(req.apiKey, userId, dailyLimit);
  const detailed = getUserStats(req.apiKey, userId);

  res.json({
    success: true,
    userId,
    usage,
    detailed,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} not found. Available: POST /api/v1/translate, POST /api/v1/translate/text, GET /api/v1/status, GET /api/v1/key/info`,
  });
});

/**
 * Start the API server
 */
export function startApiServer() {
  const port = parseInt(process.env.API_PORT) || 3000;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan(`🌐 Web API Server running on port ${port}`));
      console.log(chalk.cyan(`   Endpoints:`));
      console.log(chalk.white(`   POST /api/v1/translate       — Dịch file content`));
      console.log(chalk.white(`   POST /api/v1/translate/text  — Dịch text ngắn`));
      console.log(chalk.white(`   GET  /api/v1/status          — Health check`));
      console.log(chalk.white(`   GET  /api/v1/key/info        — API key info`));
      console.log(chalk.white(`   GET  /api/v1/user/:id/usage  — User usage`));
      console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      resolve(server);
    });

    server.on('error', (error) => {
      console.error(chalk.red(`❌ API Server error: ${error.message}`));
      reject(error);
    });
  });
}
