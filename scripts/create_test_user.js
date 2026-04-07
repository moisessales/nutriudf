#!/usr/bin/env node
/**
 * Script para criar usuário de teste no banco de dados
 * Uso: node scripts/create_test_user.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

const TEST_USER = {
  full_name: 'Dra. Ana Silva',
  email: 'dra.ana@nutriudf.com',
  password: '123456',
  role: 'NUTRITIONIST'
};

async function createTestUser() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔐 Criando usuário de teste...');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Senha: ${TEST_USER.password}`);
    console.log(`   Nome: ${TEST_USER.full_name}`);
    console.log(`   Papel: ${TEST_USER.role}`);
    
    // Verificar se usuário já existe
    const [existing] = await connection.query('SELECT id FROM app_user WHERE email = ?', [TEST_USER.email]);
    if (existing.length > 0) {
      console.log('⚠️  Usuário já existe!');
      connection.release();
      process.exit(0);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
    console.log('✅ Senha hasheada com bcrypt');

    // Inserir usuário
    await connection.query(
      'INSERT INTO app_user (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [TEST_USER.full_name, TEST_USER.email, hashedPassword, TEST_USER.role, true]
    );

    console.log('✅ Usuário de teste criado com sucesso!');
    
    // Verificar dados inseridos
    const [rows] = await connection.query('SELECT id, full_name, email, role FROM app_user WHERE email = ?', [TEST_USER.email]);
    if (rows.length > 0) {
      console.log('\n📊 Dados do usuário:');
      console.log(`   ID: ${rows[0].id}`);
      console.log(`   Nome: ${rows[0].full_name}`);
      console.log(`   Email: ${rows[0].email}`);
      console.log(`   Papel: ${rows[0].role}`);
    }

    connection.release();
    console.log('\n✨ Pronto para fazer login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error.message);
    if (connection) connection.release();
    process.exit(1);
  }
}

createTestUser();
