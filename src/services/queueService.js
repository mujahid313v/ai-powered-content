const Queue = require('bull');
const Redis = require('ioredis');
const aiService = require('./aiService');
const pool = require('../db/pool');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const moderationQueue = new Queue('content-moderation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Process jobs
moderationQueue.process(async (job) => {
  const { contentId, contentType, contentText, contentUrl } = job.data;
  
  console.log(`Processing content ${contentId} (${contentType})`);
  
  let result;
  
  // Analyze based on content type
  if (contentType === 'text') {
    result = await aiService.analyzeText(contentText);
  } else if (contentType === 'image') {
    result = await aiService.analyzeImage(contentUrl);
  } else if (contentType === 'video') {
    result = await aiService.analyzeVideo(contentUrl);
  }
  
  // Save moderation result
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
  
  // Update content status
  let newStatus = 'approved';
  if (result.decision === 'unsafe') {
    newStatus = 'rejected';
  } else if (result.decision === 'review_needed') {
    newStatus = 'under_review';
    
    // Add to review queue
    await pool.query(
      `INSERT INTO review_queue (content_id, priority) VALUES ($1, $2)`,
      [contentId, 7]
    );
  }
  
  await pool.query(
    `UPDATE content_submissions SET status = $1, processed_at = NOW() WHERE id = $2`,
    [newStatus, contentId]
  );
  
  return { contentId, decision: result.decision, status: newStatus };
});

// Event handlers
moderationQueue.on('completed', (job, result) => {
  console.log(`✓ Job ${job.id} completed:`, result);
});

moderationQueue.on('failed', (job, err) => {
  console.error(`✗ Job ${job.id} failed:`, err.message);
});

module.exports = { moderationQueue };
