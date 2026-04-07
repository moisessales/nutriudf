# ⚡ COMECE AGORA - Instruções de 5 Minutos

**Tempo estimado**: 5 minutos para tudo funcionando  
**Dificuldade**: ⭐ Muito fácil

---

## 1️⃣ Terminal 1 - Banco de Dados (2 min)

```bash
# Criar banco
mysql -u root -p
```

```sql
CREATE DATABASE nutriudf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

✅ **Pronto**: Banco criado

---

## 2️⃣ Terminal 2 - Backend (2 min)

```bash
cd nutriudf/backend
npm install
npm start
```

✅ **Pronto**: Deve mosfar:
```
🚀 Servidor rodando em http://localhost:3000
✅ Conexão MySQL estabelecida
```

---

## 3️⃣ Terminal 3 - Frontend (1 min)

```bash
cd nutriudf

# Opção 1: Se tem Python
python -m http.server 5500

# Opção 2: Se tem Node
npx http-server -p 5500

# Opção 3: VS Code - clique direito em nutri_saas_mockup_v2.html
# → Open with Live Server
```

✅ **Pronto**: Browser abrirá automaticamente

---

## 4️⃣ Abrir a Aplicação

Abrir em seu browser:

```
http://localhost:5500/nutri_saas_mockup_v2.html
```

---

## 5️⃣ Fazer Login

```
Email:    dra.ana@nutriudf.com
Senha:    123456
```

Clicar "Entrar" → Se entrar no Dashboard = SUCESSO! ✅

---

## 🎯 Testar Funcionalidades

### Criar Paciente
- Dashboard → "Novo paciente"
- Preencher form
- Clicar "Salvar"
- ✅ de sucesso Mostra mensagem

### Ver Lista de Pacientes
- Menu → "Pacientes"
- ✅ Mostra tabela com pacientes da API

### Criar Plano
- Dashboard → "Novo plano"
- Preencher dados
- Clicar "Criar Plano"
- ✅ Redireciona para tela de planos

### Ver Relatórios
- Menu → "Relatórios"
- ✅ Mostra 4 tipos x 3 períodos

### Fazer Logout
- Clique "Sair" na sidebar
- ✅ Volta para login

---

## 🐛 Se der Erro

### "Cannot connect to localhost:3000"
```bash
# Backend não está rodando
# Terminal 2: npm start
```

### "Login não funciona"
```bash
# Usuário não existe no banco
# Execute em novo terminal:
mysql -u root -p nutriudf -e "SELECT * FROM users;"
# Se vazio, rodar migrations: node backend/migrations/run.js
```

### Branco na tela
```bash
# Esperar 2-3 segundos
# F12 → Console para ver erros
```

---

## ✅ Tudo Ok? 

Se conseguiu:
- ✅ Fazer login
- ✅ Criar paciente  
- ✅ Ver relatórios
- ✅ Sem erros no console

**PARABÉNS! INTEGRAÇÃO FUNCIONANDO!** 🎉

---

## 📚 Documentação Completa

Ver arquivos criados:

1. **RESUMO_INTEGRACAO.md** - Visão geral técnica
2. **GUIA_TESTES_INTEGRACAO.md** - Testes detalhados
3. **CHECKLIST_VALIDACAO.md** - Validação ponto-a-ponto
4. **RELEASE_NOTES_v1.0.md** - Notas de lançamento

---

## 🚀 Próximas Fases

Quando tudo estiver funcionando:

### Adicionar do Backend
- [ ] Editar paciente (PUT /api/patients/:id)
- [ ] Deletar paciente (DELETE /api/patients/:id)
- [ ] Histórico de consultas
- [ ] Geração de PDF

### Melhorar Frontend
- [ ] Loading spinners
- [ ] Melhor validação
- [ ] Mais estilos

### Deploy
- [ ] Hospedar backend (Heroku, Railway)
- [ ] Hospedar frontend (Vercel, Netlify)
- [ ] Usar HTTPS

---

**Tempo decorrido: ~5 min. Sistema rodando!** ✅
