const pool = require('../db/pool');

class NotificationService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map of userId -> Set of socket IDs
  }

  initialize(io) {
    this.io = io;
    console.log('✓ Notification service initialized');
  }

  /**
   * Register a socket for a user
   */
  registerSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
    console.log(`User ${userId} registered socket ${socketId}. Total sockets: ${this.userSockets.get(userId).size}`);
  }

  /**
   * Unregister a socket for a user
   */
  unregisterSocket(userId, socketId) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
      console.log(`User ${userId} unregistered socket ${socketId}. Remaining sockets: ${sockets.size}`);
    }
  }

  /**
   * Send notification to a specific user
   */
  async notifyUser(userId, notification) {
    if (!this.io) {
      console.warn('Notification service not initialized');
      return;
    }

    // Save to database
    await this.saveNotification(userId, notification);

    // Send via WebSocket
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
      console.log(`Notification sent to user ${userId} via ${sockets.size} socket(s)`);
    }
  }

  /**
   * Send notification to all connected moderators/admins
   */
  async notifyModerators(notification) {
    if (!this.io) {
      console.warn('Notification service not initialized');
      return;
    }

    // Save to database for all moderators
    await this.saveNotificationForAllModerators(notification);

    // Broadcast to admin room
    this.io.to('moderators').emit('notification', notification);
    console.log(`Notification broadcast to moderators: ${notification.type}`);
  }

  /**
   * Broadcast queue update to all connected clients
   */
  broadcastQueueUpdate(queueStats) {
    if (!this.io) return;

    this.io.emit('queue:update', queueStats);
    console.log(`Queue update broadcast: ${queueStats.pendingCount} pending, ${queueStats.reviewCount} under review`);
  }

  /**
   * Notify about new content submission
   */
  async notifyContentSubmitted(contentData) {
    const priority = contentData.priority || 'medium';
    const notification = {
      type: 'content:submitted',
      title: 'New Content Submitted',
      message: `${contentData.contentType} content submitted for moderation`,
      priority,
      timestamp: new Date().toISOString(),
      data: {
        contentId: contentData.contentId,
        contentType: contentData.contentType,
        priority
      }
    };

    await this.notifyModerators(notification);
    this.broadcastQueueUpdate(await this.getQueueStats());
  }

  /**
   * Notify about moderation completion
   */
  async notifyModerationCompleted(contentData) {
    const notification = {
      type: 'moderation:completed',
      title: 'Content Moderated',
      message: `Content ${contentData.contentId} was ${contentData.decision}`,
      priority: 'low',
      timestamp: new Date().toISOString(),
      data: {
        contentId: contentData.contentId,
        decision: contentData.decision,
        score: contentData.score
      }
    };

    await this.notifyModerators(notification);
    this.broadcastQueueUpdate(await this.getQueueStats());
  }

  /**
   * Notify about new appeal
   */
  async notifyAppealSubmitted(appealData) {
    const notification = {
      type: 'appeal:submitted',
      title: 'New Appeal Submitted',
      message: `User appealed content moderation decision`,
      priority: 'high',
      timestamp: new Date().toISOString(),
      data: {
        appealId: appealData.appealId,
        contentId: appealData.contentId,
        reason: appealData.reason
      }
    };

    await this.notifyModerators(notification);
  }

  /**
   * Notify about appeal resolution
   */
  async notifyAppealResolved(appealData) {
    const notification = {
      type: 'appeal:resolved',
      title: 'Appeal Resolved',
      message: `Appeal for content ${appealData.contentId} was ${appealData.status}`,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      data: {
        appealId: appealData.appealId,
        contentId: appealData.contentId,
        status: appealData.status,
        resolutionNotes: appealData.resolutionNotes
      }
    };

    await this.notifyModerators(notification);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const pendingResult = await pool.query(
        `SELECT COUNT(*) as count FROM content_submissions WHERE status = 'pending' AND is_deleted = 0`
      );
      const reviewResult = await pool.query(
        `SELECT COUNT(*) as count FROM content_submissions WHERE status = 'under_review' AND is_deleted = 0`
      );
      const totalTodayResult = await pool.query(
        `SELECT COUNT(*) as count FROM content_submissions WHERE date(submitted_at) = date('now')`
      );

      return {
        pendingCount: parseInt(pendingResult.rows[0]?.count || 0),
        reviewCount: parseInt(reviewResult.rows[0]?.count || 0),
        totalToday: parseInt(totalTodayResult.rows[0]?.count || 0),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting queue stats:', error.message);
      return { pendingCount: 0, reviewCount: 0, totalToday: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Save notification to database
   */
  async saveNotification(userId, notification) {
    try {
      const relatedContentId = notification.data?.contentId || null;
      const relatedAppealId = notification.data?.appealId || null;

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, related_content_id, related_appeal_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, notification.type, notification.title, notification.message, notification.priority, relatedContentId, relatedAppealId]
      );
    } catch (error) {
      console.error('Error saving notification:', error.message);
    }
  }

  /**
   * Save notification for all moderators
   */
  async saveNotificationForAllModerators(notification) {
    try {
      const moderatorsResult = await pool.query(
        `SELECT id FROM users WHERE role IN ('moderator', 'admin') AND is_deleted = 0`
      );

      const relatedContentId = notification.data?.contentId || null;
      const relatedAppealId = notification.data?.appealId || null;

      for (const moderator of moderatorsResult.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, priority, related_content_id, related_appeal_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [moderator.id, notification.type, notification.title, notification.message, notification.priority, relatedContentId, relatedAppealId]
        );
      }
    } catch (error) {
      console.error('Error saving notification for moderators:', error.message);
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_read = 0 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting unread notifications:', error.message);
      return [];
    }
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting recent notifications:', error.message);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0`,
        [userId]
      );
      return result.changes || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error.message);
      return 0;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0`,
        [userId]
      );
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error getting unread count:', error.message);
      return 0;
    }
  }

  /**
   * Clean up old notifications (older than 7 days)
   */
  async cleanupOldNotifications() {
    try {
      const result = await pool.query(
        `DELETE FROM notifications WHERE created_at < datetime('now', '-7 days')`
      );
      console.log(`Cleaned up ${result.changes || 0} old notifications`);
      return result.changes || 0;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error.message);
      return 0;
    }
  }
}

module.exports = new NotificationService();
