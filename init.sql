CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  repo_url TEXT NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  progress INT DEFAULT 0,
  result_path TEXT,
  error_message TEXT,
  result LONGTEXT,
  readme_md LONGTEXT,
  developer_guide_md LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);