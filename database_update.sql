CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'expert') DEFAULT 'patient',
    license_code VARCHAR(50) NULL,
    height INT NULL,
    weight INT NULL,
    blood_type VARCHAR(5) NULL,
    birth_date DATE NULL,
    emergency_contact VARCHAR(20) NULL,
    institution VARCHAR(100) NULL,
    title_degree VARCHAR(50) NULL,
    sip_number VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    severity VARCHAR(50),
    date DATE,
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    check_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagnosis_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    final_result VARCHAR(255) NOT NULL,
    confidence_score INT DEFAULT 0,
    symptoms_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20) UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20) UNIQUE,
    treatment_advice TEXT
);

CREATE TABLE IF NOT EXISTS research_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT,
    content JSON,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    source_journal VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnosis_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symptom_combination JSON,
    disease_code VARCHAR(20),
    confidence FLOAT
);

INSERT IGNORE INTO users (name, email, password, role, license_code) VALUES 
('Dr. Sarah Sp.P', 'admin@respira.id', 'admin', 'expert', 'DOKTER123'),
('Budi Santoso', 'user@gmail.com', 'user123', 'patient', NULL);
