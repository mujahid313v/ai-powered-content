const pool = require('../db/pool');
const notificationService = require('../services/notificationService');

exports.getPendingAppeals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, cs.content_type, cs.content_text, cs.content_url, cs.submitted_at
       FROM appeals a
       JOIN content_submissions cs ON a.content_id = cs.id
       WHERE a.status = 'pending'
       ORDER BY a.created_at DESC`,
      []
    );

    res.json({
      appeals: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get pending appeals error:', error);
    res.status(500).json({ error: 'Failed to retrieve appeals' });
  }
};

exports.submitAppeal = async (req, res) => {
  const { content_id, user_reason } = req.body;

  try {
    // Check if content exists and is rejected
    const contentCheck = await pool.query(
      `SELECT status FROM content_submissions WHERE id = $1`,
      [content_id]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (contentCheck.rows[0].status !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected content can be appealed' });
    }

    // Check for existing pending appeal
    const existingAppeal = await pool.query(
      `SELECT id FROM appeals WHERE content_id = $1 AND status = 'pending'`,
      [content_id]
    );

    if (existingAppeal.rows.length > 0) {
      return res.status(400).json({ error: 'An appeal is already pending for this content' });
    }

    // Create appeal
    const result = await pool.query(
      `INSERT INTO appeals (content_id, user_reason) VALUES ($1, $2) RETURNING id`,
      [content_id, user_reason]
    );

    const appealId = result.rows[0].id;

    // Add back to review queue with high priority
    await pool.query(
      `INSERT INTO review_queue (content_id, priority) VALUES ($1, $2)`,
      [content_id, 9]
    );

    // Emit real-time notification for new appeal
    await notificationService.notifyAppealSubmitted({
      appealId,
      contentId,
      reason: user_reason
    });

    res.status(201).json({
      message: 'Appeal submitted successfully',
      appeal_id: appealId
    });
  } catch (error) {
    console.error('Submit appeal error:', error);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
};

exports.getAppealStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, cs.content_type, cs.status as content_status
       FROM appeals a
       JOIN content_submissions cs ON a.content_id = cs.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get appeal status error:', error);
    res.status(500).json({ error: 'Failed to retrieve appeal status' });
  }
};

exports.resolveAppeal = async (req, res) => {
  const { id } = req.params;
  const { decision, resolution_notes } = req.body;
  const moderatorId = req.user?.userId || req.user?.id || null;

  console.log(`[RESOLVE APPEAL] ID: ${id}, Decision: ${decision}`);

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be approved or rejected' });
  }

  try {
    // Get content_id from appeal
    const appealResult = await pool.query(
      `SELECT content_id FROM appeals WHERE id = $1`,
      [id]
    );

    if (appealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    const contentId = appealResult.rows[0].content_id;
    console.log(`[RESOLVE APPEAL] Content ID: ${contentId}`);

    // Update appeal status
    await pool.query(
      `UPDATE appeals SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = datetime('now') WHERE id = $4`,
      [decision, resolution_notes, moderatorId, id]
    );

    // Update content if appeal approved
    if (decision === 'approved') {
      await pool.query(
        `UPDATE content_submissions SET status = 'approved', processed_at = datetime('now') WHERE id = $1`,
        [contentId]
      );
      console.log(`[RESOLVE APPEAL] Content ${contentId} approved`);
    } else {
      console.log(`[RESOLVE APPEAL] Appeal denied, content remains rejected`);
    }

    // Emit real-time notification for appeal resolution
    await notificationService.notifyAppealResolved({
      appealId: id,
      contentId,
      status: decision,
      resolutionNotes: resolution_notes
    });

    res.json({ message: 'Appeal resolved', appeal_id: id, decision });
  } catch (error) {
    console.error('[ERROR] Resolve appeal error:', error);
    res.status(500).json({ error: 'Failed to resolve appeal', details: error.message });
  }
};
