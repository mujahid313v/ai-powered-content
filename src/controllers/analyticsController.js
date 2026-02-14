const pool = require('../db/pool');

exports.getDashboard = async (req, res) => {
  try {
    // Overall statistics
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review_count
      FROM content_submissions
      WHERE is_deleted = 0
    `);
    
    // Last 24 hours stats
    const last24Stats = await pool.query(`
      SELECT 
        COUNT(*) as total_24h,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_24h,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_24h,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_24h
      FROM content_submissions
      WHERE submitted_at >= datetime('now', '-24 hours') AND is_deleted = 0
    `);
    
    // Average processing time
    const avgProcessingTime = await pool.query(`
      SELECT AVG((julianday(processed_at) - julianday(submitted_at)) * 86400) as avg_seconds
      FROM content_submissions
      WHERE processed_at IS NOT NULL AND submitted_at >= datetime('now', '-7 days')
    `);
    
    // Appeal statistics
    const appealStats = await pool.query(`
      SELECT 
        COUNT(*) as total_appeals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_appeals,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_appeals,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_appeals
      FROM appeals
    `);
    
    // Content type breakdown
    const contentTypeStats = await pool.query(`
      SELECT 
        content_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM content_submissions
      WHERE is_deleted = 0
      GROUP BY content_type
    `);
    
    // Recent activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as submissions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM content_submissions
      WHERE submitted_at >= datetime('now', '-7 days') AND is_deleted = 0
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);
    
    // Top users by submissions
    const topUsers = await pool.query(`
      SELECT 
        u.email,
        u.full_name,
        COUNT(cs.id) as total_submissions,
        SUM(CASE WHEN cs.status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM users u
      JOIN content_submissions cs ON u.id = cs.submitter_id
      WHERE cs.is_deleted = 0
      GROUP BY u.id, u.email, u.full_name
      ORDER BY total_submissions DESC
      LIMIT 5
    `);
    
    const avgSeconds = Math.round(avgProcessingTime.rows[0]?.avg_seconds || 0);
    const approvalRate = overallStats.rows[0].total_submissions > 0 
      ? Math.round((overallStats.rows[0].approved_count / overallStats.rows[0].total_submissions) * 100)
      : 0;
    
    res.json({
      overall: {
        ...overallStats.rows[0],
        approval_rate: approvalRate
      },
      last_24_hours: last24Stats.rows[0],
      performance: {
        avg_processing_time_seconds: avgSeconds,
        avg_processing_time_formatted: formatTime(avgSeconds)
      },
      appeals: appealStats.rows[0],
      content_types: contentTypeStats.rows,
      recent_activity: recentActivity.rows,
      top_users: topUsers.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
