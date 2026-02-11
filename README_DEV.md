# 🚀 TrocaPreço - Guia Rápido de Desenvolvimento

**Versão:** 1.0.12
**Data:** 2026-01-29

---

## ⚡ Início Rápido

### Iniciar Ambiente de Desenvolvimento

**Opção 1: Script Automático (Recomendado)**
```batch
start-dev.bat
```
Isso abrirá 2 janelas:
- Backend rodando em `http://localhost:3000`
- Frontend rodando em `http://localhost:4200`

**Opção 2: Manual**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm start
```

---

## 📁 Estrutura do Projeto

```
trocapreco/
├── backend/                    # Backend Node.js + Express
│   ├── src/
│   │   ├── config/            # Configurações (database)
│   │   ├── controllers/       # Lógica de negócio
│   │   └── routes/            # Rotas da API
│   ├── server.js              # Servidor principal
│   └── package.json
│
├── src/                       # Frontend Angular + Ionic
│   ├── app/
│   │   ├── home/             # Página principal
│   │   ├── services/         # Serviços HTTP
│   │   └── class/            # Models/Classes
│   └── environments/         # Configurações por ambiente
│
├── proxy.conf.js             # Configuração de proxy (dev)
├── start-dev.bat             # Script de início rápido
└── package.json
```

---

## 🔧 Comandos Úteis

### Frontend

```bash
# Iniciar servidor de desenvolvimento
npm start

# Iniciar com acesso na rede local
npm run start:network

# Build para produção
npm run ionic:build:prod

# Executar testes
npm test

# Verificar erros de lint
npm run lint
```

### Backend

```bash
# Iniciar em modo desenvolvimento (com auto-reload)
cd backend
npm run dev

# Iniciar em modo produção
npm start
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend Dev | http://localhost:4200 | Interface do usuário |
| Backend Dev | http://localhost:3000 | API REST |
| Backend Health | http://localhost:3000/ | Status da API |

---

## 🔐 Configuração Inicial

### 1. Instalar Dependências

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Configurar Backend

Crie o arquivo `.env` em `backend/`:

```env
# Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nome_do_banco
DB_USER=usuario
DB_PASSWORD=senha

# JWT Secret
SECRET=sua_chave_secreta_muito_forte_aqui

# Porta do Servidor
PORT=3000
```

### 3. Verificar Proxy

O arquivo `proxy.conf.js` já está configurado para redirecionar `/drfPriceSwap` para `http://localhost:3000`

---

## 📚 Documentação Completa

- **[GUIA_BACKEND_LOCAL.md](GUIA_BACKEND_LOCAL.md)** - Guia completo do backend e botão "Reprovar"
- **[BOTAO_ATUALIZAR_FLUXO.md](BOTAO_ATUALIZAR_FLUXO.md)** - Documentação do botão "Atualizar Dados"
- **[ANALISE_SINCRONIZACAO.md](ANALISE_SINCRONIZACAO.md)** - Análise do sistema de sincronização
- **[GUIA_TESTE_SINCRONIZACAO.md](GUIA_TESTE_SINCRONIZACAO.md)** - Como testar a sincronização

---

## 🧪 Testes Principais

### 1. Testar Botão "Reprovar" (Aprovação de Negociações)

1. Acesse: http://localhost:4200/home/aprovacao-negociacao
2. Clique em "Reprovar" em algum card
3. Confirme a ação
4. Verifique que o card desaparece da lista

### 2. Testar Botão "Atualizar Dados" (Home - Admin)

1. Faça login com usuário cod_usuario = 466
2. Clique no botão verde "Atualizar Dados"
3. Aguarde a sincronização (pode levar até 9 minutos)
4. Verifique logs no console do navegador (F12)

### 3. Testar Login

1. Acesse: http://localhost:4200
2. Digite usuário e senha
3. Verifique redirecionamento para /home

---

## 🐛 Problemas Comuns

### Backend não inicia

**Erro:** `Port 3000 is already in use`
```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID [numero] /F
```

**Erro:** `Cannot find module`
```bash
cd backend
rm -rf node_modules
npm install
```

### Frontend não compila

**Erro:** `Port 4200 is already in use`
- Feche todas as instâncias do `ng serve`
- Ou escolha outra porta quando perguntado

**Erro:** TypeScript errors
```bash
npm install
ng build
```

### Proxy não funciona

1. Certifique-se que o backend está rodando em `localhost:3000`
2. Reinicie o frontend: `Ctrl+C` e `npm start`
3. Verifique logs do proxy no terminal

---

## 🚀 Deploy para Produção

### Build do Frontend

```bash
npm run ionic:build:prod
```

Arquivos gerados em: `www/`

### Backend em Produção

1. Configurar variáveis de ambiente no servidor
2. Executar: `npm start`
3. Configurar PM2 para manter rodando:
```bash
pm2 start server.js --name trocapreco-backend
pm2 save
pm2 startup
```

---

## 🔗 Links Úteis

- **Angular:** https://angular.io/docs
- **Ionic Framework:** https://ionicframework.com/docs
- **Express.js:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 👥 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação nos arquivos `.md`
2. Verifique logs do console (F12 no navegador)
3. Verifique logs do backend no terminal
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 2026-01-29
