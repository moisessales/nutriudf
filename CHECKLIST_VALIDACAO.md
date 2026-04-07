# ✅ Checklist de Validação - Integração Frontend-Backend

**Data**: 2025-04-03  
**Projeto**: NutriSAAS v1.0  
**Status**: 🚀 PRONTO PARA TESTE

---

## 📋 Pré-Integração

Antes de começar, verificar:

### Ambiente
- [ ] Node.js instalado (v14+)
  ```bash
  node --version
  ```

- [ ] npm instalado (v6+)
  ```bash
  npm --version
  ```

- [ ] MySQL instalado e rodando
  ```bash
  mysql --version
  mysql -u root -p
  ```

- [ ] 3 portas disponíveis
  ```bash
  # Verificar se portas estão disponíveis:
  # - 3000 (Backend)
  # - 3306 (MySQL)
  # - 5500 (Frontend)
  ```

### Estrutura de Pastas
- [ ] Arquivo principal: `nutri_saas_mockup_v2.html` existe
- [ ] Pasta backend: `nutriudf/backend/` existe
- [ ] Arquivo de configuração: `.env` existe em backend
- [ ] Database migrations: `backend/migrations/run.js` existe

---

## 🔧 Fase 1: Setup do Banco de Dados

### Criar Database
- [ ] Conectar ao MySQL
  ```bash
  mysql -u root -p
  ```

- [ ] Criar database
  ```sql
  CREATE DATABASE nutriudf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  EXIT;
  ```

- [ ] Verificar se foi criado
  ```bash
  mysql -u root -p -e "SHOW DATABASES;" | grep nutriudf
  ```

### Arquivo .env
- [ ] Copiar `backend/.env.example` para `backend/.env`
- [ ] Editar valores:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=SUA_SENHA
  DB_NAME=nutriudf
  PORT=3000
  JWT_SECRET=chave_super_secreta_12345
  ```

### Migrations
- [ ] Executar migrations
  ```bash
  cd backend
  node migrations/run.js
  ```

- [ ] Verificar tabelas criadas no MySQL
  ```bash
  mysql -u root -p nutriudf -e "SHOW TABLES;"
  ```
  Resultado esperado:
  ```
  + users
  + patients
  + meal_plans
  + reports
  + adherence_history
  ```

- [ ] Inserir usuário de teste (se precisar)
  ```sql
  INSERT INTO users (email, password, name, role) VALUES (
    'dra.ana@nutriudf.com',
    '$2b$10$..hash..', -- Hash da senha 123456
    'Dra. Ana Nunes',
    'nutritionist'
  );
  ```

---

## 🚀 Fase 2: Inicializar Backend

### Instalação de Dependências
- [ ] Entrar na pasta backend
  ```bash
  cd nutriudf/backend
  ```

- [ ] Instalar dependências
  ```bash
  npm install
  ```

- [ ] Verificar se package.json tem:
  - [ ] express
  - [ ] mysql2
  - [ ] dotenv
  - [ ] jsonwebtoken
  - [ ] bcryptjs
  - [ ] cors

### Iniciar Servidor
- [ ] Executar backend
  ```bash
  npm start
  ```

- [ ] Verificar se mostra mensagem de sucesso
  ```
  🚀 Servidor rodando em http://localhost:3000
  ✅ Conexão MySQL estabelecida
  ```

- [ ] Testar health check em outro terminal
  ```bash
  curl http://localhost:3000/api
  ```

- [ ] Manter backend rodando (não fechar terminal)

---

## 🌐 Fase 3: Inicializar Frontend

### Abrir Servidor
- [ ] Abrir novo terminal
- [ ] Navegar até pasta raiz
  ```bash
  cd nutriudf
  ```

- [ ] Iniciar servidor (escolher uma opção)
  
  **Opção 1: VS Code Live Server**
  - [ ] Clicar direito em `nutri_saas_mockup_v2.html`
  - [ ] Selecionar "Open with Live Server"
  - [ ] Deve abrir browser automaticamente

  **Opção 2: Python**
  ```bash
  python -m http.server 5500
  ```

  **Opção 3: Node.js**
  ```bash
  npx http-server -p 5500
  ```

- [ ] Browser deve abrir em `http://localhost:5500`

---

## 🔐 Fase 4: Testar Autenticação

### Verificar Tela de Login
- [ ] Ao abrir página, vê tela de login
- [ ] Elementos presentes:
  - [ ] Logo "Nutri.app"
  - [ ] Campo Email
  - [ ] Campo Senha
  - [ ] Botão "Entrar"
  - [ ] Credenciais de teste mostradas

### Fazer Login
- [ ] Email: `dra.ana@nutriudf.com`
- [ ] Senha: `123456`
- [ ] Clicar "Entrar"

- [ ] Resultado esperado após 2 segundos:
  - [ ] Redireciona para Dashboard
  - [ ] Nome no avatar de user mostra "AN"
  - [ ] Sidebar e menu aparecem

### Verificar localStorage
- [ ] Abrir DevTools (F12)
- [ ] Ir para "Application" → "Local Storage"
- [ ] Verificar se existem:
  - [ ] `authToken` (JWT token)
  - [ ] `currentUser` (JSON com dados)

- [ ] Executar no console:
  ```javascript
  localStorage.getItem('authToken')  // Deve mostrar token
  JSON.parse(localStorage.getItem('currentUser'))  // Deve mostrar objeto
  ```

### Testar Logout
- [ ] Clicar botão "Sair" na sidebar (abaixo do avatar)
- [ ] Confirmar logout
- [ ] Resultado esperado:
  - [ ] Volta para tela de login
  - [ ] localStorage limpo
  - [ ] Todos os dados apagados

---

## 👥 Fase 5: Testar CRUD de Pacientes

### Criar Novo Paciente
- [ ] Fazer login novamente
- [ ] Dashboard → Botão "Novo paciente"
- [ ] Modal abre com formulário
- [ ] Preencher dados:
  ```
  Nome: João da Silva
  Email: joao.silva@email.com
  Idade: 32
  Peso: 85.5
  Altura: 1.78
  Objetivo: Perda de peso
  Observações: (deixar em branco)
  ```

- [ ] Clicar "Salvar"
- [ ] Resultado esperado:
  - [ ] Mensagem de sucesso com IMC
  - [ ] Modal fecha automaticamente
  - [ ] Pode ver console: "✅ Login realizado com sucesso"

### Verificar no Banco
- [ ] Abrir MySQL em novo terminal
  ```bash
  mysql -u root -p nutriudf
  SELECT * FROM patients ORDER BY id DESC LIMIT 1;
  ```

- [ ] Verificar se dados foram salvos:
  - [ ] name = "João da Silva"
  - [ ] email = "joao.silva@email.com"
  - [ ] weight = 85.5
  - [ ] height = 1.78
  - [ ] imc ≈ 27.04

### Listar Pacientes
- [ ] Cliar "Pacientes" no menu lateral
- [ ] Deve carregar tabela de pacientes
- [ ] Colunas esperadas:
  - [ ] Nome
  - [ ] Email
  - [ ] Idade
  - [ ] Peso
  - [ ] IMC
  - [ ] Objetivo
  - [ ] Botão Editar

- [ ] Verificar que o novo paciente aparece na lista

### Validar Cálculos de IMC
| Peso | Altura | IMC Esperado | Status |
|------|--------|-------------|--------|
| 85.5 | 1.78 | 27.04 | Sobrepeso |
| 70 | 1.65 | 25.71 | Sobrepeso |
| 60 | 1.80 | 18.52 | Normal |

- [ ] Verificar cálculos estão corretos

---

## 🍽️ Fase 6: Testar Planos

### Criar Novo Plano (Macros)
- [ ] Dashboard → "Novo plano"
- [ ] Modal abre
- [ ] Preencher:
  ```
  Paciente: João Silva
  Calorias: 2500
  Proteína: 200g
  Carboidrato: 300g
  Gordura: 85g
  Duração: 30 dias
  ```

- [ ] Clicar "Criar Plano"
- [ ] Resultado esperado:
  - [ ] Mensagem de sucesso
  - [ ] Mostrar macros resumidas
  - [ ] Percentuais:
    - [ ] Proteína: 32%
    - [ ] Carbs: 48%
    - [ ] Gordura: 30.6%
  - [ ] Redirecionar para tela de Planos

### Verificar no Banco
- [ ] MySQL:
  ```sql
  SELECT * FROM meal_plans ORDER BY id DESC LIMIT 1;
  ```

- [ ] Verificar se: meal_data contém JSON com macros

---

## 📊 Fase 7: Testar Relatórios

### Acessar Relatórios
- [ ] Menu → "Relatórios"
- [ ] Deve carregar tela de relatórios

### 4 Abas de Relatórios
- [ ] **Nutricional**
  - [ ] Mostrar kcal target
  - [ ] Mostrar proteína/carbs/gordura
  - [ ] Mostrar barra de distribuição
  - [ ] Mostrar hidratação

- [ ] **Progresso**
  - [ ] Mostrar gráfico de peso
  - [ ] Mostrar estatísticas
  - [ ] Mostrar peso inicial/atual/meta

- [ ] **Aderência**
  - [ ] Mostrar percentual de aderência
  - [ ] Mostrar dias histórico

- [ ] **Recomendações**
  - [ ] Mostrar dicas personalizadas
  - [ ] Mostrar alertas importan ...

### Testar Períodos
- [ ] 7 dias (últimos 7 dias)
- [ ] 30 dias (últimos 30 dias)
- [ ] 90 dias (últimos 90 dias)

- [ ] Resultado esperado:
  - [ ] Dados mudam quando seleciona período
  - [ ] Gráficos atualizam
  - [ ] Console não mostra erros

### Mudar Paciente
- [ ] Na tela de relatórios, mudar paciente na dropdown
- [ ] Resultado esperado:
  - [ ] Todos os dados atualizam
  - [ ] Novo nome no topo
  - [ ] Gráficos recarregam

---

## 🔌 Fase 8: Testar Integração com API

### Requests HTTP Visíveis
- [ ] DevTools (F12) → Network tab
- [ ] Criar um novo paciente
- [ ] Procurar pelo request POST em `/api/patients`

- [ ] Verificar:
  - [ ] Method: POST
  - [ ] Status: 201 ou 200 (sucesso)
  - [ ] Request Headers têm: `Authorization: Bearer TOKEN`
  - [ ] Response mostra dados do paciente criado

### Testar Sem Conexão (Fallback)
- [ ] DevTools → Network → Throttling → "Offline"
- [ ] Tentar criar novo paciente
- [ ] Resultado esperado:
  - [ ] Mensagem de aviso
  - [ ] Dados salvos localmente no localStorage
  - [ ] Sincroniza quando volta online

---

## 🐛 Fase 9: Testar Tratamento de Erros

### Erro 401 (Unauthorized)
- [ ] Abrir Console (F12)
- [ ] Executar:
  ```javascript
  fetch('http://localhost:3000/api/patients')
    .then(r => r.json())
    .then(d => console.log(d))
  ```

- [ ] Resultado esperado:
  - [ ] Erro 401 ou redirecionamento para login

### Login com Senha Errada
- [ ] Logout
- [ ] Tentar login com:
  - [ ] Email: `dra.ana@nutriudf.com`
  - [ ] Senha: `senha_errada`

- [ ] Resultado esperado:
  - [ ] Mensagem de erro "Credenciais inválidas"
  - [ ] Não redireciona
  - [ ] Continua na tela de login

### Email Inválido
- [ ] Tentar criar paciente sem email (deixar vazio)
- [ ] Clicar "Salvar"
- [ ] Resultado esperado:
  - [ ] Modal valida e mostra erro
  - [ ] Não envia para backend

---

## 🏁 Fase 10: Performance e UI

### Performance
- [ ] Criar paciente leva menos de 3 segundos
- [ ] Listar pacientes carrega em menos de 2 segundos
- [ ] Mudar período carrega em menos de 2 segundos
- [ ] Relatório renderiza sem não flickar

### UI/UX
- [ ] Botões respondem ao clique
- [ ] Modals fecham corretamente
- [ ] Transições são suaves
- [ ] Mensagens de sucesso/erro aparecem

### Responsividade (se aplicável)
- [ ] Desktop 1920x1080: ✅ Tudo visível
- [ ] Desktop 1280x720: ✅ Sem overflow
- [ ] Tablet 768x1024: (se não mobile)

---

## 📱 Fase 11: Testes Avançados

### Token JWT
- [ ] DevTools Console:
  ```javascript
  // Decodificar token
  const token = localStorage.getItem('authToken')
  const payload = token.split('.')[1]
  const decoded = JSON.parse(atob(payload))
  console.log(decoded)  // Mostra id, email, exp
  ```

- [ ] Verificar campos:
  - [ ] `id`: ID do usuário
  - [ ] `email`: Email do usuário
  - [ ] `iat`: Data de criação
  - [ ] `exp`: Data de expiração

### Múltiplas Requisições
- [ ] Criar 5 pacientes seguidos
- [ ] Resultado esperado:
  - [ ] Todos criados com sucesso
  - [ ] Nenhuma conflita com outro
  - [ ] IDs diferentes para cada um

### Dados Sensíveis
- [ ] Verificar que senhas NÃO aparecem no console
- [ ] Verificar que tokens aparecem no header (ok)
- [ ] Verificar que emails aparecem (ok, é público)

---

## ✅ Checklist Final

### Tudo funcionando?
- [ ] ✅ Backend rodando em http://localhost:3000
- [ ] ✅ Frontend rodando em http://localhost:5500
- [ ] ✅ Database conectado e com tabelas
- [ ] ✅ Login funciona com credenciais de teste
- [ ] ✅ Criar paciente persiste no banco
- [ ] ✅ Listar pacientes mostra dados da API
- [ ] ✅ Criar plano funciona
- [ ] ✅ Relatórios carregam dados
- [ ] ✅ Logout limpa localStorage
- [ ] ✅ Tratamento de erros robusto
- [ ] ✅ Sem erros no DevTools Console
- [ ] ✅ Performance aceitável
- [ ] ✅ UI responsiva e intuitiva

### Pronto para Produção?
- [ ] Sim! Tudo validado ✅

---

## 🚀 Próximos Passos

1. **Testar com Dados Reais**
   - [ ] Melhorar banco de dados
   - [ ] Inserir mais pacientes
   - [ ] Testar com histórico real

2. **Otimizações**
   - [ ] Adicionar cache de dados
   - [ ] Implementar paginação
   - [ ] Adicionar loading spinners

3. **Novas Features**
   - [ ] Edição de pacientes
   - [ ] Geração de PDF
   - [ ] Envio de email
   - [ ] Integração TBCA

4. **Deployment**
   - [ ] Hospedar backend (Heroku, Railway)
   - [ ] Hospedar frontend (Vercel, Netlify)
   - [ ] Atualizar API_URL
   - [ ] SSL/HTTPS

---

## 📞 Suporte Rápido

**Problema**: Backend não conecta
```bash
# Verificar se está rodando
curl http://localhost:3000/api

# Se não funcionar, iniciar
cd backend && npm start
```

**Problema**: Erro 401 no login
```bash
# Verificar usuário no banco
mysql -u root -p nutriudf
SELECT * FROM users WHERE email = 'dra.ana@nutriudf.com';
```

**Problema**: Dados não carregam
- [ ] Abrir DevTools (F12)
- [ ] Ir para Network
- [ ] Create paciente
- [ ] Ver error exato no Response

---

**✅ Quando completar todos os itens acima, você tem uma aplicação funcional e integrada!**

**Status**: 🎉 PRONTO PARA USAR  
**Data de Conclusão**: [PREENCHER]  
**Assinado por**: [PREENCHER]
