import crypto from 'crypto';
import NodeCache from 'node-cache';
import chalk from 'chalk';

// Cache with 24h TTL, check expired every 10 minutes
const cache = new NodeCache({ 
  stdTTL: 86400,       // 24 hours
  checkperiod: 600,    // Check every 10 min
  maxKeys: 5000,       // Max 5000 cached translations
  useClones: false     // Performance: don't clone on get
});

let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
};

/**
 * Generate hash key from content + format
 */
function generateKey(content, format, targetLang = 'vi') {
  const hash = crypto.createHash('sha256')
    .update(`${format}:${targetLang}:${content}`)
    .digest('hex');
  return `tr_${hash}`;
}

/**
 * Get cached translation
 * @returns {string|null} Cached translation or null
 */
export function getCachedTranslation(content, format, targetLang = 'vi') {
  const key = generateKey(content, format, targetLang);
  const cached = cache.get(key);
  
  if (cached) {
    stats.hits++;
    console.log(chalk.green(`💾 Cache HIT (${stats.hits} hits, ${stats.misses} misses, rate: ${getCacheHitRate()}%)`));
    return cached;
  }
  
  stats.misses++;
  return null;
}

/**
 * Store translation in cache
 */
export function setCachedTranslation(content, format, translatedContent, targetLang = 'vi') {
  const key = generateKey(content, format, targetLang);
  cache.set(key, translatedContent);
  stats.sets++;
  console.log(chalk.blue(`💾 Cache SET (${cache.keys().length} entries, ${stats.sets} total sets)`));
}

/**
 * Get cache hit rate percentage
 */
export function getCacheHitRate() {
  const total = stats.hits + stats.misses;
  if (total === 0) return 0;
  return Math.round((stats.hits / total) * 100);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    entries: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    sets: stats.sets,
    hitRate: getCacheHitRate(),
    memoryKeys: cache.getStats(),
  };
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.flushAll();
  stats = { hits: 0, misses: 0, sets: 0 };
  console.log(chalk.yellow('💾 Cache cleared'));
}
