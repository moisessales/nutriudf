# 📋 Guia de Teste - Sistema de Sincronização CRUD

## ✅ Status da Implementação

O sistema foi implementado com **sincronização completa** entre todas as ferramentas:
- ✅ Criar paciente (CREATE)
- ✅ Editar paciente (EDIT)  
- ✅ Deletar paciente (DELETE)
- ✅ Atualizar seletores em "Planos alimentares"
- ✅ Atualizar seletores em "Relatórios"
- ✅ Atualizar gráficos do Dashboard
- ✅ Logging completo no console para debugging

---

## 🧪 TESTE 1: Criar Paciente (Create)

### Passo a Passo:

1. **Abrir navegador**
   - URL: http://127.0.0.1:5500
   - Página deve carregar normalmente

2. **Ir para aba "Pacientes"**
   - Clique na aba verde "👥 Pacientes" no topo

3. **Abrir modal de novo paciente**
   - Clique no botão "+ 🎉 Novo paciente"

4. **Preencher formulário**
   - Nome: `João Silva`
   - Email: `joao@example.com`
   - Age (Idade): `25`
   - Weight (Peso): `70`
   - Height (Altura): `1.75`
   - Goal (Meta): Perder peso

5. **Salvar**
   - Clique no botão "✅ Salvar"

### 🔍 Verificações (Esperado):

- ✅ **Sucesso**: Mensagem "✅ Paciente 'João Silva' criado com sucesso!"
- ✅ **Tabela**: João Silva aparece imediatamente na tabela de pacientes
- ✅ **Seletor Planos**: Se for para aba "Planos alimentares", João Silva aparece no seletor de pacientes
- ✅ **Seletor Relatórios**: Se for para aba "Relatórios", João Silva aparece no seletor
- ✅ **Console (F12)**: Deve aparecer logs com `[CREATE]` mostrando a operação

### ❌ Se Não Funcionar:

1. Abrir Console (F12)
2. Procurar por erros em vermelho
3. Verificar logs com `[CREATE]`
4. **Erros comuns:**
   - "400 Bad Request" → Verifique se backend está rodando (localhost:3000)
   - Paciente não aparece → Verifique console para erros de conexão
   - Seletor não atualiza → Verifique se `updatePatientSelectors()` está sendo chamado

---

## 🧪 TESTE 2: Editar Paciente (Edit)

### Passo a Passo:

1. **Estar na aba "Pacientes"**
   - Se não estiver, clique na aba "👥 Pacientes"

2. **Encontrar paciente criado**
   - Procure por "João Silva" na tabela

3. **Abrir modal de edição**
   - Clique no botão "✏️ Editar" (ao lado do paciente)

4. **Modificar um campo**
   - Mudar Weight: `70` → `68`
   - Ou Age: `25` → `26`

5. **Salvar alterações**
   - Clique no botão "✅ Salvar alterações"

### 🔍 Verificações (Esperado):

- ✅ **Sucesso**: Mensagem "✅ Paciente 'João Silva' atualizado com sucesso! IMC: XX.XX"
- ✅ **Tabela**: Peso atualizado na tabela, IMC recalculado
- ✅ **Dashboard**: Se abrir aba "Dashboard", estatísticas devem refletir o novo peso
- ✅ **Console (F12)**: Deve aparecer logs com `[EDIT]` mostrando a operação

### ❌ Se Não Funcionar:

1. Abrir Console (F12)
2. Procurar por erros em vermelho  
3. Verificar logs com `[EDIT]`
4. **Erros comuns:**
   - "404 Not Found" → Verifique se o paciente ID está correto
   - Valores não atualizam → Verifique se `window.patients` está sendo modificado

---

## 🧪 TESTE 3: Deletar Paciente (Delete)

### Passo a Passo:

1. **Estar na aba "Pacientes"**
   - Se não estiver, clique na aba "👥 Pacientes"

2. **Encontrar paciente para deletar**
   - Procure por "João Silva" na tabela

3. **Abrir modal de deleção**
   - Clique no botão "🗑️ Deletar" (ao lado do paciente)

4. **Confirmar deleção**
   - Clique no botão vermelho "🗑️ CONFIRMAR DELEÇÃO"

### 🔍 Verificações (Esperado):

- ✅ **Sucesso**: Mensagem "✅ Paciente 'João Silva' deletado com sucesso!"
- ✅ **Tabela**: João Silva desaparece da tabela
- ✅ **Seletor Planos**: Se for para "Planos alimentares", João Silva não aparece mais
- ✅ **Seletor Relatórios**: Se for para "Relatórios", João Silva não aparece mais
- ✅ **Console (F12)**: Deve aparecer logs com `[DELETE]` mostrando a operação

### ❌ Se Não Funcionar:

1. Abrir Console (F12)
2. Procurar por erros em vermelho
3. Verificar logs com `[DELETE]`
4. **Erros comuns:**
   - "404 Not Found" → Paciente já foi deletado
   - Array não atualiza → Verifique se `splice()` está funcionando

---

## 🖥️ Console (F12) - Debugging

### Como Abrir:
1. Pressionar **F12** (ou Ctrl+Shift+I)
2. Clicar na aba **"Console"**

### Comandos Úteis:

```javascript
// Ver lista de pacientes
window.patients.length

// Ver primeiro paciente
window.patients[0]

// Ver todos os pacientes
console.table(window.patients)

// Buscar paciente específico
window.patients.find(p => p.name === 'João Silva')
```

### Logs Esperados:

- **CREATE**: `✅ [CREATE] Paciente ... criado com sucesso`
- **EDIT**: `✅ [EDIT] Paciente atualizado com sucesso`
- **DELETE**: `✅ [DELETE] Array atualizado. Pacientes restantes: X`
- **SYNC**: `🔄 [SYNC] Atualizando todas as visualizações...`

---

## 📊 Fluxo Completo (Teste Integrado)

Para testar o sistema completo:

1. **Criar 3 pacientes**: João, Maria, Carlos
2. **Ir para "Planos alimentares"**: Verificar se todos 3 aparecem no seletor
3. **Editar a Maria**: Mudar peso
4. **Ir para "Dashboard"**: Verificar se estatísticas atualizaram
5. **Deletar o Carlos**: Verificar se desaparece de todos os seletores
6. **Console (F12)**: Procurar por logs de [CREATE], [EDIT], [DELETE], [SYNC]

### ✅ Teste Passou Se:
- Todos os seletores atualizam automaticamente
- Dashboard reflete as mudanças
- Console mostra logs em sequência
- Nenhum erro vermelho no console

---

## 🆘 Troubleshooting

### Backend não está respondendo?
```
Erro: "Failed to fetch" ou "Connection refused"
Solução: Verificar se backend está rodando em localhost:3000
```

### Paciente criado mas não aparece em nenhum lugar?
```
Erro: Array vazio ou console mostrando erro
Solução: Abrir F12, verifi se há erro: "Unexpected token" ou "API error"
```

### Seletor não atualiza após criar paciente?
```
Erro: Seletor vazio ou sem opção nova
Solução: Pode ser que updatePatientSelectors() não foi chamado
        Verificar console por: "[SYNC] Seletores de pacientes atualizados"
```

### Gráficos não estão atualizando?
```
Erro: Gráficos mostram dados antigos após editar paciente
Solução: Verificar se renderAdvancedCharts() foi chamado
        Verificar console por: "[SYNC] Gráficos atualizados"
```

---

## 📝 Resumo da Implementação

| Operação | CREATE | EDIT | DELETE |
|----------|--------|------|--------|
| Validação | ✅ | ✅ | ✅ |
| API Call | ✅ | ✅ | ✅ |
| Array Update | ✅ | ✅ | ✅ |
| Tabela Atualiza | ✅ | ✅ | ✅ |
| Seletores Atualizam | ✅ | ✅ | ✅ |
| Relatórios Atualizam | ✅ | ✅ | ✅ |
| Gráficos Atualizam | ✅ | ✅ | ✅ |
| Logging Completo | ✅ | ✅ | ✅ |

---

**Pronto para testar? Comece pelo Teste 1! 🚀**
