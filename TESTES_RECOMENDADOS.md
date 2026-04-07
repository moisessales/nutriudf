# 🧪 Testes do Sistema - NutriUDF SaaS

## ✅ Status Atual
- ✅ Backend rodando em `http://localhost:3000`
- ✅ CORS configurado para `http://127.0.0.1:5500`
- ✅ MySQL com banco `nutriudf` ativo
- ✅ Todas as correções de CRUD aplicadas
- ✅ Estado global `window.patients` sincronizado

## 📋 Passos para Testar

### 1. **Abra o HTML no Navegador**
```
http://127.0.0.1:5500/nutri_saas_mockup_v2.html
```

### 2. **Faça Login**
- **Email:** `teste@email.com`
- **Senha:** `123456`

### 3. **Teste CRIAR Paciente** ✏️
1. Clique em "+ Novo paciente"
2. Preencha os dados:
   - Nome: `João Silva`
   - Email: `joao@email.com`
   - Idade: `30`
   - Peso: `75`
   - Altura: `1.80`
   - Objetivo: `Saúde`
3. Clique em "Salvar"
4. ✅ Verifique se apareceu na tabela

### 4. **Teste EDITAR Paciente** ✏️
1. Clique em "✏️ Editar" em qualquer paciente
2. Digite no campo "Peso": `80`
3. Clique em "Salvar alterações"
4. ✅ Verifique se o peso foi atualizado

### 5. **Teste DELETAR Paciente** 🗑️
1. Clique em "🗑️ Deletar" em qualquer paciente
2. Confirme no modal "Tem certeza?"
3. ✅ Verifique se foi removido da tabela

### 6. **Teste BUSCAR/FILTRAR** 🔍
1. Digite um nome na barra de busca
2. ✅ Tabela deve filtrar em tempo real
3. Use o filtro por objetivo (dropdown)
4. ✅ Tabela deve mostrar apenas pacientes com aquele objetivo

### 7. **Teste GRÁFICOS** 📊
1. Vá para a aba "Dashboard"
2. Clique em "📊 Gráficos avançados"
3. ✅ Devem aparecer 4 gráficos:
   - Distribuição de Objetivos (Doughnut)
   - Distribuição de IMC (Bar)
   - Idade vs Peso (Scatter)
   - Estatísticas (Gauge)

### 8. **Teste PDF** 📄
1. Clique em "📄 PDF" em qualquer paciente
2. ✅ Deve fazer download de um arquivo PDF

## 🔴 Se Encontrar Problemas

### Abra o Console (F12)
1. Pressione `F12` no navegador
2. Vá para a aba "Console"
3. Digite: `window.patients`
4. ✅ Deve aparecer array com os pacientes

### Verifique CORS
1. Se receber erro de "Failed to fetch"
2. Console mostrará erro de CORS
3. Verifique se está acessando em `127.0.0.1:5500` (não `localhost`)

### Verifique Token
1. No console, digite: `authToken`
2. ✅ Deve mostrar um token JWT longo

## 📌 Notas Importantes

- **Array Global:** Todos os dados agora usam `window.patients`
- **Inicialização:** Sistema carrega dados da API automaticamente ao abrir
- **Fallback:** Se API não responder, usar dados padrão (4 pacientes de exemplo)
- **Local-First:** Quando criar paciente, aparece imediatamente mesmo se API falhar

## ✅ Checklist de Sucesso

- [ ] Login funciona
- [ ] Consegue criar novo paciente
- [ ] Consegue editar paciente
- [ ] Consegue deletar paciente
- [ ] Busca filtra pacientes
- [ ] Gráficos aparecem
- [ ] PDF baixa
- [ ] Nenhum erro em F12 Console

---

**Quando terminar os testes, reporte:**
1. Qual teste falhou (se algum)
2. Qual erro apareceu no console (F12)
3. Se quer corrigir algo específico
