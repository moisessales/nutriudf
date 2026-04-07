#!/usr/bin/env node

const http = require('http');

// Test 1: Create patient
console.log('\n🧪 TEST 1: Criar novo paciente');
console.log('================================\n');

const testPatient = {
  name: 'João Silva',
  email: 'joao@example.com',
  age: 35,
  weight: 80,
  height: 1.75,
  goal: 'Emagrecimento',
  notes: 'Paciente de teste'
};

const tokenUrl = 'http://localhost:3000/api/auth/login';
const loginData = JSON.stringify({
  email: 'dra.ana@nutriudf.com',
  password: '123456'
});

function makeRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  try {
    // Get token
    console.log('1️⃣  Fazendo login...');
    const loginResponse = await makeRequest(tokenUrl, 'POST', loginData);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Falha no login:', loginResponse);
      process.exit(1);
    }

    const token = loginResponse.body.token;
    console.log('✅ Login bem-sucedido!');
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // Create patient
    console.log('\n2️⃣  Criando novo paciente...');
    const createResponse = await makeRequest(
      'http://localhost:3000/api/patients',
      'POST',
      JSON.stringify(testPatient),
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`   Status: ${createResponse.status}`);
    
    if (createResponse.status === 201) {
      console.log('✅ Paciente criado com sucesso!');
      console.log('   Dados retornados:');
      console.log(`   - ID: ${createResponse.body.id}`);
      console.log(`   - Nome: ${createResponse.body.full_name}`);
      console.log(`   - Email: ${createResponse.body.email}`);
      console.log(`   - IMC: ${createResponse.body.imc}`);
    } else {
      console.error('❌ Erro ao criar paciente:');
      console.error(`   Status: ${createResponse.status}`);
      console.error(`   Response:`, createResponse.body);
    }

    console.log('\n\n✅ TESTES CONCLUÍDOS!')
    console.log('='.repeat(50));
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

runTests();
