#!/usr/bin/env node
/**
 * Script para inicializar o banco de dados (criar tabelas)
 * Uso: node init_db.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  try {
    // Conectar sem especificar database (para poder criar o banco)
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    const dbName = process.env.DB_NAME || 'nutriudf';
    console.log(`✅ Autenticação bem-sucedida`);

    // Criar banco de dados se não existir
    console.log(`📦 Criando banco de dados "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Banco de dados "${dbName}" pronto`);

    // Desconectar e reconectar com o banco
    await connection.end();

    console.log(`🔌 Conectando ao banco "${dbName}"...`);
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: dbName
    });
    console.log(`✅ Conectado ao banco "${dbName}"`);

    // Ler e executar schema
    const schemaPath = path.join(__dirname, '../db/migrations/0001_mysql_schema.sql');
    console.log(`📖 Lendo schema de: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Arquivo schema não encontrado: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Executar schema (dividir em statements individuais)
    console.log(`🏗️  Executando schema SQL...`);
    const statements = schema.split(';').filter(s => s.trim());
    let executed = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          executed++;
        } catch (err) {
          // Ignorar erros "já existe"
          if (!err.message.includes('already exists') && !err.message.includes('already') && !err.message.includes('ALREADY')) {
            console.warn(`⚠️  Aviso ao executar statement ${executed + 1}: ${err.message}`);
          }
        }
      }
    }

    console.log(`✅ Schema SQL executado! (${executed} statements)`);
    console.log(`\n🎉 Banco de dados inicializado com sucesso!`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

initializeDatabase();
