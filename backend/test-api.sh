#!/bin/bash
# Script de teste rápido da API NutriUDF

API_URL="http://localhost:3000/api"
DEVICE_ID=$(date +%s)
USER_EMAIL="test${DEVICE_ID}@test.com"
USER_PASSWORD="test123"

echo "🚀 Iniciando testes da API NutriUDF..."
echo "=====================================\n"

# 1. Verificar saúde da API
echo "1️⃣  Verificando saúde da API..."
curl -s http://localhost:3000/health | jq '.'
echo "\n"

# 2. Registrar novo usuário
echo "2️⃣  Registrando novo usuário..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\",
    \"name\": \"Teste User\",
    \"role\": \"nutritionist\"
  }")
echo "$REGISTER_RESPONSE" | jq '.'
echo "\n"

# 3. Login
echo "3️⃣  Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")
echo "$LOGIN_RESPONSE" | jq '.'

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "\n✅ Token: $TOKEN\n"

# 4. Listar pacientes
echo "4️⃣  Listando pacientes..."
curl -s -X GET "$API_URL/patients" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo "\n"

# 5. Criar novo paciente
echo "5️⃣  Criando novo paciente..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Maria Silva\",
    \"email\": \"maria@example.com\",
    \"age\": 28,
    \"weight\": 65,
    \"height\": 1.67,
    \"goal\": \"Emagrecimento\"
  }")
echo "$PATIENT_RESPONSE" | jq '.'

# Extrair ID do paciente
PATIENT_ID=$(echo "$PATIENT_RESPONSE" | jq -r '.id')
echo "\n✅ Patient ID: $PATIENT_ID\n"

# 6. Buscar relatório
echo "6️⃣  Buscando dados de relatório..."
curl -s -X GET "$API_URL/reports/$PATIENT_ID/nutritional/7d" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo "\n"

echo "✅ Testes concluídos!"
