# 🥗 NutriUDF SaaS - Stack Completo

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação Rápida](#instalação-rápida)
- [Como Executar](#como-executar)
- [Documentação](#documentação)
- [Status do Projeto](#status-do-projeto)

---

## 👁️ Visão Geral

**NutriUDF** é uma plataforma completa de gerenciamento nutricional (SaaS) que permite nutricionistas:

- ✅ Gerenciar pacientes
- ✅ Criar e editar planos alimentares
- ✅ Gerar relatórios (Nutricional, Progresso, Aderência, Recomendações)
- ✅ Monitorar progresso em 3 períodos (7d, 30d, 90d)
- ✅ Exportar relatórios (PDF, Email)
- ✅ Visualização responsiva

---

## 📁 Estrutura do Projeto

```
nutriudf/
│
├── 📄 nutri_saas_mockup_v2.html          # Frontend (mockup)
├── 📄 RELATORIOS_FUNCIONALIDADES.md      # Referência técnica
├── 📄 README_RELATORIOS.md               # Guia do usuário
├── 📄 GUIA_TESTE.md                      # Procedimentos de teste
├── 📄 REFERENCIA_TECNICA.md              # Como estender
├── 📄 INTEGRACAO_FRONTEND_BACKEND.md     # Guia de integração
│
└── 📁 backend/                           # Backend Node.js + Express
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── README.md
    │
    ├── 📁 src/
    │   ├── config/
    │   │   └── database.js               # Configuração MySQL
    │   ├── middleware/
    │   │   └── auth.js                   # JWT middleware
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── patientController.js
    │   │   ├── planController.js
    │   │   └── reportController.js
    │   └── routes/
    │       ├── authRoutes.js
    │       ├── patientRoutes.js
    │       ├── planRoutes.js
    │       └── reportRoutes.js
    │
    └── 📁 migrations/
        └── run.js                        # Script de migração DB
```

---

## ⚡ Instalação Rápida

### 1️⃣ Clonar/Preparar Projeto
```bash
cd nutriudf
```

### 2️⃣ Instalar Backend
```bash
cd backend
npm install
cp .env.example .env
```

### 3️⃣ Configurar .env
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=nutriudf
JWT_SECRET=sua_chave_secreta
PORT=3000
CORS_ORIGIN=http://localhost
```

### 4️⃣ Criar Banco de Dados
```bash
npm run migrate
```

### 5️⃣ Executar Backend
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

Backend rodará em: **http://localhost:3000**

### 6️⃣ Abrir Frontend
Abra em seu navegador: `file:///c/Users/moise/OneDrive/Anexos/Documentos/nutriudf/nutri_saas_mockup_v2.html`

---

## ▶️ Como Executar

### Backend (Terminal 1)
```bash
cd backend
npm run dev
```
✅ Aguarde: `🚀 Servidor rodando em http://localhost:3000`

### Frontend (Navegador)
```
Menu do app:
1. Dashboard - Visão geral
2. Pacientes - Gerenciar pacientes
3. Planos - Criar/editar planos alimentares
4. Relatórios - Visualizar e exportar relatórios
```

---

## 📚 Documentação

### Frontend
- [RELATORIOS_FUNCIONALIDADES.md](./RELATORIOS_FUNCIONALIDADES.md) - Referência técnica completa
- [README_RELATORIOS.md](./README_RELATORIOS.md) - Guia de uso do frontend
- [GUIA_TESTE.md](./GUIA_TESTE.md) - Procedimentos de teste
- [REFERENCIA_TECNICA.md](./REFERENCIA_TECNICA.md) - Como estender funcionalidades

### Backend
- [backend/README.md](./backend/README.md) - Documentação completa da API

### Integração
- [INTEGRACAO_FRONTEND_BACKEND.md](./INTEGRACAO_FRONTEND_BACKEND.md) - Como conectar tudo

---

## 🔗 API Endpoints

```
POST   /api/auth/register           # Cadastrar novo usuário
POST   /api/auth/login              # Fazer login

GET    /api/patients                # Listar pacientes
POST   /api/patients                # Criar paciente
GET    /api/patients/:id            # Buscar paciente específico
PUT    /api/patients/:id            # Atualizar paciente
DELETE /api/patients/:id            # Deletar paciente

GET    /api/plans/patient/:id       # Buscar plano do paciente
POST   /api/plans                   # Criar novo plano
PUT    /api/plans/:id               # Atualizar plano

GET    /api/reports/patient/:id     # Listar relatórios
GET    /api/reports/:id/:type/:period  # Dados do relatório
POST   /api/reports/generate-pdf    # Gerar PDF
POST   /api/reports/send-email      # Enviar por email
```

---

## 📊 Banco de Dados

### Tabelas criadas automaticamente:

1. **users** - Nutricionistas e admins
2. **patients** - Dados dos pacientes
3. **meal_plans** - Planos alimentares
4. **reports** - Relatórios gerados
5. **adherence_history** - Histórico de aderência

---

## ✨ Funcionalidades Implementadas

### ✅ Frontend
- [x] Dashboard com estatísticas
- [x] Gerenciamento de pacientes
- [x] Planejamento de refeições
- [x] Relatórios 4 tipos
- [x] Seleção de período (7d, 30d, 90d)
- [x] Mudança de paciente responsiva
- [x] Print/Download/Email
- [x] Interface responsiva

### ✅ Backend
- [x] Autenticação com JWT
- [x] API REST completa
- [x] CRUD de pacientes
- [x] Gerenciamento de planos
- [x] Sistema de relatórios
- [x] Banco de dados MySQL
- [x] Validações
- [x] Error handling

### ⏳ Próximas Fases
- [ ] Envio real de emails
- [ ] Geração real de PDF
- [ ] Dashboard avançado
- [ ] Integração com com app mobile
- [ ] Notificações em tempo real
- [ ] Analytics avançado

---

## 🧪 Testes Rápidos

### Verificar API
```bash
curl http://localhost:3000/health
```

### Login via cURL
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nutri@example.com","password":"senha123"}'
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| `ECONNREFUSED` | MySQL não está rodando |
| `ENOENT .env` | Copiar .env.example para .env |
| `404 Not Found` | Verificar rota/endpoint |
| `401 Unauthorized` | Token ausente ou expirado |
| `CORS error` | Verificar CORS_ORIGIN em .env |

---

## 🚀 Deploy

### Backend (Heroku/Railway)
```bash
npm install -g heroku-cli
heroku create app-name
git push heroku main
```

### Frontend (Netlify/Vercel)
```bash
# Baixar HTML + dependências
# Fazer upload para Netlify drop
```

---

## 📞 Suporte

Para dúvidas sobre:
- **Frontend**: Ver [README_RELATORIOS.md](./README_RELATORIOS.md)
- **Backend**: Ver [backend/README.md](./backend/README.md)
- **Integração**: Ver [INTEGRACAO_FRONTEND_BACKEND.md](./INTEGRACAO_FRONTEND_BACKEND.md)

---

## 📄 Stack Tecnológico

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Media Queries)
- JavaScript Vanilla (ES6+)
- Sem frameworks externo

### Backend
- Node.js
- Express.js
- MySQL/MySQL2
- JWT (JsonWebToken)
- bcryptjs

---

## 📝 Changelog

### v1.0.0 (5 de abril de 2026)
- ✅ Sistema de relatórios completo
- ✅ Backend com API REST
- ✅ Autenticação
- ✅ Gerenciamento de pacientes
- ✅ Planos alimentares

---

**Desenvolvido com ❤️ por NutriUDF Team**
