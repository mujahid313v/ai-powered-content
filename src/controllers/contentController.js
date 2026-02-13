const pool = require('../db/pool');
const { moderationQueue } = require('../services/queueService');

exports.submitContent = async (req, res) => {
  const { content_type, content_text, content_url, submitter_id, metadata } = req.body;
  
  try {
    // Get user ID from authenticated user (from JWT token)
    const userId = req.user ? req.user.id : null;
    
    // Insert content submission (metadata as JSON string for SQLite)
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const result = await pool.query(
      `INSERT INTO content_submissions (content_type, content_text, content_url, submitter_id, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [content_type, content_text, content_url, userId, metadataStr]
    );
    
    const contentId = result.rows[0].id;
    
    // Add to processing queue (skip if Redis not available)
    try {
      await moderationQueue.add({
        contentId,
        contentType: content_type,
        contentText: content_text,
        contentUrl: content_url
      });
    } catch (queueError) {
      console.log('Queue not available, content will need manual review');
      // Update status to under_review if queue fails
      await pool.query(
        `UPDATE content_submissions SET status = $1 WHERE id = $2`,
        ['under_review', contentId]
      );
    }
    
    res.status(202).json({
      message: 'Content submitted for moderation',
      content_id: contentId,
      status: 'pending'
    });
  } catch (error) {
    console.error('Submit content error:', error);
    res.status(500).json({ error: 'Failed to submit content' });
  }
};

exports.getContentStatus = async (req, res) => {
  const { id } = req.params;
  
  try {
    const contentResult = await pool.query(
      `SELECT cs.*, mr.overall_score, mr.decision, mr.reason
       FROM content_submissions cs
       LEFT JOIN moderation_results mr ON cs.id = mr.content_id
       WHERE cs.id = $1`,
      [id]
    );
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(contentResult.rows[0]);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to retrieve content status' });
  }
};

exports.batchSubmit = async (req, res) => {
  const { items } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }
  
  try {
    const contentIds = [];
    
    for (const item of items) {
      const result = await pool.query(
        `INSERT INTO content_submissions (content_type, content_text, content_url, submitter_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [item.content_type, item.content_text, item.content_url, item.submitter_id]
      );
      
      const contentId = result.rows[0].id;
      contentIds.push(contentId);
      
      try {
        await moderationQueue.add({
          contentId,
          contentType: item.content_type,
          contentText: item.content_text,
          contentUrl: item.content_url
        });
      } catch (queueError) {
        // Queue not available, mark for manual review
        await pool.query(
          `UPDATE content_submissions SET status = $1 WHERE id = $2`,
          ['under_review', contentId]
        );
      }
    }
    
    res.status(202).json({
      message: `${contentIds.length} items submitted for moderation`,
      content_ids: contentIds
    });
  } catch (error) {
    console.error('Batch submit error:', error);
    res.status(500).json({ error: 'Failed to submit batch' });
  }
};
