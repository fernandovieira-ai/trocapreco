# Backend TrocaPreco

Backend local para o aplicativo TrocaPreco.

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL
- Acesso ao banco de dados do TrocaPreco

## 🚀 Instalação

1. Instale as dependências:

```bash
cd backend
npm install
```

2. Configure o arquivo `.env`:

```bash
cp .env.example .env
```

3. Edite o arquivo `.env` e adicione sua string de conexão:

```env
DATABASE_URL_TROCAPRECOS=postgresql://usuario:senha@host:5432/database
PORT=3000
SECRET=sua_chave_secreta_jwt
```

## ▶️ Como Executar

### Modo de desenvolvimento (com auto-reload):

```bash
npm run dev
```

### Modo de produção:

```bash
npm start
```

O servidor estará disponível em: `http://localhost:3000`

## 🔧 Configuração do Frontend

No arquivo `proxy.conf.js` do frontend, certifique-se de que está apontando para:

```javascript
target: "http://localhost:3000";
```

## 📝 Rotas Disponíveis

- `POST /drfPriceSwap/login` - Login de usuário
- `POST /drfPriceSwap/sincronizaCadastros` - Sincroniza cadastros (corrigido!)
- `POST /drfPriceSwap/buscaEmpresasBase` - Busca empresas
- Outras rotas... (ver `src/routes/drfPriceSwap.js`)

## ✅ Correção Aplicada

A função `sincronizaCadastros` foi corrigida para chamar a procedure correta:

```sql
SELECT {schema}.sp_atualiza_cadastro($1, $2, $3, $4)
```

Parâmetros:

- `schema_base`: Schema dinâmico do banco
- `param1`: 1
- `param2`: 'S'
- `param3`: 0
- `param4`: 'R'

## 📦 Estrutura

```
backend/
├── server.js           # Entrada principal
├── package.json        # Dependências
├── .env.example        # Exemplo de configuração
└── src/
    ├── app.js          # Configuração Express
    ├── config/
    │   └── database.js # Conexão PostgreSQL
    ├── controllers/
    │   └── drfPriceSwap.js # Lógica da API
    └── routes/
        ├── index.js
        └── drfPriceSwap.js # Rotas
```

## 🐛 Debug

Os logs estão ativados para ajudar no debug:

- ✅ Logs de conexão com banco
- ✅ Logs de queries executadas
- ✅ Logs de parâmetros recebidos

Verifique o console para ver os logs em tempo real.
