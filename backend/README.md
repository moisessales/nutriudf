# 🚀 NutriSAAS Backend - Guia Completo

## 📋 Índice
1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Executar o servidor](#executar-o-servidor)
4. [API Endpoints](#api-endpoints)
5. [Autenticação](#autenticação)
6. [Exemplos de Requisições](#exemplos-de-requisições)

---

## 📦 Instalação

### Pré-requisitos
- Node.js (v14 ou superior)
- MySQL (v5.7 ou superior)
- npm ou yarn

### Passos

1. **Navegar para a pasta de backend**
```bash
cd backend
```

2. **Instalar dependências**
```bash
npm install
```

3. **Copiar arquivo .env**
```bash
cp .env.example .env
```

4. **Editar o arquivo .env** com suas credenciais do MySQL:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=nutriudf
JWT_SECRET=sua_chave_jwt_secreta_muito_forte
PORT=3000
```

---

## 🗄️ Configuração do Banco de Dados

### Executar migrações

```bash
npm run migrate
```

Isso criará automaticamente:
- Banco de dados `nutriudf`
- Tabelas: `users`, `patients`, `meal_plans`, `reports`, `adherence_history`

---

## ▶️ Executar o Servidor

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

O servidor rodará em `http://localhost:3000`

Teste a saúde da API:
```
GET http://localhost:3000/health
```

---

## 🔐 Autenticação

### Token JWT

Todas as requisições (exceto `/auth/login` e `/auth/register`) requerem um header:

```
Authorization: Bearer <seu_token_jwt>
```

**Como obter um token:**

1. Faça login usando `/auth/login`
2. Receba um token na resposta
3. Use esse token em todas as próximas requisições

---

## 📡 API Endpoints

### 🔑 Autenticação

#### Registro
```
POST /api/auth/register
Body: {
  "email": "nutricionista@example.com",
  "password": "senha123",
  "name": "João Nutricionista",
  "role": "nutritionist"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "nutricionista@example.com",
  "password": "senha123"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "nutricionista@example.com",
    "name": "João Nutricionista",
    "role": "nutritionist"
  }
}
```

---

### 👥 Pacientes

#### Listar todos os pacientes
```
GET /api/patients
Headers: Authorization: Bearer <token>

Response: [
  {
    "id": 1,
    "name": "Marina Costa",
    "email": "marina@example.com",
    "age": 28,
    "weight": 65,
    "height": 1.67,
    "imc": 23.4,
    "goal": "Emagrecimento",
    "created_at": "2026-04-05..."
  }
]
```

#### Buscar paciente específico
```
GET /api/patients/:id
Headers: Authorization: Bearer <token>
```

#### Criar paciente
```
POST /api/patients
Headers: Authorization: Bearer <token>
Body: {
  "name": "Marina Costa",
  "email": "marina@example.com",
  "age": 28,
  "weight": 65,
  "height": 1.67,
  "goal": "Emagrecimento"
}
```

#### Atualizar paciente
```
PUT /api/patients/:id
Headers: Authorization: Bearer <token>
Body: {
  "weight": 64.5,
  "goal": "Manutenção"
}
```

#### Deletar paciente
```
DELETE /api/patients/:id
Headers: Authorization: Bearer <token>
```

---

### 🍽️ Planos de Alimentação

#### Buscar plano de um paciente
```
GET /api/plans/patient/:patientId
Headers: Authorization: Bearer <token>
```

#### Criar plano
```
POST /api/plans
Headers: Authorization: Bearer <token>
Body: {
  "patientId": 1,
  "mealData": {
    "breakfast": [...],
    "lunch": [...],
    "dinner": [...],
    "snacks": [...]
  }
}
```

#### Atualizar plano
```
PUT /api/plans/:planId
Headers: Authorization: Bearer <token>
Body: {
  "mealData": { ... }
}
```

---

### 📊 Relatórios

#### Listar relatórios de um paciente
```
GET /api/reports/patient/:patientId?period=7d
Headers: Authorization: Bearer <token>
```

#### Buscar dados de relatório específico
```
GET /api/reports/:patientId/:reportType/:period
Headers: Authorization: Bearer <token>

Parâmetros:
- reportType: nutritional, progress, compliance, recommendations
- period: 7d, 30d, 90d
```

#### Gerar PDF
```
POST /api/reports/generate-pdf
Headers: Authorization: Bearer <token>
Body: {
  "patientId": 1,
  "reportType": "nutritional",
  "period": "7d"
}
```

#### Enviar relatório por email
```
POST /api/reports/send-email
Headers: Authorization: Bearer <token>
Body: {
  "patientId": 1,
  "reportType": "nutritional",
  "period": "7d",
  "recipientEmail": "patient@example.com"
}
```

---

## 📝 Exemplos de Requisições

### Exemplo completo com cURL

```bash
# 1. Registrar novo usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nutri@example.com",
    "password": "senha123",
    "name": "Dr. Nutricionista",
    "role": "nutritionist"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nutri@example.com",
    "password": "senha123"
  }'

# 3. Listar pacientes (usando o token recebido)
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# 4. Criar paciente
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Marina Costa",
    "email": "marina@example.com",
    "age": 28,
    "weight": 65,
    "height": 1.67,
    "goal": "Emagrecimento"
  }'

# 5. Buscar relatório
curl -X GET http://localhost:3000/api/reports/1/nutritional/7d \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED" (não consegue conectar ao MySQL)
- Verifique se MySQL está rodando
- Verifique as credenciais em `.env`
- Verifique o HOST e PORT

### Erro: "database not found"
- Execute `npm run migrate` para criar o banco de dados

### Erro: "Token inválido"
- Verifique se está enviando o header `Authorization` correto
- Verifique se o token não expirou
- Verifique se o `JWT_SECRET` está correto

---

## 🔄 Próximos Passos

### Integração com Frontend
Veja o arquivo `INTEGRACAO_FRONTEND.md` para instruções de como conectar o frontend ao backend.

### Melhorias Futuras
- [ ] Envio real de emails com Nodemailer
- [ ] Geração de PDF com jsPDF
- [ ] Autenticação OAuth2
- [ ] Testes automatizados
- [ ] Deploy em produção (Heroku, AWS, etc.)
- [ ] Compressão de requisições
- [ ] Rate limiting
- [ ] Cache com Redis

---

## 📚 Documentação Adicional

- [Express.js](https://expressjs.com/)
- [MySQL2/Promise](https://github.com/sidorares/node-mysql2)
- [JWT](https://jwt.io/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

**Desenvolvido em: 5 de abril de 2026**
