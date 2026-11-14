CREATE DATABASE IF NOT EXISTS emergency_ai;
USE emergency_ai;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(25),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen','officer') NOT NULL DEFAULT 'citizen',
  area VARCHAR(120),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE officers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  employee_code VARCHAR(60) UNIQUE,
  department VARCHAR(120),
  designation VARCHAR(120),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE complaints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_code VARCHAR(40) NOT NULL UNIQUE,
  citizen_id BIGINT NOT NULL,
  title VARCHAR(180),
  category VARCHAR(80),
  description TEXT NOT NULL,
  reported_location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  image_path VARCHAR(255),
  ai_category VARCHAR(80),
  ai_severity VARCHAR(30),
  urgency_score INT,
  priority VARCHAR(20),
  department VARCHAR(120),
  duplicate_of BIGINT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Submitted',
  assigned_to BIGINT NULL,
  remarks TEXT,
  resolution_image_path VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES officers(id),
  FOREIGN KEY (duplicate_of) REFERENCES complaints(id)
);

CREATE TABLE complaint_status_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id BIGINT NOT NULL,
  old_status VARCHAR(40),
  new_status VARCHAR(40) NOT NULL,
  changed_by BIGINT NOT NULL,
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  complaint_id BIGINT,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
);

CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_location ON complaints(latitude, longitude);
CREATE INDEX idx_status_history_complaint ON complaint_status_history(complaint_id);
