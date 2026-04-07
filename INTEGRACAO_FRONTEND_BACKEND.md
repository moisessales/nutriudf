# 🔗 Guia de Integração Frontend + Backend

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração do Frontend](#configuração-do-frontend)
3. [Autenticação](#autenticação)
4. [Requisições à API](#requisições-à-api)
5. [Exemplos de Código](#exemplos-de-código)

---

## 👁️ Visão Geral

O frontend (`nutri_saas_mockup_v2.html`) atualmente usa **dados mockados**. Para integrar com o backend, você precisa:

1. Remover dados estáticos (`patientReportData`)
2. Adicionar camada de API
3. Implementar autenticação
4. Fazer requisições dinâmicas ao backend

---

## ⚙️ Configuração do Frontend

### 1. Adicionar Configuration no HTML

Antes do `<script>`, adicione uma seção de configuração:

```javascript
// Configuração da API
const API_URL = 'http://localhost:3000/api'; // Mudar conforme ambiente
let authToken = localStorage.getItem('authToken') || null;
const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
```

### 2. Criar Classe de Serviço API

```javascript
class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);

      if (response.status === 401) {
        // Token expirou
        logout();
        window.location.href = '/login.html';
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  // Métodos de Autenticação
  async register(email, password, name) {
    return this.request('/auth/register', 'POST', { email, password, name });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', 'POST', { email, password });
    if (data && data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    return data;
  }

  // Métodos de Pacientes
  async getPatients() {
    return this.request('/patients');
  }

  async getPatient(id) {
    return this.request(`/patients/${id}`);
  }

  async createPatient(patientData) {
    return this.request('/patients', 'POST', patientData);
  }

  async updatePatient(id, patientData) {
    return this.request(`/patients/${id}`, 'PUT', patientData);
  }

  // Métodos de Planos
  async getPlan(patientId) {
    return this.request(`/plans/patient/${patientId}`);
  }

  async createPlan(planData) {
    return this.request('/plans', 'POST', planData);
  }

  // Métodos de Relatórios
  async getReports(patientId, period = '7d') {
    return this.request(`/reports/patient/${patientId}?period=${period}`);
  }

  async getReportData(patientId, reportType, period) {
    return this.request(`/reports/${patientId}/${reportType}/${period}`);
  }

  async generatePDF(patientId, reportType, period) {
    return this.request('/reports/generate-pdf', 'POST', {
      patientId,
      reportType,
      period
    });
  }

  async sendEmailReport(patientId, reportType, period, recipientEmail) {
    return this.request('/reports/send-email', 'POST', {
      patientId,
      reportType,
      period,
      recipientEmail
    });
  }
}

// Instanciar o serviço
const api = new ApiService(API_URL);
```

---

## 🔐 Autenticação

### 1. Tela de Login

```html
<!-- login.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Login - NutriSAAS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'DM Sans', sans-serif; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #F5F3EE; 
    }
    .login-container { 
      background: white; 
      padding: 40px; 
      border-radius: 12px; 
      width: 400px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    h1 { margin-bottom: 30px; color: #1A1A1A; }
    input, button { 
      width: 100%; 
      padding: 12px; 
      margin-bottom: 15px; 
      border: 1px solid #E8E6E0; 
      border-radius: 8px; 
      font-size: 14px; 
    }
    button { 
      background: #4A9B5F; 
      color: white; 
      border: none; 
      cursor: pointer; 
      font-weight: 600; 
    }
    button:hover { background: #2D6A3F; }
    .error { color: red; font-size: 12px; }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🥗 NutriSAAS</h1>
    
    <form onsubmit="handleLogin(event)">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Senha" required>
      <button type="submit">Entrar</button>
    </form>
    
    <div id="error" class="error"></div>
    
    <p style="margin-top: 20px; text-align: center;">
      Não tem conta? <a href="#" onclick="goToRegister()">Cadastre-se</a>
    </p>
  </div>

  <script>
    const API_URL = 'http://localhost:3000/api';

    async function handleLogin(event) {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const data = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }).then(r => r.json());

        if (data.error) {
          document.getElementById('error').textContent = data.error;
          return;
        }

        // Salvar token e usuário
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Redirecionar para home
        window.location.href = '/nutri_saas_mockup_v2.html';
      } catch (error) {
        document.getElementById('error').textContent = 'Erro ao fazer login: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

### 2. Função de Logout

```javascript
function logout() {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  window.location.href = '/login.html';
}
```

---

## 🔗 Requisições à API

### Exemplo 1: Carregar Pacientes

**Antes (Mockup):**
```javascript
const patientReportData = { marina: {...}, ricardo: {...}, ... };
```

**Depois (API):**
```javascript
async function loadPatients() {
  try {
    const patients = await api.getPatients();
    // Processar e exibir pacientes
    patients.forEach(patient => {
      console.log(patient.name);
    });
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
  }
}
```

### Exemplo 2: Carregar Dados de Relatório

**Antes (Mockup):**
```javascript
const patientReportData = {
  marina: {
    name: 'Marina Costa',
    age: 28,
    progressData: { '7d': {...}, '30d': {...} }
  }
};
```

**Depois (API):**
```javascript
async function loadReportData(patientId, reportType, period) {
  try {
    const reportData = await api.getReportData(patientId, reportType, period);
    // Usar dados no frontend
    updateReportDisplay(reportData);
  } catch (error) {
    console.error('Erro ao carregar relatório:', error);
  }
}
```

### Exemplo 3: Criar Novo Paciente

```javascript
async function addNewPatient() {
  const patientData = {
    name: document.getElementById('patientName').value,
    email: document.getElementById('patientEmail').value,
    age: parseInt(document.getElementById('patientAge').value),
    weight: parseFloat(document.getElementById('patientWeight').value),
    height: parseFloat(document.getElementById('patientHeight').value),
    goal: document.getElementById('patientGoal').value
  };

  try {
    const newPatient = await api.createPatient(patientData);
    console.log('Paciente criado:', newPatient);
    loadPatients(); // Recarregar lista
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
  }
}
```

---

## 💡 Exemplos de Código

### Exemplo Completo: Carregar e Exibir Relatório

```javascript
async function switchReportWithAPI(el, type, patientId) {
  currentReportType = type;
  
  // Atualizar UI
  document.querySelectorAll('.report-selector').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  
  // Carregar dados da API
  try {
    const reportData = await api.getReportData(
      patientId,
      type,
      currentReportPeriod
    );
    
    // Exibir dados
    updateReportDisplay(reportData, type);
  } catch (error) {
    console.error('Erro ao carregar relatório:', error);
    alert('Erro ao carregar relatório: ' + error.message);
  }
}
```

### Exemplo: Download de PDF

```javascript
async function downloadReportPDFWithAPI() {
  const patientId = currentReportPatient;
  const reportType = currentReportType;
  const period = currentReportPeriod;

  try {
    const response = await api.generatePDF(patientId, reportType, period);
    
    if (response.filename) {
      alert('PDF gerado: ' + response.filename);
      // Aqui você faria o download real
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
}
```

### Exemplo: Enviar por Email

```javascript
async function sendReportViaEmailWithAPI() {
  const patientId = currentReportPatient;
  const recipientEmail = prompt('Email do destinatário:');

  if (!recipientEmail) return;

  try {
    const response = await api.sendEmailReport(
      patientId,
      currentReportType,
      currentReportPeriod,
      recipientEmail
    );

    alert('Email enviado com sucesso para: ' + response.recipient);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}
```

---

## 📋 Checklist de Integração

- [ ] Backend configurado e rodando em http://localhost:3000
- [ ] Banco de dados criado com `npm run migrate`
- [ ] Usuário de teste criado
- [ ] Paciente de teste criado
- [ ] ApiService adicionado ao frontend
- [ ] Tela de login implementada
- [ ] Token salvo em localStorage
- [ ] Requisições com Authorization header
- [ ] Endpoints testados com cURL
- [ ] Integração com relatórios funcionando
- [ ] Planos de alimentação sincronizando

---

## 🚀 Deploy

### Backend em Produção

1. **Variáveis de Ambiente:**
```env
NODE_ENV=production
DB_HOST=seu_database_host
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
JWT_SECRET=uma_chave_muito_secreta
CORS_ORIGIN=https://sua_aplicacao.com
```

2. **Heroku:**
```bash
npm install -g heroku-cli
heroku create nutriudf-backend
git push heroku main
heroku config:set JWT_SECRET=sua_chave
```

3. **AWS/DigitalOcean:**
- Usar Node.js + PM2
- Configurar nginx como reverse proxy
- Usar SSL/TLS

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS error | Verificar CORS_ORIGIN no .env |
| 401 Unauthorized | Token expirou ou não foi enviado |
| 404 Not Found | Endpoint está errado |
| 500 Internal Error | Erro no servidor - verificar logs |

---

**Data: 5 de abril de 2026**
