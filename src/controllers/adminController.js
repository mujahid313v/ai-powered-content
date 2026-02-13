const pool = require('../db/pool');

exports.getReviewQueue = async (req, res) => {
  const { status = 'pending', limit = 50, offset = 0 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT rq.*, cs.content_type, cs.content_text, cs.content_url, 
              mr.overall_score, mr.decision, mr.reason
       FROM review_queue rq
       JOIN content_submissions cs ON rq.content_id = cs.id
       LEFT JOIN moderation_results mr ON cs.id = mr.content_id
       WHERE rq.status = $1
       ORDER BY rq.priority DESC, rq.added_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    res.json({
      items: result.rows,
      count: result.rows.length,
      status,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get review queue error:', error);
    res.status(500).json({ error: 'Failed to retrieve review queue' });
  }
};

exports.approveContent = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    // Update content status
    await pool.query(
      `UPDATE content_submissions SET status = 'approved', processed_at = NOW() WHERE id = $1`,
      [id]
    );
    
    // Update review queue
    await pool.query(
      `UPDATE review_queue SET status = 'completed', completed_at = NOW() WHERE content_id = $1`,
      [id]
    );
    
    // Log action
    await pool.query(
      `INSERT INTO audit_logs (action, content_id, details) VALUES ($1, $2, $3)`,
      ['approve_content', id, { notes }]
    );
    
    await pool.query('COMMIT');
    
    res.json({ message: 'Content approved', content_id: id });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Approve content error:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
};

exports.rejectContent = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    await pool.query(
      `UPDATE content_submissions SET status = 'rejected', processed_at = NOW() WHERE id = $1`,
      [id]
    );
    
    await pool.query(
      `UPDATE review_queue SET status = 'completed', completed_at = NOW() WHERE content_id = $1`,
      [id]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (action, content_id, details) VALUES ($1, $2, $3)`,
      ['reject_content', id, { reason }]
    );
    
    await pool.query('COMMIT');
    
    res.json({ message: 'Content rejected', content_id: id });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Reject content error:', error);
    res.status(500).json({ error: 'Failed to reject content' });
  }
};

exports.bulkAction = async (req, res) => {
  const { content_ids, action } = req.body;
  
  if (!Array.isArray(content_ids) || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await pool.query('BEGIN');
    
    for (const id of content_ids) {
      await pool.query(
        `UPDATE content_submissions SET status = $1, processed_at = NOW() WHERE id = $2`,
        [newStatus, id]
      );
      
      await pool.query(
        `UPDATE review_queue SET status = 'completed', completed_at = NOW() WHERE content_id = $1`,
        [id]
      );
    }
    
    await pool.query('COMMIT');
    
    res.json({ message: `${content_ids.length} items ${action}ed` });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
};
