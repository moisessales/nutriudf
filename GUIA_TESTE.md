# 🧪 GUIA DE TESTE - Funcionalidades de Relatórios

## 🚀 Como Abrir o Arquivo

1. **Opção 1 - Navegador Local:**
   - Abra `nutri_saas_mockup_v2.html` diretamente no navegador
   - Clique em "Relatórios" na barra lateral esquerda

2. **Opção 2 - Servidor Local (se tiver Python/Node):**
   ```bash
   cd "c:\Users\moise\OneDrive\Anexos\Documentos\nutriudf"
   python -m http.server 8000
   # Ou: npx http-server
   # Abra: http://localhost:8000/nutri_saas_mockup_v2.html
   ```

---

## ✅ TESTE 1: Seleção de Períodos

**Objetivo:** Verificar se período muda os dados

**Passos:**
1. Abra a página e vá para "Relatórios"
2. Selecione o relatório "📊 Nutricional"
3. Clique em [7d] - observe os dados
4. Clique em [30d] - dados devem mudar
5. Clique em [90d] - dados devem mudar novamente

**Resultado Esperado:**
- ✅ Período ativo fica com fundo mais escuro (classe `.active`)
- ✅ Número de dias cumpridos muda
- ✅ Taxa de aderência muda
- ✅ Progresso de peso muda
- ✅ Gráfico de consistência muda

**Valores Esperados (Marina):**
- **7d:** 26/30 (88%)
- **30d:** 25/30 (85%)  
- **90d:** 70/90 (82%)

---

## ✅ TESTE 2: Tipos de Relatório

**Objetivo:** Verificar se todos os 4 tipos funcionam

**Passos:**
1. Clique em "📊 Nutricional" - vê dados de macros/micros
2. Clique em "📈 Progresso" - vê evolução de peso
3. Clique em "✅ Aderência" - vê taxa de aderência
4. Clique em "💡 Recomendações" - vê sugestões

**Resultado Esperado:**
- ✅ Apenas um relatório visível por vez
- ✅ Seletor muda de cor (classe `.active`)
- ✅ Conteúdo muda completamente
- ✅ Todos os seletores funcionam

**Conteúdo de Cada Relatório:**

| Tipo | Conteúdo Principal |
|------|-------------------|
| Nutricional | Macros, Micros, Hidratação, Gráfico de distribuição |
| Progresso | Peso inicial/atual, IMC, Gráfico evolução |
| Aderência | Taxa %, dias cumpridos, metas atingidas |
| Recomendações | Alimentação, Hidratação, Exercício, Sono |

---

## ✅ TESTE 3: Mudança de Paciente

**Objetivo:** Verificar se dados sincronizam ao trocar paciente

**Passos:**
1. Observe os dados de "Marina Costa"
2. Abra o dropdown "Selecione o paciente:"
3. Escolha "Ricardo Santos"
4. **Observe as mudanças:**
   - Título: "Relatórios — Ricardo Santos"
   - Idade: 41 anos (vs 28)
   - Peso: 88 kg (vs 65)
   - IMC: 27.2 (vs 23.4)
   - Metas: diferentes kcal/macros
   - Aderência: 75% em 7d, 72% em 30d, etc.

5. Selecione "Julia Lima":
   - Título: "Relatórios — Julia Lima"
   - Objetivo: "Manutenção" (vs Emagrecimento)
   - Aderência: 92% em 7d (mais alta)

6. Selecione "Pedro Ferreira":
   - Objetivo: "Hipertrofia"
   - Peso: 75 kg
   - Progresso: +1.7kg em 90 dias (ganho)

**Resultado Esperado:**
- ✅ Título do relatório atualiza
- ✅ TODOS os 4 tipos de relatório atualizam
- ✅ Dados corretos aparecem
- ✅ Período permanece o mesmo
- ✅ Tipo de relatório permanece o mesmo

---

## ✅ TESTE 4: Combinação Período + Tipo + Paciente

**Objetivo:** Teste integrado com todas variáveis

**Cenários:**

### Cenário 1: Marina - Progresso - 90 dias
```
Resultado esperado:
- Progresso inicial: 68.2 kg
- Progresso atual: 65.0 kg
- Mudança: -3.2 kg
```

### Cenário 2: Ricardo - Aderência - 30 dias
```
Resultado esperado:
- Taxa: 72%
- Dias: 25/30
- Status: "Boa"
```

### Cenário 3: Pedro - Progresso - 7 dias
```
Resultado esperado:
- Progresso inicial: 74.8 kg
- Progresso atual: 75.2 kg
- Mudança: +0.4 kg (GANHO - hipertrofia!)
```

---

## ✅ TESTE 5: Botões de Ação

**Objetivo:** Verificar se botões de ação funcionam

**Passos:**

### 5.1 - Botão "🖨️ Imprimir"
1. Clique em "🖨️ Imprimir"
2. **Resultado:** Alert mostra que será enviado para impressão
3. Clique OK

### 5.2 - Botão "📥 Baixar PDF"
1. Clique em "📥 Baixar PDF"
2. **Resultado:** Alert mostra nome do arquivo a gerar
   - Exemplo: `Relatorio_Nutricional_Marina_Costa_2026-04-05.pdf`
3. Clique OK

### 5.3 - Botão "📧 Enviar ao Paciente"
1. À meia direita, clique em "📧 Enviar ao Paciente"
2. **Resultado:** Alert informa que será enviado via app/portal
3. Clique OK

### 5.4 - Botão "📤 Enviar por Email"
1. À meia direita, clique em "📤 Enviar por Email"
2. **Resultado:** Alert mostra email do paciente
   - Exemplo: `marina.costa@email.com`
3. Clique OK

---

## 🐛 Checklist de Erros (O que NÃO deve acontecer)

- [ ] Console erros do navegador abertos
- [ ] Dados não atualizam ao trocar período
- [ ] Dados não atualizam ao trocar paciente
- [ ] Múltiplos relatórios visíveis ao mesmo tempo
- [ ] Botões não respondem ao clique
- [ ] Título não muda com nome do paciente
- [ ] Valores de aderência não fazem senso (ex: > 100%)
- [ ] Gráficos não aparecem
- [ ] Dropdown não funciona

---

## 📱 Teste Responsivo

1. Abra o Firefox ou Chrome DevTools (F12)
2. Clique em "Toggle device toolbar" (Ctrl+Shift+M)
3. Escolha um dispositivo (iPhone, iPad, Desktop)
4. Teste funcionariedades:
   - ✅ Periodo muda
   - ✅ Relatórios trocam
   - ✅ Paciente muda
   - ✅ Layout se adapta

---

## 📊 Valores de Teste Rápido

### Marina Costa
- **7d:** W: 65.0kg, Ader: 88%
- **30d:** W: 65.0kg, Ader: 85%
- **90d:** W: 65.0kg, Ader: 82%

### Ricardo Santos  
- **7d:** W: 88.2kg, Ader: 75%
- **30d:** W: 88.0kg, Ader: 72%
- **90d:** W: 88.0kg, Ader: 70%

### Julia Lima
- **7d:** W: 57.9kg, Ader: 92%
- **30d:** W: 58.0kg, Ader: 90%
- **90d:** W: 58.0kg, Ader: 88%

### Pedro Ferreira
- **7d:** W: 75.2kg, Ader: 86%
- **30d:** W: 75.2kg, Ader: 84%
- **90d:** W: 75.2kg, Ader: 81%

---

## ✨ Casos de Uso Típicos

### Caso 1: Revisar Paciente na Consulta
1. Abra Relatórios
2. Selecione o paciente
3. Escolha "📊 Nutricional"
4. Mostra dados completos de suplementação

### Caso 2: Acompanhar Progresso
1. Selecione o paciente
2. Clique em "📈 Progresso"
3. Mude entre 7d/30d/90d para ver evolução
4. Se progresso é positivo (Hipertrofia) ou negativo (Emagrecimento)

### Caso 3: Analisar Aderência
1. Vá ao relatório "✅ Aderência"
2. Verifique taxa de aderência
3. Se < 70%, reforce motivação com paciente
4. Se > 90%, felicite e adapte plano

### Caso 4: Enviar Relatório
1. Abra relatório desejado
2. Clique "🖨️ Imprimir" para levar impresso
3. Ou "📧 Enviar por Email" para digitar
4. Ou "📥 Baixar PDF" para arquivo

---

## 🎯 Resumo: Tudo Deve Funcionar!

| Feature | Status | Como Testar |
|---------|--------|------------|
| Período 7d/30d/90d | ✅ | Clique nos botões |
| 4 tipos de relatório | ✅ | Clique nos seletores |
| Mudança de paciente | ✅ | Use o dropdown |
| Título atualiza | ✅ | Observe no topo |
| Dados sincronizam | ✅ | Compare números |
| Botões funcionam | ✅ | Clique e veja alertas |
| Sem erros no console | ✅ | Abra DevTools (F12) |

---

## 📞 Se Algo Não Funcionar

1. **Recarregue a página:** Ctrl+Shift+R
2. **Limpe cache:** F12 → Application → Clear Storage → Clear All
3. **Tente outro navegador:** Chrome, Firefox, Edge
4. **Verifique console:** F12 → Console (não deve ter `Uncaught` errors)
5. **Verifique arquivo:** Certifique-se que o arquivo foi salvo corretamente

---

**Teste Duration:** ~15 minutos para teste completo
**Dificuldade:** Fácil ✅
**Status:** Todas as funcionalidades prontas!

