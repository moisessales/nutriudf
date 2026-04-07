# 🎯 GUIA DE FUNCIONALIDADES - ONDE ENCONTRAR O CÓDIGO

## 📍 LOCALIZAÇÃO DOS NOVOS CÓDIGOS

### 🎨 FRONTEND (nutri_saas_mockup_v2.html)

#### 1. Modais HTML (Editar + Deletar)
- **Linha 1298-1365**: Modal "Editar Paciente"
- **Linha 1367-1390**: Modal "Confirmar Deletar"

#### 2. Funções JavaScript - Editar & Deletar
- **Linha 3762-3816**: `editPatient(id)` - Abre modal com dados preenchidos
- **Linha 3818-3860**: `saveEditedPatient(event)` - Envia PUT para API
- **Linha 3862-3874**: `deletePatient(id)` - Abre confirmação
- **Linha 3876-3900**: `confirmDeletePatient()` - Envia DELETE para API

#### 3. Funções JavaScript - Busca & Filtro
- **Linha 3902-3915**: `searchPatients(query)` - Busca em tempo real
- **Linha 3917-3925**: `filterPatientsByGoal(goal)` - Filtra por objetivo
- **Linha 3927-3935**: `filterPatientsByIMC(min, max)` - Filtra por faixa IMC

#### 4. Funções JavaScript - PDF & Gráficos
- **Linha 3937-3990**: `exportPatientPDF(id)` - Chama endpoint e baixa PDF
- **Linha 3992-4010**: `initAdvancedDashboard()` - Carrega Chart.js e renderiza
- **Linha 4012-4270**: Funções de gráficos:
  - `renderAdvancedCharts()` - Orquestra
  - `renderGoalDistributionChart()` - Doughnut
  - `renderIMCDistributionChart()` - Bar
  - `renderAgeVsWeightChart()` - Scatter
  - `renderStatisticsGauge()` - Estatísticas

#### 5. Tabela de Pacientes - Botões de Ação
- **Linha 2495-2515**: Função `renderPatientRows()` - MELHORADA com 4 botões

#### 6. Dashboard - Botão de Gráficos
- **Linha 393**: Botão "📊 Gráficos avançados" adicionado

#### 7. Pacientes - Busca & Filtro UI
- **Linha 665-673**: Campo de busca + dropdown de filtro aprimorados

---

### ⚙️ BACKEND (Node.js)

#### Controllers Novos

**📄 `backend/src/controllers/foodController.js`** (110 linhas)
```
- exports.searchFoods()       (busca simples)
- exports.getFoodDetails()    (busca por ID)
- exports.getFavoritesFoods() (mais usados)
- searchTBCADatabase()        (base interna)
- getTBCAFoodById()           (lookup)
```

**📊 `backend/src/controllers/dashboardController.js`** (170 linhas)
```
- exports.getDashboardStats()       (stats gerais)
- exports.getPatientAdvancedStats() (stats paciente)
- calculateGoalDistribution()       (objetivo)
- calculateIMCDistribution()        (IMC)
- calculateAgeDistribution()        (idade)
- calculatePatientGrowth()          (crescimento)
- calculatePatientTrends()          (tendências)
```

#### Controllers Melhorados

**📋 `backend/src/controllers/reportController.js`**
- **Linha 1**: Adicionado `const PDFDocument = require('pdfkit');`
- **Linha 86-140**: `exports.generatePDF()` - COMPLETAMENTE REESCRITO
  - Uses pdfkit para gerar PDF real
  - Inclui: paciente, métricas, plano, recomendações
  - Retorna arquivo PDF para download
- **Linha 142-150**: Função `getIMCCategory()` - Categorização IMC

**📦 `backend/src/controllers/patientController.js`**
- ✅ Já tinha PUT e DELETE implementados
- Sem mudanças (estava correto)

#### Routes Novos

**🍽️ `backend/src/routes/foodRoutes.js`** (18 linhas)
```javascript
GET  /search      → searchFoods
GET  /:id         → getFoodDetails
GET  /favorites   → getFavoritesFoods
```

**📈 `backend/src/routes/dashboardRoutes.js`** (18 linhas)
```javascript
GET  /stats            → getDashboardStats
GET  /patient/:id      → getPatientAdvancedStats
```

#### Server Principal

**🚀 `backend/server.js`**
- **Linha 9-10**: Importadas 2 rotas novas
- **Linha 25-26**: Registradas 2 rotas:
  - `app.use('/api/foods', foodRoutes);`
  - `app.use('/api/dashboard', dashboardRoutes);`

#### Dependencies

**📦 `backend/package.json`**
- ✅ pdfkit adicionado via npm (20 pacientes adicionais)
- Total: 149 packages

---

## 🔄 FLUXO COMPLETO DE UMA FUNCIONALIDADE

### Exemplo: Deletar Paciente

1. **Click "🗑️ Deletar"** no frontend (linha 2506)
   ↓
2. **Chama `deletePatient(id)`** (linha 3862)
   ↓
3. **Abre modal de confirmação** com nome do paciente
   ↓
4. **Click "Deletar paciente"** no modal
   ↓
5. **Chama `confirmDeletePatient()`** (linha 3876)
   ↓
6. **Envia DELETE para API** `/api/patients/:id`
   - Header: `Authorization: Bearer {token}`
   ↓
7. **Backend recebe** em `patientRoutes.js` linha 14:
   - Rota: `router.delete('/:id', patientController.deletePatient);`
   ↓
8. **Controller executa** `deletePatient()` (patientController.js)
   - Verifica autorização (nutritionist_id)
   - Remove do BD
   - Retorna sucesso
   ↓
9. **Frontend atualiza**
   - Mostra alert de sucesso
   - Remove linha da tabela
   - Recarrega lista (loadPatientsFromAPI)

---

## 📊 RESUMO DE MUDANÇAS POR TIPO

```
Frontend:
  - 1 arquivo modificado
  - +600 linhas
  - 2 novos modais
  - 7 novas funções
  - 3 campos UI melhorados

Backend:
  - 2 controllers novos
  - 1 controller modificado
  - 1 server.js modificado
  - 2 routes novos
  - 1 package.json modificado (+20 libs pdfkit)
```

---

## 🔗 DIAGRAMA DE DEPENDÊNCIAS

```
Frontend (HTML)
    ├─ Modal Editar ────────┐
    ├─ Modal Deletar ────────┤─ API REST
    ├─ Busca ────────────────┤─ JSON
    ├─ Gráficos ─────────────┤
    └─ Botão PDF ───────────┘
         ↓
Backend (Node.js)
    ├─ patientRoutes (PUT, DELETE)
    ├─ reportRoutes (POST generate-pdf)
    ├─ foodRoutes (GET search)
    └─ dashboardRoutes (GET stats)
         ↓
    Controllers
    ├─ patientController (já tinha)
    ├─ reportController (melhorado com pdfkit)
    ├─ foodController (novo)
    └─ dashboardController (novo)
         ↓
    Database (MySQL - a instalar)
    └─ 5 tabelas (users, patients, meal_plans, reports, adherence_history)
```

---

## 🧪 COMO TESTAR CADA FUNCIONALIDADE

### 1. Editar Paciente
```javascript
// Frontend: Clique "✏️ Editar" em qualquer linha
// Deve abrir modal com dados preenchidos
// Mude qualquer campo e clique "Salvar alterações"
// Deve enviar PUT para /api/patients/:id
```

### 2. Deletar Paciente
```javascript
// Frontend: Clique "🗑️ Deletar" em qualquer linha
// Deve pedir confirmação com nome
// Clique "Deletar paciente"
// Deve enviar DELETE para /api/patients/:id
```

### 3. Buscar Pacientes
```javascript
// Frontend: Na tela Pacientes
// Digite "Marina" no campo de busca
// Deve filtrar em tempo real (0ms latência)
// Tente com diferentes nomes/emails
```

### 4. Exportar PDF
```javascript
// Frontend: Clique "📄 PDF" em qualquer paciente
// Deve enviar POST para /api/reports/generate-pdf
// Backend lê dados do paciente
// Cria PDF com pdfkit
// Retorna arquivo para download
// Arquivo: relatorio_nutritional_Marina_2025-04-05.pdf
```

### 5. Gráficos Avançados
```javascript
// Frontend: Na tela Dashboard
// Clique botão "📊 Gráficos avançados"
// Deve carregar Chart.js via CDN
// Renderizar 4 gráficos:
// - Distribuição de objetivos (doughnut)
// - Distribuição IMC (bar)
// - Idade vs Peso (scatter)
// - Estatísticas gerais (custom box)
```

---

## ✅ VERIFICAÇÃO FINAL

Todos os arquivos modificados:

- ✅ `nutri_saas_mockup_v2.html` - 5 features frontend
- ✅ `backend/server.js` - 2 rotas registradas
- ✅ `backend/src/controllers/reportController.js` - PDF com pdfkit
- ✅ `backend/src/controllers/foodController.js` - ✨ NOVO
- ✅ `backend/src/controllers/dashboardController.js` - ✨ NOVO
- ✅ `backend/src/routes/foodRoutes.js` - ✨ NOVO
- ✅ `backend/src/routes/dashboardRoutes.js` - ✨ NOVO
- ✅ `backend/package.json` - pdfkit adicionado

**Status**: 🟢 PRONTO PARA TESTAR COM MYSQL

---

Documento gerado: 5 de Abril de 2026
Versão: 2.0 - Com 5 funcionalidades avançadas
