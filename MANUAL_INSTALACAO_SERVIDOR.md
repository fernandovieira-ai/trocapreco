# Manual de Instalação - TrocaPreço (Servidor)

## 📋 Pré-requisitos

### Software Necessário

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verificar instalação: `node --version` e `npm --version`

2. **PostgreSQL** (versão 12 ou superior)
   - Download: https://www.postgresql.org/download/
   - Verificar instalação: `psql --version`

3. **Git** (opcional, para clonar o repositório)
   - Download: https://git-scm.com/

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Criar o banco de dados

```bash
# Acessar o PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE trocaprecos;

# Conectar ao banco criado
\c trocaprecos
```

### Passo 2: Executar o script de criação das tabelas

Execute o arquivo SQL localizado em `ajuste/database/base.sql`:

```bash
psql -U postgres -d trocaprecos -f ajuste/database/base.sql
```

Ou copie e execute o conteúdo do arquivo diretamente no psql.

---

## ⚙️ Configuração do Backend

### Passo 1: Navegar até a pasta do backend

```bash
cd backend
```

### Passo 2: Instalar dependências

```bash
npm install
```

### Passo 3: Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `backend` com base no `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configuração do Banco de Dados TrocaPrecos
DATABASE_URL_TROCAPRECOS=postgresql://postgres:suasenha@localhost:5432/trocaprecos

# Porta do servidor
PORT=3000

# JWT Secret
SECRET=sua_chave_secreta_aqui_mude_isso
```

**⚠️ IMPORTANTE:** Substitua os valores:

- `postgres` → seu usuário do PostgreSQL
- `suasenha` → senha do PostgreSQL
- `localhost` → IP do servidor (use `localhost` se for local)
- `5432` → porta do PostgreSQL (padrão é 5432)
- `trocaprecos` → nome do banco de dados criado

### Passo 4: Testar o backend

```bash
npm start
```

Se tudo estiver correto, verá:

```
Backend TrocaPreco rodando na porta: 3000
http://localhost:3000
✅ Base de dados TrocaPrecos conectada com sucesso!
```

Acesse `http://localhost:3000` no navegador. Deve aparecer:

```json
{
  "success": true,
  "message": "API TrocaPreco - Backend Online",
  "version": "1.0.0"
}
```

---

## 🎨 Configuração do Frontend

### Passo 1: Voltar para a raiz do projeto

```bash
cd ..
```

### Passo 2: Instalar dependências

```bash
npm install
```

### Passo 3: Configurar o proxy (se necessário)

O arquivo `proxy.conf.json` já está configurado. Verifique se aponta para o backend correto:

```json
{
  "/drfPriceSwap": {
    "target": "https://variedades.digitalrf.com.br",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Para ambiente local, pode ser necessário ajustar para:

```json
{
  "/drfPriceSwap": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### Passo 4: Iniciar o frontend

```bash
npm start
```

O aplicativo será iniciado em `http://localhost:4200`

---

## 🚀 Inicialização Completa

### Em Desenvolvimento (2 terminais)

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
npm start
```

### Em Produção

#### Opção 1: Build do frontend para servir pelo backend

```bash
# Build do frontend
npm run build

# Copiar dist para pasta pública do backend
# (configure o Express para servir arquivos estáticos)
```

#### Opção 2: Usar PM2 (recomendado para produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar backend
cd backend
pm2 start server.js --name "trocapreco-backend"

# Para frontend em produção, use nginx ou outro servidor web
```

---

## 📦 Dependências Principais

### Backend

- **express** - Framework web
- **pg** - Cliente PostgreSQL
- **socket.io** - WebSocket para comunicação real-time
- **cors** - Permitir requisições de diferentes origens
- **jsonwebtoken** - Autenticação JWT
- **dotenv** - Variáveis de ambiente
- **moment** - Manipulação de datas
- **nodemailer** - Envio de emails
- **pdfkit** - Geração de PDFs

### Frontend

- **@angular/core** (v16.2) - Framework Angular
- **@ionic/angular** (v7.5) - Framework Ionic
- **socket.io-client** - Cliente WebSocket
- **firebase** - Integração com Firebase
- **jwt-decode** - Decodificação de tokens JWT
- **moment** - Manipulação de datas

---

## 🔧 Solução de Problemas

### Backend não conecta ao banco de dados

1. Verifique se o PostgreSQL está rodando:

   ```bash
   # Windows
   Get-Service postgresql*

   # Linux
   sudo systemctl status postgresql
   ```

2. Teste a conexão manual:

   ```bash
   psql -U postgres -d trocaprecos
   ```

3. Verifique as credenciais no arquivo `.env`

### Porta já em uso

```bash
# Windows - encontrar processo
netstat -ano | findstr :3000
netstat -ano | findstr :4200

# Matar processo (substitua PID)
taskkill /PID numero_do_pid /F

# Linux
lsof -i :3000
kill -9 PID
```

### Erro ao instalar dependências

```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🌐 Portas Utilizadas

- **Backend:** 3000 (configurável no `.env`)
- **Frontend:** 4200 (desenvolvimento)
- **PostgreSQL:** 5432 (padrão)

---

## 📝 Checklist de Instalação

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `trocaprecos` criado
- [ ] Script SQL executado (tabelas criadas)
- [ ] Dependências do backend instaladas (`backend/npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Backend iniciando sem erros (`npm start`)
- [ ] Conexão com banco confirmada (✅ no console)
- [ ] Dependências do frontend instaladas (`npm install` na raiz)
- [ ] Frontend iniciando sem erros
- [ ] Aplicação acessível em `http://localhost:4200`

---

## 📞 Suporte

Para problemas ou dúvidas:

- Email: contato@digitalrf.com.br
- Homepage: https://digitalrf.com.br

**Versão do Manual:** 1.0.0  
**Data:** Fevereiro 2026
