-- Content Moderation Platform Database Schema

-- Users table (moderators and admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'moderator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Content submissions
CREATE TABLE IF NOT EXISTS content_submissions (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video'
  content_url TEXT,
  content_text TEXT,
  submitter_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  metadata JSONB
);

-- Moderation results from AI
CREATE TABLE IF NOT EXISTS moderation_results (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content_submissions(id) ON DELETE CASCADE,
  ai_provider VARCHAR(100),
  toxicity_score DECIMAL(5,2),
  nsfw_score DECIMAL(5,2),
  spam_score DECIMAL(5,2),
  hate_speech_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  decision VARCHAR(50), -- 'safe', 'unsafe', 'review_needed'
  reason TEXT,
  raw_response JSONB,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review queue for human moderators
CREATE TABLE IF NOT EXISTS review_queue (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content_submissions(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Appeals from users
CREATE TABLE IF NOT EXISTS appeals (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content_submissions(id) ON DELETE CASCADE,
  user_reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  resolved_by INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  content_id INTEGER REFERENCES content_submissions(id),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics aggregations
CREATE TABLE IF NOT EXISTS analytics_daily (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_processed INTEGER DEFAULT 0,
  auto_approved INTEGER DEFAULT 0,
  auto_rejected INTEGER DEFAULT 0,
  human_reviewed INTEGER DEFAULT 0,
  appeals_submitted INTEGER DEFAULT 0,
  appeals_approved INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_content_status ON content_submissions(status);
CREATE INDEX idx_content_submitted_at ON content_submissions(submitted_at);
CREATE INDEX idx_moderation_content_id ON moderation_results(content_id);
CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_analytics_date ON analytics_daily(date);
