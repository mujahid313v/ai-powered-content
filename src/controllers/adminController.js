const pool = require('../db/pool');

exports.getReviewQueue = async (req, res) => {
  const { status = 'pending', limit = 50, offset = 0 } = req.query;
  
  try {
    // Get content that needs review (pending or under_review status)
    const result = await pool.query(
      `SELECT cs.id, cs.content_type, cs.content_text, cs.content_url, 
              cs.status, cs.submitted_at, cs.submitter_id,
              mr.overall_score, mr.decision, mr.reason
       FROM content_submissions cs
       LEFT JOIN moderation_results mr ON cs.id = mr.content_id
       WHERE cs.status IN ('pending', 'under_review') AND cs.is_deleted = 0
       ORDER BY cs.submitted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
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
  
  console.log(`[NEW CODE] Approving content ID: ${id}`);
  
  try {
    // Update content status - simplified, no audit logs
    const result = await pool.query(
      `UPDATE content_submissions SET status = 'approved', processed_at = datetime('now') WHERE id = $1`,
      [id]
    );
    
    console.log(`[SUCCESS] Content ${id} approved, rows affected: ${result.rowCount || 1}`);
    res.json({ message: 'Content approved', content_id: id });
  } catch (error) {
    console.error('[ERROR] Approve content error:', error);
    res.status(500).json({ error: 'Failed to approve content', details: error.message });
  }
};

exports.rejectContent = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  console.log(`[NEW CODE] Rejecting content ID: ${id}`);
  
  try {
    // Update content status - simplified, no audit logs
    const result = await pool.query(
      `UPDATE content_submissions SET status = 'rejected', processed_at = datetime('now') WHERE id = $1`,
      [id]
    );
    
    console.log(`[SUCCESS] Content ${id} rejected, rows affected: ${result.rowCount || 1}`);
    res.json({ message: 'Content rejected', content_id: id, reason });
  } catch (error) {
    console.error('[ERROR] Reject content error:', error);
    res.status(500).json({ error: 'Failed to reject content', details: error.message });
  }
};

exports.bulkAction = async (req, res) => {
  const { content_ids, action } = req.body;
  
  if (!Array.isArray(content_ids) || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    for (const id of content_ids) {
      await pool.query(
        `UPDATE content_submissions SET status = $1, processed_at = datetime('now') WHERE id = $2`,
        [newStatus, id]
      );
    }
    
    res.json({ message: `${content_ids.length} items ${action}ed` });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
};
