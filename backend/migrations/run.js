const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function runMigrations() {
  try {
    const conn = await connection;

    // Criar banco de dados
    console.log('📦 Criando banco de dados...');
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await conn.query(`USE ${process.env.DB_NAME}`);

    // Tabela de usuários
    console.log('👤 Criando tabela users...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'nutritionist',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabela de pacientes
    console.log('🏥 Criando tabela patients...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        age INT,
        weight DECIMAL(5, 2),
        height DECIMAL(3, 2),
        imc DECIMAL(5, 2),
        goal VARCHAR(100),
        kcal_target INT,
        protein_target DECIMAL(5, 2),
        carb_target DECIMAL(5, 2),
        fat_target DECIMAL(5, 2),
        water_target INT DEFAULT 2000,
        nutritionist_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (nutritionist_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_nutritionist (nutritionist_id)
      )
    `);

    // Tabela de planos de alimentação
    console.log('🍽️  Criando tabela meal_plans...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        meal_data LONGTEXT,
        date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        INDEX idx_patient (patient_id)
      )
    `);

    // Tabela de relatórios
    console.log('📊 Criando tabela reports...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        type VARCHAR(50),
        period VARCHAR(10),
        data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        INDEX idx_patient_period (patient_id, period),
        UNIQUE KEY unique_report (patient_id, type, period)
      )
    `);

    // Tabela de histórico de aderência
    console.log('📈 Criando tabela adherence_history...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS adherence_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        date_recorded DATETIME,
        adherence_percentage DECIMAL(5, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        INDEX idx_patient_date (patient_id, date_recorded)
      )
    `);

    console.log('✅ Migrações executadas com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

runMigrations();
