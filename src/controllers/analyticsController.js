const pool = require('../db/pool');

exports.getDashboard = async (req, res) => {
  try {
    // SQLite-compatible queries
    const stats = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review_count
      FROM content_submissions
      WHERE submitted_at >= datetime('now', '-24 hours')
    `);
    
    const avgProcessingTime = await pool.query(`
      SELECT AVG((julianday(processed_at) - julianday(submitted_at)) * 86400) as avg_seconds
      FROM content_submissions
      WHERE processed_at IS NOT NULL AND submitted_at >= datetime('now', '-24 hours')
    `);
    
    const appealStats = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_appeals,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_appeals,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_appeals
      FROM appeals
      WHERE created_at >= datetime('now', '-24 hours')
    `);
    
    res.json({
      last_24_hours: {
        content: stats.rows[0] || { pending_count: 0, approved_count: 0, rejected_count: 0, under_review_count: 0 },
        avg_processing_time_seconds: Math.round(avgProcessingTime.rows[0]?.avg_seconds || 0),
        appeals: appealStats.rows[0] || { pending_appeals: 0, approved_appeals: 0, rejected_appeals: 0 }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};
