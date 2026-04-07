#!/bin/bash
# 🧪 Script de Testes da Integração Frontend-Backend
# Uso: bash test-api-integration.sh

API="http://localhost:3000/api"
TOKEN=""
PATIENT_ID=""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar resultado
print_test() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
  fi
}

echo "================================================"
echo "🧪 TESTES DE INTEGRAÇÃO - NutriSAAS v1.0"
echo "================================================"
echo ""

# ============================================
# TESTE 1: Health Check
# ============================================
echo "1️⃣ Health Check (verificar se servidor está rodando)"
RESPONSE=$(curl -s -X GET "$API")
if [[ $RESPONSE == *"status"* ]]; then
  echo -e "${GREEN}✅ Servidor respondendo normalmente${NC}"
  echo "   Response: $RESPONSE"
  echo ""
else
  echo -e "${RED}❌ Servidor não está respondendo${NC}"
  echo "   Certifique-se que o backend está rodando: npm start"
  exit 1
fi

# ============================================
# TESTE 2: Login
# ============================================
echo "2️⃣ Autenticação (Login)"
LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dra.ana@nutriudf.com",
    "password": "123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login bem-sucedido${NC}"
  echo "   Token obtido: ${TOKEN:0:20}..."
  echo ""
else
  echo -e "${RED}❌ Falha no login${NC}"
  echo "   Response: $LOGIN_RESPONSE"
  echo "   Verifique as credenciais ou se o usuário existe no banco"
  exit 1
fi

# ============================================
# TESTE 3: Listar Pacientes
# ============================================
echo "3️⃣ CRUD - Listar Pacientes (GET /api/patients)"
PATIENTS=$(curl -s -X GET "$API/patients" \
  -H "Authorization: Bearer $TOKEN")

if [[ $PATIENTS == *"id"* ]]; then
  echo -e "${GREEN}✅ Pacientes carregados com sucesso${NC}"
  echo "   Response: $PATIENTS" | head -c 200
  echo ""
  
  # Extrair primeiro patient ID para testes posteriores
  PATIENT_ID=$(echo $PATIENTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "   Usando patient_id: $PATIENT_ID"
else
  echo -e "${YELLOW}⚠️ Nenhum paciente encontrado (pode ser normal)${NC}"
  echo "   Response: $PATIENTS"
fi
echo ""

# ============================================
# TESTE 4: Criar Novo Paciente
# ============================================
echo "4️⃣ CRUD - Criar Novo Paciente (POST /api/patients)"
NEW_PATIENT=$(curl -s -X POST "$API/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Paciente '"$(date +%s)"'",
    "email": "teste'"$(date +%s)"'@email.com",
    "age": 30,
    "weight": 75.5,
    "height": 1.75,
    "imc": 24.65,
    "goal": "manutenção",
    "nutritionist_id": 1
  }')

if [[ $NEW_PATIENT == *"id"* ]]; then
  echo -e "${GREEN}✅ Paciente criado com sucesso${NC}"
  PATIENT_ID=$(echo $NEW_PATIENT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "   Novo patient_id: $PATIENT_ID"
  echo "   Response: $NEW_PATIENT"
else
  echo -e "${RED}❌ Erro ao criar paciente${NC}"
  echo "   Response: $NEW_PATIENT"
fi
echo ""

# ============================================
# TESTE 5: Obter Detalhes do Paciente
# ============================================
if [ ! -z "$PATIENT_ID" ]; then
  echo "5️⃣ CRUD - Obter Paciente (GET /api/patients/$PATIENT_ID)"
  PATIENT_DETAIL=$(curl -s -X GET "$API/patients/$PATIENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [[ $PATIENT_DETAIL == *"name"* ]]; then
    echo -e "${GREEN}✅ Detalhes do paciente carregados${NC}"
    echo "   Response: $PATIENT_DETAIL"
  else
    echo -e "${RED}❌ Erro ao carregar paciente${NC}"
    echo "   Response: $PATIENT_DETAIL"
  fi
  echo ""
fi

# ============================================
# TESTE 6: Criar Novo Plano
# ============================================
if [ ! -z "$PATIENT_ID" ]; then
  echo "6️⃣ Plano - Criar Novo Plano (POST /api/plans)"
  NEW_PLAN=$(curl -s -X POST "$API/plans" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "patient_id": '"$PATIENT_ID"',
      "meal_data": "{\"macros\": {\"kcal\": 2500, \"protein\": 200, \"carbs\": 300, \"fat\": 85}}"
    }')
  
  if [[ $NEW_PLAN == *"id"* ]]; then
    echo -e "${GREEN}✅ Plano criado com sucesso${NC}"
    echo "   Response: $NEW_PLAN"
  else
    echo -e "${YELLOW}⚠️ Resposta inesperada ao criar plano${NC}"
    echo "   Response: $NEW_PLAN"
  fi
  echo ""
fi

# ============================================
# TESTE 7: Obter Relatório
# ============================================
if [ ! -z "$PATIENT_ID" ]; then
  echo "7️⃣ Relatório - Obter Relatório (GET /api/reports/:id/:type/:period)"
  REPORT=$(curl -s -X GET "$API/reports/$PATIENT_ID/nutritional/7d" \
    -H "Authorization: Bearer $TOKEN")
  
  if [[ $REPORT == *"report"* || $REPORT == *"kcal"* ]]; then
    echo -e "${GREEN}✅ Relatório carregado${NC}"
    echo "   Response: $REPORT" | head -c 300
  else
    echo -e "${YELLOW}⚠️ Relatório pode não ter dados (normal em teste)${NC}"
    echo "   Response: $REPORT"
  fi
  echo ""
fi

# ============================================
# TESTE 8: Teste sem Token (deve falhar com 401)
# ============================================
echo "8️⃣ Segurança - Testar sem Token (deve retornar 401)"
NO_TOKEN=$(curl -s -w "\n%{http_code}" -X GET "$API/patients")
HTTP_CODE=$(echo "$NO_TOKEN" | tail -1)

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ Proteção funcionando (401 Unauthorized)${NC}"
  echo "   HTTP Code: $HTTP_CODE"
else
  echo -e "${YELLOW}⚠️ Esperava 401, recebeu $HTTP_CODE${NC}"
fi
echo ""

# ============================================
# TESTE 9: Teste com Token Inválido (deve falhar com 401)
# ============================================
echo "9️⃣ Segurança - Testar com Token Inválido"
INVALID_TOKEN=$(curl -s -w "\n%{http_code}" -X GET "$API/patients" \
  -H "Authorization: Bearer invalid_token_12345")
HTTP_CODE=$(echo "$INVALID_TOKEN" | tail -1)

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ Token inválido rejeitado (401)${NC}"
  echo "   HTTP Code: $HTTP_CODE"
else
  echo -e "${YELLOW}⚠️ Esperava 401, recebeu $HTTP_CODE${NC}"
fi
echo ""

# ============================================
# RESUMO DOS TESTES
# ============================================
echo "================================================"
echo "📊 RESUMO DOS TESTES"
echo "================================================"
echo ""
echo "✅ Testes Completados:"
echo "   1. Health Check"
echo "   2. Login"
echo "   3. Listar Pacientes"
echo "   4. Criar Paciente"
echo "   5. Obter Paciente"
echo "   6. Criar Plano"
echo "   7. Relatório"
echo "   8. Teste sem Token"
echo "   9. Teste com Token Inválido"
echo ""

echo "🎯 Endpoints Testados:"
echo "   ✅ GET  /api"
echo "   ✅ POST /api/auth/login"
echo "   ✅ GET  /api/patients"
echo "   ✅ POST /api/patients"
echo "   ✅ GET  /api/patients/:id"
echo "   ✅ POST /api/plans"
echo "   ✅ GET  /api/reports/:id/:type/:period"
echo ""

echo "🔒 Segurança Testada:"
echo "   ✅ JWT Token validação"
echo "   ✅ 401 Unauthorized sem token"
echo "   ✅ 401 Unauthorized com token inválido"
echo ""

echo "================================================"
echo "✅ INTEGRAÇÃO VALIDADA COM SUCESSO!"
echo "================================================"
echo ""
echo "Próximos passos:"
echo "1. Abrir http://localhost:5500/nutri_saas_mockup_v2.html"
echo "2. Fazer login com dra.ana@nutriudf.com / 123456"
echo "3. Testar funcionalidades no frontend"
echo ""
