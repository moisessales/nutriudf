const pool = require('./database');

const MIGRATIONS = [
  {
    name: 'meal_plans',
    sql: `CREATE TABLE IF NOT EXISTS meal_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      meal_data LONGTEXT,
      date DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_meal_plans_patient (patient_id)
    )`
  },
  {
    name: 'reports',
    sql: `CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      type VARCHAR(50),
      period VARCHAR(10),
      data LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reports_patient (patient_id, period)
    )`
  },
  {
    name: 'adherence_history',
    sql: `CREATE TABLE IF NOT EXISTS adherence_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      date_recorded DATETIME,
      adherence_percentage DECIMAL(5, 2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_adherence_patient (patient_id, date_recorded)
    )`
  },
  {
    name: 'idx_password_reset_token_active',
    sql: `SELECT 1`,
    check: async () => {
      const [rows] = await pool.query(
        `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'password_reset_token' AND INDEX_NAME = 'idx_prt_token_used' LIMIT 1`
      );
      return rows.length > 0;
    },
    migrate: async () => {
      await pool.query(`CREATE INDEX idx_prt_token_used ON password_reset_token(token, used)`);
    }
  },
  {
    name: 'idx_consultation_nutritionist',
    sql: `SELECT 1`,
    check: async () => {
      const [rows] = await pool.query(
        `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'consultation' AND INDEX_NAME = 'idx_consult_nutri_date' LIMIT 1`
      );
      return rows.length > 0;
    },
    migrate: async () => {
      await pool.query(`CREATE INDEX idx_consult_nutri_date ON consultation(nutritionist_id, starts_at, status)`);
    }
  },
  {
    name: 'patient.email_verified',
    sql: `SELECT 1`,
    check: async () => {
      const [cols] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'app_user' AND COLUMN_NAME = 'email_verified'`
      );
      return cols.length > 0;
    },
    migrate: async () => {
      await pool.query(`ALTER TABLE app_user ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE`);
    }
  }
];

async function autoMigrate() {
  for (const m of MIGRATIONS) {
    try {
      if (m.check) {
        const exists = await m.check();
        if (!exists && m.migrate) {
          await m.migrate();
          console.log(`[AutoMigrate] ✅ ${m.name} aplicada`);
        }
      } else {
        await pool.query(m.sql);
        console.log(`[AutoMigrate] ✅ ${m.name} ok`);
      }
    } catch (err) {
      console.error(`[AutoMigrate] ⚠️  ${m.name}: ${err.message}`);
    }
  }
}

module.exports = autoMigrate;
