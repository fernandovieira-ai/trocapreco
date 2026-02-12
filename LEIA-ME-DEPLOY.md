# 🚀 TrocaPreço - Versão Pronta para Deploy

## ✅ Esta versão está PRONTA para subir no GitHub/Vercel/Railway

### 📦 O que foi preparado nesta versão:

1. ✅ **Arquivos sensíveis removidos** (.env, credenciais, logs)
2. ✅ **node_modules removidos** (serão reinstalados no deploy)
3. ✅ **Cache e builds temporários limpos**
4. ✅ **Variáveis de ambiente configuradas** (.env.example documentado)
5. ✅ **URLs de produção preparadas** (com TODOs para substituir)
6. ✅ **CORS configurado** para aceitar Vercel
7. ✅ **Dependências atualizadas** (deprecation fix aplicado)

---

## 🚀 DEPLOY EM 5 PASSOS

### 1️⃣ Criar Repositório GitHub

```bash
cd "C:\Linx\cliente\digitalrf\projeto\bkp\trocapreco"
git init
git add .
git commit -m "feat: versão inicial pronta para deploy"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/trocapreco.git
git push -u origin main
```

### 2️⃣ Deploy do Backend no Railway

1. Acesse: https://railway.app/
2. Login com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecione: `trocapreco`
5. Configure **Root Directory**: `backend`
6. **Adicione Variáveis de Ambiente**:
   ```
   DATABASE_URL_TROCAPRECOS=postgresql://...
   PORT=3000
   SECRET=<gere uma chave forte>
   ```
7. Copie a URL gerada (ex: `https://trocapreco-production.railway.app`)

### 3️⃣ Atualizar Frontend com URL do Railway

**Arquivo**: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  endPoint: "https://trocapreco-production.railway.app/drfPriceSwap",
  endPointSocket: "https://trocapreco-production.railway.app",
};
```

```bash
git add src/environments/environment.prod.ts
git commit -m "chore: configurar URL de produção do backend"
git push
```

### 4️⃣ Deploy do Frontend na Vercel

1. Acesse: https://vercel.com/
2. Login com GitHub
3. **Add New Project**
4. Selecione: `trocapreco`
5. Configure:
   - **Build Command**: `npm run build -- --configuration production`
   - **Output Directory**: `www`
6. **Deploy**
7. Copie a URL (ex: `https://trocapreco.vercel.app`)

### 5️⃣ Atualizar CORS no Backend

**Arquivo**: `backend/server.js`

Adicione sua URL da Vercel:

```javascript
const allowed = [
  "http://localhost:4200",
  "http://localhost:8100",
  "https://trocapreco.vercel.app", // ← SUA URL AQUI
];
```

```bash
git add backend/server.js
git commit -m "chore: adicionar URL da Vercel ao CORS"
git push
```

Railway fará redeploy automático! ✅

---

## 🔐 Gerar SECRET Forte

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use no Railway como variável `SECRET`.

---

## 📝 Checklist Pré-Deploy

Antes de fazer git push, confira:

- [ ] Removido arquivo `.env` do backend
- [ ] `.env.example` documentado
- [ ] `environment.prod.ts` atualizado com URL do Railway
- [ ] CORS do `backend/server.js` atualizado com URL da Vercel
- [ ] Backend `package.json` com dependências atualizadas
- [ ] Sem credenciais hardcoded no código
- [ ] `.gitignore` correto (já está)

---

## 🔄 Desenvolvimento Local (Opcional)

Se quiser testar localmente antes do deploy:

### Backend:

```bash
cd backend
copy .env.example .env
# Edite .env com suas credenciais locais
npm install
npm start
```

### Frontend:

```bash
npm install
npm start
```

Acesse: http://localhost:4200

---

## 📚 Documentação Completa

Consulte [DEPLOY.md](DEPLOY.md) para:

- Troubleshooting
- Monitoramento
- Configurações avançadas
- PWA e Service Worker
- CI/CD automático

---

## ⚡ Atalhos Rápidos

### Reinstalar dependências (se necessário):

```bash
# Frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

# Backend
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Ver status do Git:

```bash
git status
git log --oneline -10
```

### Desfazer último commit (local):

```bash
git reset --soft HEAD~1
```

---

## 🎯 Estrutura do Projeto

```
trocapreco/
├── src/                          # Frontend Angular/Ionic
│   ├── app/
│   │   ├── login/               # Tela de login
│   │   ├── home/                # Módulos principais
│   │   └── services/            # Serviços compartilhados
│   ├── environments/
│   │   ├── environment.ts       # Dev (localhost)
│   │   └── environment.prod.ts  # Prod (Railway/Vercel)
│   └── assets/                  # Imagens, ícones
│
├── backend/                      # Backend Node.js/Express
│   ├── src/
│   │   ├── config/              # Configuração DB
│   │   ├── controllers/         # Lógica de negócio
│   │   └── routes/              # Rotas da API
│   ├── .env.example            # Template de variáveis
│   ├── railway.json            # Config Railway
│   └── server.js               # Entrada do servidor
│
├── vercel.json                  # Config Vercel
├── DEPLOY.md                    # Guia completo
└── LEIA-ME-DEPLOY.md           # Quick start (este arquivo)
```

---

## 📞 Troubleshooting Rápido

### "Cannot connect to backend"

→ Verifique URL em `environment.prod.ts`  
→ Confirme backend está online no Railway  
→ Veja logs no Railway

### "Database connection failed"

→ Verifique variável `DATABASE_URL_TROCAPRECOS` no Railway  
→ Confirme credenciais do banco

### "CORS error"

→ Adicione URL da Vercel em `backend/server.js`  
→ Faça push para atualizar

### Build falha

→ Veja logs no Vercel/Railway  
→ Teste build local: `npm run build -- --configuration production`

---

## ✨ Pronto!

Este projeto está **100% preparado** para deploy.

Basta seguir os 5 passos acima e em **30-45 minutos** você terá:

- ✅ Frontend rodando na Vercel com HTTPS
- ✅ Backend rodando no Railway com HTTPS
- ✅ Banco de dados PostgreSQL conectado
- ✅ WebSocket funcionando
- ✅ PWA instalável
- ✅ CI/CD automático

**Boa sorte! 🚀**

---

**Versão**: 1.0.13  
**Data**: 12/02/2026  
**Autor**: Digital RF
