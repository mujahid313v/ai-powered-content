const Queue = require('bull');
const aiService = require('./aiService');
const pool = require('../db/pool');
const notificationService = require('./notificationService');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 1,
};

let moderationQueue = null;
let queueAvailable = false;

// Handle Redis errors gracefully
process.on('uncaughtException', (err) => {
  if (err.message.includes('NOAUTH') || err.message.includes('Redis')) {
    console.log('Redis authentication failed, using fallback mode (manual review)');
    queueAvailable = false;
    return;
  }
  // Let other exceptions crash the process
  throw err;
});

// Initialize queue with error handling
const initQueue = async () => {
  try {
    const testRedis = require('ioredis');
    const testClient = new testRedis(redisConfig);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 2000);
      testClient.on('connect', () => { clearTimeout(timeout); resolve(); });
      testClient.on('error', (err) => { clearTimeout(timeout); reject(err); });
      testClient.on('close', () => { clearTimeout(timeout); reject(new Error('Redis connection closed')); });
    });

    await testClient.quit();

    // Redis is available, create queue
    moderationQueue = new Queue('content-moderation', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    moderationQueue.on('error', (err) => {
      console.log('Queue error (using fallback mode):', err.message);
      queueAvailable = false;
    });

    moderationQueue.on('ready', () => {
      console.log('✓ Bull queue connected to Redis');
      queueAvailable = true;
    });

    // Process jobs
    moderationQueue.process(async (job) => {
      const { contentId, contentType, contentText, contentUrl } = job.data;
      console.log(`Processing content ${contentId} (${contentType})`);

      let result;
      if (contentType === 'text') {
        result = await aiService.analyzeText(contentText);
      } else if (contentType === 'image') {
        result = await aiService.analyzeImage(contentUrl);
      } else if (contentType === 'video') {
        result = await aiService.analyzeVideo(contentUrl);
      }

      await pool.query(
        `INSERT INTO moderation_results
         (content_id, ai_provider, toxicity_score, nsfw_score, spam_score, hate_speech_score, overall_score, decision, raw_response)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          contentId,
          'custom_ml',
          result.toxicity_score || 0,
          result.nsfw_score || 0,
          result.spam_score || 0,
          result.hate_speech_score || 0,
          result.overall_score,
          result.decision,
          result.raw_response
        ]
      );

      let newStatus = 'approved';
      if (result.decision === 'unsafe') {
        newStatus = 'rejected';
      } else if (result.decision === 'review_needed') {
        newStatus = 'under_review';
        await pool.query(
          `INSERT INTO review_queue (content_id, priority) VALUES ($1, $2)`,
          [contentId, 7]
        );
      }

      await pool.query(
        `UPDATE content_submissions SET status = $1, processed_at = datetime('now') WHERE id = $2`,
        [newStatus, contentId]
      );

      await notificationService.notifyModerationCompleted({
        contentId,
        decision: newStatus,
        score: result.overall_score
      });

      return { contentId, decision: result.decision, status: newStatus };
    });

    moderationQueue.on('completed', (job, result) => {
      console.log(`✓ Job ${job.id} completed:`, result);
    });

    moderationQueue.on('failed', (job, err) => {
      console.error(`✗ Job ${job.id} failed:`, err.message);
    });

  } catch (error) {
    console.log('Redis not available, using fallback mode (manual review):', error.message);
    queueAvailable = false;
  }
};

// Initialize queue
initQueue();

module.exports = { moderationQueue, isQueueAvailable: () => queueAvailable };
