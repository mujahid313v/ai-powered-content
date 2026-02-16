-- Content Moderation Platform Database Schema (SQLite)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  deleted_at DATETIME
);

-- Content submissions
CREATE TABLE IF NOT EXISTS content_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_url TEXT,
  content_text TEXT,
  submitter_id INTEGER,
  status TEXT DEFAULT 'pending',
  is_deleted INTEGER DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  deleted_at DATETIME,
  metadata TEXT,
  FOREIGN KEY (submitter_id) REFERENCES users(id)
);

-- Moderation results
CREATE TABLE IF NOT EXISTS moderation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  ai_provider TEXT,
  toxicity_score REAL,
  nsfw_score REAL,
  spam_score REAL,
  hate_speech_score REAL,
  overall_score REAL,
  decision TEXT,
  reason TEXT,
  raw_response TEXT,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_submissions(id) ON DELETE CASCADE
);

-- Review queue
CREATE TABLE IF NOT EXISTS review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  priority INTEGER DEFAULT 5,
  assigned_to INTEGER,
  status TEXT DEFAULT 'pending',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (content_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Appeals
CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  user_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resolved_by INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (content_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  user_id INTEGER,
  content_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (content_id) REFERENCES content_submissions(id)
);

-- Analytics
CREATE TABLE IF NOT EXISTS analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  total_processed INTEGER DEFAULT 0,
  auto_approved INTEGER DEFAULT 0,
  auto_rejected INTEGER DEFAULT 0,
  human_reviewed INTEGER DEFAULT 0,
  appeals_submitted INTEGER DEFAULT 0,
  appeals_approved INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  priority TEXT DEFAULT 'medium',
  is_read INTEGER DEFAULT 0,
  related_content_id INTEGER,
  related_appeal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_content_id) REFERENCES content_submissions(id),
  FOREIGN KEY (related_appeal_id) REFERENCES appeals(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);
CREATE INDEX IF NOT EXISTS idx_content_submitted_at ON content_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_moderation_content_id ON moderation_results(content_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
