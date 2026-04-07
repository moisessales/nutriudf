const fs = require('fs');
const pool = require('./backend/src/config/database');

async function runMigration() {
  console.log('🔄 Executando migração 0003_fix_patient_schema.sql...');
  
  const sqlFile = './db/migrations/0003_fix_patient_schema.sql';
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  const connection = await pool.getConnection();
  
  try {
    // Dividir por ; e executar cada comando
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executando: ${statement.substring(0, 60)}...`);
      await connection.execute(statement);
    }
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
