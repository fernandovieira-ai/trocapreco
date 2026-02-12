# 🚀 Guia de Deploy - TrocaPreço

## 📊 Análise de Prontidão para Deploy

### ✅ Status Geral: **PRONTO COM AJUSTES NECESSÁRIOS**

---

## 🎯 Plataformas de Deploy

### **Frontend (Vercel)**

- ✅ Configuração presente: `vercel.json`
- ✅ Build configurado no angular.json
- ✅ Diretório de saída: `www`
- ⚠️ **AÇÃO NECESSÁRIA**: Atualizar `environment.prod.ts` com URL do Railway

### **Backend (Railway)**

- ✅ Configuração presente: `backend/railway.json`
- ✅ Scripts configurados
- ✅ Dotenv configurado
- ⚠️ **AÇÃO NECESSÁRIA**: Configurar variáveis de ambiente no Railway

---

## 📋 Checklist Pré-Deploy

### ✅ Itens OK

- [x] `.gitignore` completo e protegendo arquivos sensíveis
- [x] Arquivo `.env` NÃO está no controle de versão
- [x] `.env.example` documentado
- [x] Scripts de build configurados
- [x] Service Worker e PWA configurados
- [x] Proxy configurado para desenvolvimento
- [x] CORS configurado no backend
- [x] Socket.io com CORS apropriado
- [x] Dependências atualizadas (deprecation fix aplicado)

### ⚠️ Ajustes Necessários

#### 1. **CRÍTICO: Variáveis de Ambiente no Railway**

Você precisa configurar no painel do Railway:

```env
DATABASE_URL_TROCAPRECOS=postgresql://usuario:senha@host:porta/database
PORT=3000
SECRET=sua_chave_secreta_forte_aqui
```

> ⚠️ **IMPORTANTE**: Use um SECRET diferente e mais forte em produção!

#### 2. **CRÍTICO: Atualizar environment.prod.ts**

Após deploy do backend no Railway, você receberá uma URL. Atualize:

**Arquivo**: [src/environments/environment.prod.ts](src/environments/environment.prod.ts)

```typescript
export const environment = {
  production: true,
  endPoint: "https://SEU-PROJETO.railway.app/drfPriceSwap",
  endPointSocket: "https://SEU-PROJETO.railway.app",
};
```

#### 3. **Atualizar CORS no Backend**

**Arquivo**: [backend/server.js](backend/server.js)

Após deploy do frontend na Vercel, adicione a URL na lista de origens permitidas:

```javascript
const allowed = [
  "http://localhost:4200",
  "http://localhost:8100",
  "https://SEU-PROJETO.vercel.app", // ← Adicionar URL da Vercel
  "https://trocaprecopub.vercel.app",
];
```

#### 4. **Reinstalar Dependências do Backend**

Antes do primeiro deploy, execute:

```bash
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

> Isso aplicará as atualizações de dependências que corrigem a deprecation warning do Node.js.

---

## 🚀 Passo a Passo do Deploy

### Parte 1: Preparar o Repositório GitHub

```bash
# 1. Inicializar git (se ainda não estiver)
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer commit
git commit -m "chore: preparar projeto para deploy"

# 4. Criar repositório no GitHub (via interface web)
# https://github.com/new

# 5. Conectar e fazer push
git remote add origin https://github.com/SEU-USUARIO/trocapreco.git
git branch -M main
git push -u origin main
```

### Parte 2: Deploy do Backend no Railway

1. **Acesse**: https://railway.app/
2. **Login** com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione** o repositório `trocapreco`
5. **Configure o Root Directory**: `backend`
6. **Configurar Variáveis de Ambiente**:
   - Clique em **Variables**
   - Adicione:
     ```
     DATABASE_URL_TROCAPRECOS=<sua_connection_string>
     PORT=3000
     SECRET=<gere_uma_chave_forte>
     ```
7. **Deploy automático** será iniciado
8. **Copie a URL** gerada (ex: `https://trocapreco-production.railway.app`)

### Parte 3: Atualizar Frontend com URL do Backend

```bash
# 1. Atualizar environment.prod.ts com a URL do Railway
# (Ver exemplo no item 2 dos Ajustes Necessários)

# 2. Commit das alterações
git add src/environments/environment.prod.ts
git commit -m "chore: configurar URL de produção do backend"
git push
```

### Parte 4: Deploy do Frontend na Vercel

1. **Acesse**: https://vercel.com/
2. **Login** com GitHub
3. **Add New Project** → **Import Git Repository**
4. **Selecione** o repositório `trocapreco`
5. **Configure**:
   - **Framework Preset**: Angular (detectado automaticamente)
   - **Build Command**: `npm run build -- --configuration production`
   - **Output Directory**: `www`
   - **Install Command**: `npm install`
6. **Deploy**
7. **Copie a URL** gerada (ex: `https://trocapreco.vercel.app`)

### Parte 5: Atualizar CORS no Backend

```bash
# 1. Atualizar backend/server.js com a URL da Vercel
# (Ver exemplo no item 3 dos Ajustes Necessários)

# 2. Commit e push
git add backend/server.js
git commit -m "chore: adicionar URL da Vercel ao CORS"
git push

# 3. Railway fará redeploy automático
```

---

## 🔍 Verificações Pós-Deploy

### Backend (Railway)

- [ ] Acesse `https://SEU-PROJETO.railway.app/drfPriceSwap/health`
- [ ] Verifique logs no painel do Railway
- [ ] Confirme conexão com banco de dados
- [ ] Teste endpoint de login

### Frontend (Vercel)

- [ ] Acesse `https://SEU-PROJETO.vercel.app`
- [ ] Teste login
- [ ] Verifique console do navegador (F12) para erros
- [ ] Teste WebSocket (atualizações em tempo real)
- [ ] Verifique funcionalidade PWA

---

## 🔒 Segurança

### ✅ Já Implementado

- `.env` no `.gitignore`
- CORS configurado
- JWT autenticação
- HTTPS automático (Vercel e Railway)

### 🛡️ Recomendações Adicionais

1. **Gerar SECRET forte**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Rotação de secrets**:
   - Trocar SECRET periodicamente
   - Usar diferentes secrets para dev/prod

3. **Rate Limiting** (futuro):

   ```bash
   npm install express-rate-limit
   ```

4. **Helmet.js** para headers de segurança (futuro):
   ```bash
   npm install helmet
   ```

---

## 📱 PWA e Service Worker

O projeto já está configurado como PWA:

- ✅ `manifest.webmanifest`
- ✅ Service Worker ativado
- ✅ `ngsw-config.json`
- ✅ Ícones em `src/assets/icons`

**Após deploy na Vercel**, os usuários poderão:

- Instalar o app na tela inicial
- Usar offline (cache configurado)
- Receber atualizações automáticas

---

## 🔄 CI/CD Automático

Após configuração inicial:

### GitHub → Railway (Backend)

- ✅ Push na branch `main` → deploy automático
- ✅ Rollback disponível no painel

### GitHub → Vercel (Frontend)

- ✅ Push na branch `main` → deploy automático
- ✅ Preview automático para Pull Requests
- ✅ Rollback com 1 clique

---

## 📊 Monitoramento

### Railway

- Logs em tempo real
- Métricas de CPU/RAM
- Alertas configuráveis

### Vercel

- Analytics disponível
- Core Web Vitals
- Logs de requisições
- Erros do cliente

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to backend"

- Verifique URL em `environment.prod.ts`
- Confirme que backend está online no Railway
- Verifique CORS no `backend/server.js`

### Erro: "Database connection failed"

- Verifique `DATABASE_URL_TROCAPRECOS` no Railway
- Confirme que IP do Railway está permitido no PostgreSQL
- Verifique logs no Railway

### Erro: "WebSocket connection failed"

- Verifique `endPointSocket` em `environment.prod.ts`
- Confirme CORS do Socket.io no `backend/server.js`
- Railway suporta WebSocket por padrão

### Build falha na Vercel

- Verifique logs de build
- Confirme que dependências estão no `package.json`
- Teste build local: `npm run build -- --configuration production`

---

## 🎓 Resumo Executivo

**Status**: ✅ Projeto está estruturado corretamente para deploy

**Ações Imediatas**:

1. ⚠️ Reinstalar dependências do backend (`cd backend && npm install`)
2. ⚠️ Criar repositório no GitHub
3. ⚠️ Deploy backend no Railway e copiar URL
4. ⚠️ Atualizar `environment.prod.ts` com URL do Railway
5. ⚠️ Deploy frontend na Vercel e copiar URL
6. ⚠️ Atualizar CORS no backend com URL da Vercel

**Tempo Estimado**: 30-45 minutos

**Custo**:

- Vercel: Grátis (Hobby plan)
- Railway: $5/mês por serviço (inclui $5 de crédito grátis)
- Banco de dados: Depende do provedor PostgreSQL atual

---

## 📞 Suporte

**Em caso de dúvidas**:

- Documentação Vercel: https://vercel.com/docs
- Documentação Railway: https://docs.railway.app
- Ionic Deploy: https://ionicframework.com/docs/deployment

**Logs e Debug**:

- Railway: Painel → Deployments → Ver logs
- Vercel: Painel → Deployment → Function Logs
- Browser: F12 → Console/Network

---

**Versão**: 1.0.13  
**Data**: 12/02/2026  
**Autor**: Digital RF
