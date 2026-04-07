# 🔧 REFERÊNCIA TÉCNICA - Como Estender a Funcionalidade

## 📝 Adicionar Novo Paciente

### Passo 1: Adicionar dados ao objeto `patientReportData`

```javascript
// Em: nutri_saas_mockup_v2.html, após a definição de "pedro"

newPatient: {
  name: 'Novo Paciente',
  age: 30,
  weight: 70,
  height: 1.75,
  imc: 22.9,
  goal: 'Emagrecimento',  // ou 'Manutenção' / 'Hipertrofia'
  kcalTarget: 1800,
  proteinTarget: 135,
  carbTarget: 225,
  fatTarget: 60,
  waterTarget: 2500,
  waterCurrent: 1900,
  
  // Aderência por período
  adherence7d: { avg: 85, days: 25, total: 30 },
  adherence30d: { avg: 83, days: 25, total: 30 },
  adherence90d: { avg: 80, days: 72, total: 90 },
  
  // Progresso de peso por período
  progressData: {
    7d: { initialWeight: 70.5, currentWeight: 70.0, weightChange: -0.5 },
    30d: { initialWeight: 71.0, currentWeight: 70.0, weightChange: -1.0 },
    90d: { initialWeight: 73.0, currentWeight: 70.0, weightChange: -3.0 }
  }
}
```

### Passo 2: Adicionar opção ao dropdown HTML

Procure por:
```html
<select id="patient-select" onchange="switchPatient(this.value)">
  <option value="marina">Marina Costa</option>
  <option value="ricardo">Ricardo Santos</option>
  <option value="julia">Julia Lima</option>
  <option value="pedro">Pedro Ferreira</option>
  <!-- ADICIONE AQUI: -->
  <option value="newPatient">Novo Paciente</option>
</select>
```

### Passo 3: Testar

```javascript
// No console do navegador:
switchPatient('newPatient');
changeReportPeriod(document.querySelector('.period-btn'), '7d');
// Deve funcionar perfeitamente!
```

---

## 🎯 Adicionar Novo Período

Exemplo: Adicionar "15 dias" como período

### Passo 1: Adicionar dados ao `patientReportData`

```javascript
progressData: {
  7d: { /* ... */ },
  15d: { initialWeight: 65.2, currentWeight: 65.0, weightChange: -0.2 },  // NOVO
  30d: { /* ... */ },
}
```

### Passo 2: Adicionar botão no HTML

```html
<div class="report-period">
  <button class="period-btn active" onclick="changeReportPeriod(this, '7d')">7d</button>
  <button class="period-btn" onclick="changeReportPeriod(this, '15d')">15d</button>  <!-- NOVO -->
  <button class="period-btn" onclick="changeReportPeriod(this, '30d')">30d</button>
  <button class="period-btn" onclick="changeReportPeriod(this, '90d')">90d</button>
</div>
```

### Passo 3: Verificar se funciona

O código já trata automaticamente qualquer período! Nenhuma mudança necessária em `changeReportPeriod()`.

---

## 💾 Integrar com Backend (API)

### Método 1: Substituir `patientReportData` com chamada API

```javascript
// Versão atual (mockup):
const patientReportData = { /* dados mockados */ };

// Versão com API:
let patientReportData = {};

// Carregar dados ao inicializar
async function loadPatientReportData() {
  try {
    const response = await fetch('/api/reports/data');
    patientReportData = await response.json();
    updateReportData();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Chamar ao iniciar (no final do script):
loadPatientReportData();
// Em vez de: updateReportData();
```

### Método 2: Carregar dados específicos por requisição

```javascript
// Quando o paciente é alterado:
async function switchPatient(patientId) {
  currentReportPatient = patientId;
  
  try {
    const response = await fetch(`/api/reports/patient/${patientId}`);
    patientReportData[patientId] = await response.json();
    updateReportData();
  } catch (error) {
    console.error('Erro ao carregar paciente:', error);
  }
}
```

### Método 3: Enviar relatório para backend

```javascript
// Em downloadReportPDF():
async function downloadReportPDF() {
  const reportType = {
    nutritional: 'Nutricional',
    progress: 'Progresso',
    compliance: 'Aderência',
    recommendations: 'Recomendações'
  }[currentReportType];
  
  const patient = patientReportData[currentReportPatient];
  
  try {
    const response = await fetch('/api/reports/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentReportPatient,
        reportType: currentReportType,
        period: currentReportPeriod
      })
    });
    
    // Receber arquivo PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_${reportType}_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
  } catch (error) {
    alert('Erro ao gerar PDF: ' + error.message);
  }
}
```

---

## 📨 Implementar Envio de Email

```javascript
// Substituir a função sendReportTo():
async function sendReportTo(type) {
  const patient = patientReportData[currentReportPatient];
  const reportType = {
    nutritional: 'Nutricional',
    progress: 'Progresso',
    compliance: 'Aderência',
    recommendations: 'Recomendações'
  }[currentReportType];
  
  try {
    const response = await fetch('/api/reports/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientType: type,  // 'patient' ou 'email'
        patientId: currentReportPatient,
        reportType: currentReportType,
        period: currentReportPeriod,
        recipientEmail: type === 'email' ? prompt('Email do destinatário:') : null
      })
    });
    
    if (response.ok) {
      alert(`✅ ${type === 'patient' ? 'Relatório enviado ao paciente' : 'Email enviado com sucesso'}`);
    } else {
      alert('❌ Erro ao enviar relatório');
    }
  } catch (error) {
    alert('Erro: ' + error.message);
  }
}
```

---

## 🎨 Personalizar Cores e Temas

### Alterar cores principais

No `<style>`, procure por:
```css
:root {
  --accent: #4A9B5F;        /* Verde principal */
  --accent-light: #E8F5EC;  /* Verde claro */
  --accent-dark: #2D6A3F;   /* Verde escuro */
  --protein: #4A9B5F;       /* Proteína */
  --carb: #F59E0B;          /* Carboidrato */
  --fat: #6366F1;           /* Gordura */
  --water: #3B82F6;         /* Água */
  /* ... mais cores */
}
```

Mude para suas cores corporativas:
```css
:root {
  --accent: #FF6B6B;        /* Vermelho */
  --accent-light: #FFE5E5;
  --accent-dark: #CC5555;
  /* ... e assim por diante */
}
```

---

## 📊 Adicionar Novo Tipo de Relatório

### Passo 1: Adicionar HTML novo

No HTML, procure por `<!-- Recommendations Report -->` e adicione após:

```html
<!-- Performance Report (novo) -->
<div id="report-performance" class="report-view" style="display:none">
  <div class="report-card">
    <div class="report-header">
      <div class="report-title">⚡ Desempenho</div>
    </div>
    <!-- Seu conteúdo aqui -->
  </div>
</div>
```

### Passo 2: Adicionar seletor

```html
<div class="report-selector" onclick="switchReport(this, 'performance')">
  ⚡ Desempenho
</div>
```

### Passo 3: Adicionar função de atualização

```javascript
// Em updateReportData():
updatePerformanceReport(patient);

// Nova função:
function updatePerformanceReport(patient) {
  // Seus dados aqui
}
```

---

## 🔐 Validação de Dados

Adicionar validação antes de atualizar:

```javascript
function updateReportData() {
  const patient = patientReportData[currentReportPatient];
  
  // Validação
  if (!patient) {
    console.error('Paciente não encontrado');
    return;
  }
  
  if (!patient.progressData[currentReportPeriod]) {
    console.error('Período não possui dados');
    return;
  }
  
  if (patient.adherence7d.days > patient.adherence7d.total) {
    console.warn('Dados inconsistentes: dias > total');
  }
  
  // Prosseguir com atualização
  updatePatientData(patient);
  // ... resto do código
}
```

---

## 🧪 Testar Novas Mudanças

### No Console do Navegador (F12)

```javascript
// Teste rápido de novo paciente:
currentReportPatient = 'newPatient';
updateReportData();

// Teste rápido de novo período:
currentReportPeriod = '15d';
updateReportData();

// Teste de função:
switchReport(document.querySelector('[onclick*="recommendations"]'), 'recommendations');

// Ver estado atual:
console.log({ currentReportType, currentReportPeriod, currentReportPatient });
```

---

## 🚨 Debug e Troubleshooting

### Se não funciona, adicione logs:

```javascript
function updateReportData() {
  console.log('🔄 Atualizando relatório...');
  
  const patient = patientReportData[currentReportPatient];
  console.log('👤 Paciente:', patient?.name);
  console.log('📅 Período:', currentReportPeriod);
  console.log('📋 Tipo:', currentReportType);
  
  // ... resto do código
  
  console.log('✅ Relatório atualizado!');
}
```

---

## 📚 Stack Usado

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Sem dependências externas** (puro, sem bibliotecas)
- **LocalStorage** para persistência (opcional)
- **Async/Await** ready para APIs

---

## 🎯 Próximas Melhorias

1. **Cache Local:** Usar LocalStorage para dados
2. **Offline Mode:** Funcionar sem internet
3. **Export Options:** CSV, Excel em mais formatos
4. **Gráficos 3D:** Integrar Chart.js ou Plotly
5. **Comparação:** Comparar 2 pacientes lado a lado
6. **Histórico:** Timeline de mudanças
7. **Alertas:** Notificações em tempo real
8. **Mobile App:** React Native / Flutter

---

## 💡 Exemplo Completo: Backend Node.js

```javascript
// server.js
const express = require('express');
const app = express();

app.get('/api/reports/patient/:id', (req, res) => {
  const patientId = req.params.id;
  
  // Buscar no banco de dados
  db.query('SELECT * FROM patients WHERE id = ?', [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows[0]);
  });
});

app.post('/api/reports/generate-pdf', (req, res) => {
  // Gerar PDF com jsPDF
  // Enviar arquivo
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

**Documentação preparada em:** 05 de abril de 2026
**Versão:** 1.0
**Mantido por:** Seu time de desenvolvimento

