# 🧪 Guia Completo de Testes - Integração Frontend-Backend

**Status**: ✅ Integração completa implementada  
**Última atualização**: $(date)  
**Versão**: 1.0

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Inicializar o Backend](#inicializar-o-backend)
3. [Testar Autenticação](#testar-autenticação)
4. [Testar Pacientes](#testar-pacientes)
5. [Testar Planos](#testar-planos)
6. [Testar Relatórios](#testar-relatórios)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário
- **Node.js** 14+ ([Instalar](https://nodejs.org))
- **MySQL** 5.7+ ou **MariaDB** 10.2+ ([Instalar](https://www.mysql.com/downloads/))
- **Git** (opcional, para versionamento)

### Portas Necessárias
- **3000** - Backend Node.js/Express
- **3306** - MySQL Database
- **5500** - Frontend (Live Server) ou outro servidor HTTP

### Verificar Instalação

```bash
# Verificar Node.js
node --version  # v14.0.0 ou superior

# Verificar npm
npm --version  # 6.0.0 ou superior

# Verificar MySQL
mysql --version  # 5.7.0 ou superior
```

---

## 🚀 Inicializar o Backend

### 1️⃣ Instalar Dependências

```bash
cd nutriudf/backend
npm install
```

**Dependências instaladas:**
- express (framework web)
- mysql2 (driver MySQL)
- dotenv (variáveis de ambiente)
- jsonwebtoken (autenticação JWT)
- bcryptjs (hash de senhas)
- cors (compartilhamento de origem)
- body-parser (parsing JSON)

### 2️⃣ Configurar Banco de Dados

#### Criar Database
```bash
mysql -u root -p

# Dentro do MySQL CLI
CREATE DATABASE nutriudf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Configurar Arquivo `.env`

Criar arquivo `nutriudf/backend/.env`:

```env
# Configuração do MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=nutriudf
DB_PORT=3306

# Configuração de API
PORT=3000
NODE_ENV=development

# Secret do JWT
JWT_SECRET=sua_chave_super_secreta_aqui_12345

# CORS
FRONTEND_URL=http://localhost:5500
```

#### Executar Migrations

```bash
cd nutriudf/backend
node migrations/run.js
```

**Saída esperada:**
```
✅ Tabela 'users' criada/verificada
✅ Tabela 'patients' criada/verificada
✅ Tabela 'meal_plans' criada/verificada
✅ Tabela 'reports' criada/verificada
✅ Tabela 'adherence_history' criada/verificada
```

#### Inserir Dados de Teste

```bash
mysql -u root -p nutriudf < dados_teste.sql
```

Ou inserir manualmente:

```sql
# Inserir usuário de teste
INSERT INTO users (email, password, name, role) VALUES (
  'dra.ana@nutriudf.com',
  '$2b$10$XQq8dP5zN1K2mL9pQ4R8L.2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E', -- senha: 123456
  'Dra. Ana Nunes',
  'nutritionist'
);

# Inserir paciente de teste
INSERT INTO patients (name, email, age, weight, height, imc, goal, nutritionist_id) VALUES (
  'João Silva',
  'joao@email.com',
  32,
  85.5,
  1.78,
  27.04,
  'perda de peso',
  1
);
```

### 3️⃣ Iniciar o Sistema

**Terminal 1 - Backend:**
```bash
cd nutriudf/backend
npm start

# Outputs esperado:
# 🚀 Servidor rodando em http://localhost:3000
# ✅ Conexão MySQL estabelecida
```

**Terminal 2 - Frontend:**
```bash
cd nutriudf

# Opção 1: Usar Live Server (VS Code)
# - Clique direito em nutri_saas_mockup_v2.html
# - "Open with Live Server"

# Opção 2: Usar servidor Python
python -m http.server 5500

# Opção 3: Usar Node.js
npx http-server -p 5500
```

Abrir browser: `http://localhost:5500/nutri_saas_mockup_v2.html`

---

## 🔐 Testar Autenticação

### 1. Tela de Login

Ao abrir a aplicação, você deve ver:

```
┌─────────────────────────────────┐
│                                 │
│    [Logo] Nutri.app             │
│    Bem-vindo                    │
│    Plataforma de gestão         │
│                                 │
│    [Email input]                │
│    [Senha input]                │
│    [Entrar button]              │
│                                 │
│    Credenciais de teste:        │
│    Email: dra.ana@nutriudf.com  │
│    Senha: 123456                │
│                                 │
└─────────────────────────────────┘
```

### 2. Fazer Login

1. Preencher email: `dra.ana@nutriudf.com`
2. Preencher senha: `123456`
3. Clicar "Entrar"

**Resultado esperado:**
- ✅ Redirecionar para Dashboard
- ✅ Token armazenado em `localStorage` como `authToken`
- ✅ Usuário armazenado em `localStorage` como `currentUser`
- ✅ Nome do usuário aparecer na sidebar

**Verificar no Console:**
```javascript
// Abrir DevTools (F12) e executar:
localStorage.getItem('authToken')   // Deve retornar um token JWT
JSON.parse(localStorage.getItem('currentUser'))  // Deve retornar objeto do usuário
```

### 3. Testar Logout

1. Clicar botão "Sair" na sidebar
2. Confirmar

**Resultado esperado:**
- ✅ Voltar para tela de login
- ✅ localStorage limpo
- ✅ Sessão finalizada

---

## 👥 Testar Pacientes

### 1. Criar Novo Paciente

**Dashboard → "Novo paciente"**

Preencher formulário:
```
Nome: Maria Santos
Email: maria@email.com
Idade: 28
Peso: 72 kg
Altura: 1.65 m
Objetivo: ganho de massa
Observações: (opcional)
```

Clicar "Salvar"

**Resultado esperado:**
- ✅ Mensagem de sucesso com IMC calculado
- ✅ Paciente salvo no banco de dados
- ✅ Modal fecha automaticamente

**Verificar no banco:**
```sql
SELECT * FROM patients WHERE email = 'maria@email.com';
```

### 2. Listar Pacientes

**Menu → Pacientes**

**Resultado esperado:**
- ✅ Tabela carregada com lista de pacientes
- ✅ Mostrar: Nome, Email, Idade, Peso, IMC, Objetivo
- ✅ Botão "Editar" disponível

**Dados na tabela:**
| Nome | Email | Idade | Peso | IMC | Objetivo |
|------|-------|-------|------|-----|----------|
| João Silva | joao@email.com | 32 | 85.5 | 27.04 | Perda de peso |
| Maria Santos | maria@email.com | 28 | 72 | 26.49 | Ganho de massa |

### 3. Cálculo de IMC

**Validação:**
```
Peso: 70 kg
Altura: 1.75 m
IMC = 70 / (1.75²) = 70 / 3.0625 = 22.86

Status:
18.5 - 24.9 = Normal ✅
25.0 - 29.9 = Sobrepeso ⚠️
30.0+ = Obesidade ❌
```

---

## 🍽️ Testar Planos

### 1. Criar Novo Plano de Macros

**Dashboard → "Novo plano"**

Preencher formulário:
```
Paciente: João Silva
Calorias: 2500 kcal
Proteína: 200 g
Carboidrato: 300 g
Gordura: 85 g
Duração: 30 dias
Observações: (opcional)
```

Clicar "Criar Plano"

**Resultado esperado:**
- ✅ Mensagem de sucesso com macros resumidas
- ✅ Percentuais calculados:
  - Proteína: 32%
  - Carboidrato: 48%
  - Gordura: 30.6%
- ✅ Plano salvo no banco
- ✅ Redirecionar para tela de Planos alimentares

### 2. Estrutura de Resposta da API

```json
{
  "id": 1,
  "patient_id": 1,
  "meal_data": {
    "macros": {
      "kcal": 2500,
      "protein": 200,
      "carbs": 300,
      "fat": 85
    },
    "duration": 30
  },
  "created_at": "2025-04-03T10:30:00.000Z"
}
```

### 3. Salvar Plano com Refeições

Na tela de Planos, adicionar alimentos e clicar "Salvar Plano"

**Resultado esperado:**
- ✅ Dados salvos no banco
- ✅ Refeições armazenadas como JSON
- ✅ Macros persistidas

---

## 📊 Testar Relatórios

### 1. Acessar Relatórios

**Menu → Relatórios**

**Resultado esperado:**
- ✅ Primeira vez: mostra dados de teste (fallback local)
- ✅ Com servidor: dados carregados da API
- ✅ 4 abas disponíveis:
  1. Nutricional
  2. Progresso
  3. Aderência
  4. Recomendações

### 2. Testar Mudança de Período

Clicar nos botões:
- **7d** (7 dias)
- **30d** (30 dias)
- **90d** (90 dias)

**Resultado esperado:**
- ✅ Dados atualizados na API
- ✅ Gráficos atualizados
- ✅ Estatísticas recalculadas

### 3. Testar Mudança de Paciente

Na caixa "Paciente", selecionar outro paciente

**Resultado esperado:**
- ✅ Todos os relatórios atualizados
- ✅ Dados pessoais sincronizados
- ✅ Gráficos recarregados

### 4. Verificar Dados da API

Abrir DevTools (F12) → Network → Filter: "XHR"

Exemplo de requisição:

```
GET /api/reports/1/nutritional/7d HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Resposta esperada:
```json
{
  "patient_id": 1,
  "report_type": "nutritional",
  "period": "7d",
  "kcal_target": 2500,
  "protein_target": 200,
  "carb_target": 300,
  "fat_target": 85,
  "water_current": 2.5,
  "water_target": 3.0
}
```

---

## 🔌 Verificar Saúde da API

### 1. Health Check Manual

```bash
curl http://localhost:3000/api

# ou no browser:
http://localhost:3000/api
```

**Resultado esperado (200 OK):**
```json
{
  "status": "OK",
  "message": "API NutriSAAS v1.0",
  "endpoints": {
    "auth": "/api/auth",
    "patients": "/api/patients",
    "plans": "/api/plans",
    "reports": "/api/reports"
  }
}
```

### 2. Verificar Banco de Dados

```bash
mysql -u root -p nutriudf

# Verificar tabelas criadas
SHOW TABLES;

# Verificação:
# ✅ users
# ✅ patients
# ✅ meal_plans
# ✅ reports
# ✅ adherence_history

# Contar registros
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM users;
```

### 3. Verificar Conexão no Console

```javascript
// DevTools Console (F12)

// Testar conexão básica
fetch('http://localhost:3000/api')
  .then(r => r.json())
  .then(d => console.log('✅ Servidor respondendo:', d))
  .catch(e => console.error('❌ Erro:', e))

// Testar login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'dra.ana@nutriudf.com',
    password: '123456'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Login resposta:', d))
.catch(e => console.error('❌ Erro:', e))
```

---

## 🐛 Troubleshooting

### Problema: "Cannot GET /api"

**Causa**: Backend não está rodando

**Solução:**
```bash
# Terminal do backend
cd nutriudf/backend
npm start

# Verificar se mostra:
# 🚀 Servidor rodando em http://localhost:3000
```

### Problema: "Error: connect ECONNREFUSED"

**Causa**: MySQL não está conectado

**Solução:**
```bash
# Verificar se MySQL está rodando
mysql -u root -p

# Se não conseguir entrar:
# Windows: Iniciar MySQL do Services
# Mac: brew services start mysql
# Linux: sudo service mysql start
```

### Problema: "JWT malformed" no Console

**Causa**: Token inválido ou expirado

**Solução:**
```javascript
// DevTools Console
localStorage.removeItem('authToken')
localStorage.removeItem('currentUser')
// Fazer login novamente
```

### Problema: CORS Error "Access to XMLHttpRequest blocked"

**Causa**: Backend não autoriza origem do frontend

**Solução**: Editar `backend/server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:5500',  // Adicionar URL do frontend
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Problema: "Erro ao criar paciente: undefined"

**Causa**: Campos obrigatórios vazios ou formato incorreto

**Solução:**
1. Abrir DevTools (F12)
2. Clicar em "Network"
3. Criar novo paciente
4. Clicar na requisição POST em /api/patients
5. Ver o erro exato no Response

Campos obrigatórios:
```javascript
{
  name: "string",           // ✅ Obrigatório
  email: "email válido",    // ✅ Obrigatório
  age: "número",            // ✅ Obrigatório
  weight: "número",         // ✅ Obrigatório
  height: "número (0-2)",   // ✅ Obrigatório
  imc: "será calculado",    // ✅ Calculado automaticamente
  goal: "string",           // ✅ Obrigatório
  nutritionist_id: "número"  // ✅ Do token JWT
}
```

### Problema: "Database error: ER_NO_DEFAULT_VALUE_FOR_FIELD"

**Causa**: Campo obrigatório não preenchido

**Solução**: Verificar schema do banco:

```sql
DESCRIBE patients;

# Verificar se campos estão NOT NULL
# Campos permitindo NULL:
ALTER TABLE patients MODIFY COLUMN notes VARCHAR(500) NULL;
```

### Problema: "401 Unauthorized"

**Causa**: Token expirado ou inválido

**Solução:**
```javascript
// DevTools Console
// Verificar token
const token = localStorage.getItem('authToken')
console.log(token)

// Se vazio, fazer login novamente
// Se presente mas inválido, limpar e refazer login
localStorage.clear()
```

---

## 📝 Checklist de Testes Completos

Use este checklist para validar toda a integração:

### Autenticação
- [ ] Login com credenciais corretas ✅
- [ ] Logout limpa localStorage ✅
- [ ] Tenta login com senha errada → erro ✅
- [ ] Token armazenado em localStorage ✅
- [ ] Redirecionamento para login se sem token ✅

### Pacientes
- [ ] Criar novo paciente ✅
- [ ] Listar pacientes da API ✅
- [ ] Imagem de avatar do paciente (inicial do nome) ✅
- [ ] Cálculo de IMC automático ✅
- [ ] Validação de campos obrigatórios ✅

### Planos
- [ ] Criar novo plano com macros ✅
- [ ] Salvar plano alimentar com refeições ✅
- [ ] Cálculo de percentuais de macros ✅
- [ ] Dados persistidos no banco ✅

### Relatórios
- [ ] Carregar relatórios por tipo ✅
- [ ] Mudar período (7d/30d/90d) ✅
- [ ] Mudar paciente ✅
- [ ] Mostrar gráfico de progresso ✅
- [ ] Fallback para dados locais se API falha ✅

### Tratamento de Erros
- [ ] Mensagens de erro claras ✅
- [ ] Conexão perdida detectada ✅
- [ ] Retry automático em 3 segundos ✅
- [ ] Dados salvos localmente como backup ✅

---

## 📚 Recursos Adicionais

### Arquivos Importantes

- **Frontend**: `nutri_saas_mockup_v2.html` (≈3500 linhas)
- **Backend**: `nutriudf/backend/server.js`
- **Database Schema**: `nutriudf/backend/migrations/run.js`
- **Documentação**: `INTEGRACAO_FRONTEND_BACKEND.md`

### Endpoints Disponíveis

```
POST   /api/auth/login              - Login
GET    /api/patients                - Listar pacientes
POST   /api/patients                - Criar paciente
GET    /api/patients/:id            - Detalhes do paciente
PUT    /api/patients/:id            - Atualizar paciente
GET    /api/plans/patient/:id       - Plano do paciente
POST   /api/plans                   - Criar plano
GET    /api/reports/:id/:type/:period - Relatório específico
POST   /api/reports/generate-pdf    - Gerar PDF
POST   /api/reports/send-email      - Enviar por email
```

### Variáveis Globais JavaScript

```javascript
API_URL                // "http://localhost:3000/api"
authToken              // JWT token do localStorage
currentUser            // Objeto do usuário logado
api                    // Instância de ApiService
currentReportType      // 'nutritional' | 'progress' | 'compliance' | 'recommendations'
currentReportPeriod    // '7d' | '30d' | '90d'
currentReportPatient   // ID do paciente selecionado
```

---

## ✅ Validação Final

Ao terminar os testes, você deve ter:

✅ **Backend rodando** em `http://localhost:3000`  
✅ **Frontend acessível** em `http://localhost:5500`  
✅ **Banco de dados** com 5 tabelas criadas  
✅ **Autenticação** funcionando  
✅ **CRUD de pacientes** operacional  
✅ **Planos alimentares** persistidos  
✅ **Relatórios** carregados dinamicamente  
✅ **Tratamento de erros** robusto  

---

## 🎉 Próximos Passos

Quando tudo estiver funcionando:

1. **Hospedar Backend**
   - Usar serviço como Heroku, Railway, ou AWS
   - Atualizar `API_URL` no frontend

2. **Adicionar Mais Funcionalidades**
   - Geração de PDF dos relatórios
   - Envio de email de recomendações
   - Integração com Banco TBCA de alimentos

3. **Melhorar UX**
   - Adicionar loading spinners
   - Mensagens de erro mais detalhadas
   - Validação em tempo real

4. **Produção**
   - Minificar JavaScript
   - Otimizar banco de dados
   - Implementar cache
   - Adicionar HTTPS

---

**Última atualização**: 2025-04-03  
**Mantido por**: Time NutriUDF  
**Versão**: 1.0 - Integração Completa
