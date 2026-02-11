# 🖥️ Guia Backend Local - TrocaPreço

**Data:** 2026-01-29
**Sistema:** TrocaPreço v1.0.12

---

## 📋 Resumo das Alterações

### ✅ O Que Foi Corrigido

**1. Botão "Reprovar" na Tela de Aprovação**
- ✅ Botão já existe no HTML ([aprovacao-negociacao.page.html:143-152](src/app/home/aprovacao-negociacao/aprovacao-negociacao.page.html#L143-L152))
- ✅ Método `reprovarRegra()` implementado no TypeScript ([aprovacao-negociacao.page.ts:171-207](src/app/home/aprovacao-negociacao/aprovacao-negociacao.page.ts#L171-L207))
- ✅ Serviço `reprovaRegra()` implementado ([movimento.service.ts:429-445](src/app/services/movimento.service.ts#L429-L445))
- ✅ Endpoint `/reprovaRegra` configurado no backend ([backend/src/routes/drfPriceSwap.js:64](backend/src/routes/drfPriceSwap.js#L64))
- ✅ Controller `reprovaRegra` implementado ([backend/src/controllers/drfPriceSwap.js:1304-1334](backend/src/controllers/drfPriceSwap.js#L1304-L1334))

**2. Correção na Query de Busca**
- ❌ **PROBLEMA:** Query estava buscando `ind_status = 'X'` (reprovadas)
- ✅ **CORRIGIDO:** Agora busca `ind_status != 'X'` (pendentes)
- 📍 **Local:** [backend/src/controllers/drfPriceSwap.js:889](backend/src/controllers/drfPriceSwap.js#L889)

---

## 🎯 Funcionamento do Botão "Reprovar"

### Fluxo Completo

```
┌─────────────────────────────────────────────────┐
│  1️⃣  USUÁRIO CLICA NO BOTÃO "REPROVAR"          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  2️⃣  ALERTA DE CONFIRMAÇÃO                       │
│  ┌───────────────────────────────────────────┐  │
│  │ Título: "ATENÇÃO"                        │  │
│  │ Mensagem: "Deseja reprovar esta          │  │
│  │            negociação?"                  │  │
│  │ Aviso: "Esta ação não poderá ser         │  │
│  │         desfeita"                        │  │
│  │ Botões: "Cancelar" ou "Sim"             │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  3️⃣  FRONTEND ENVIA REQUISIÇÃO                   │
│  ┌───────────────────────────────────────────┐  │
│  │ Endpoint: POST /reprovaRegra             │  │
│  │ Body: {                                  │  │
│  │   schema: "nome_do_schema",             │  │
│  │   seq_lote: 123                         │  │
│  │ }                                        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  4️⃣  BACKEND EXECUTA UPDATE                      │
│  ┌───────────────────────────────────────────┐  │
│  │ SQL 1:                                   │  │
│  │ UPDATE schema.tab_nova_regra             │  │
│  │ SET ind_status = 'X'                     │  │
│  │ WHERE seq_lote_alteracao = 123           │  │
│  │                                          │  │
│  │ SQL 2:                                   │  │
│  │ UPDATE schema.tab_progresso_lote         │  │
│  │ SET error = 'Reprovado'                  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  5️⃣  BACKEND RETORNA SUCESSO                     │
│  ┌───────────────────────────────────────────┐  │
│  │ {                                        │  │
│  │   message: "Negociação Reprovada com     │  │
│  │             Sucesso."                    │  │
│  │ }                                        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  6️⃣  FRONTEND ATUALIZA LISTA                     │
│  ┌───────────────────────────────────────────┐  │
│  │ • Mostra toast de sucesso                │  │
│  │ • Emite evento WebSocket                 │  │
│  │ • Recarrega lista de negociações         │  │
│  │ • Card reprovado DESAPARECE da tela      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Como Iniciar o Backend Local

### Pré-requisitos

- Node.js instalado (v14 ou superior)
- PostgreSQL configurado
- Arquivo `.env` configurado

### Passo 1: Navegar até a pasta do backend

```bash
cd C:\Linx\cliente\digitalrf\projeto\trocapreco\backend
```

### Passo 2: Instalar dependências (primeira vez)

```bash
npm install
```

### Passo 3: Configurar variáveis de ambiente

Verifique se o arquivo `.env` existe e está configurado corretamente:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nome_do_banco
DB_USER=usuario
DB_PASSWORD=senha

# JWT
SECRET=sua_chave_secreta_aqui

# Porta do Servidor
PORT=3000
```

### Passo 4: Iniciar o backend

**Modo desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

### Passo 5: Verificar se o backend está rodando

Acesse no navegador: [http://localhost:3000](http://localhost:3000)

Deve retornar:
```json
{
  "success": true,
  "message": "API TrocaPreco - Backend Online",
  "version": "1.0.0"
}
```

---

## 🔧 Configuração do Proxy no Frontend

O proxy já está configurado em [proxy.conf.js](proxy.conf.js):

```javascript
const PROXY_CONFIG = {
  "/drfPriceSwap": {
    target: "http://localhost:3000",
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
  }
};
```

Isso significa que todas as requisições para `/drfPriceSwap/*` serão redirecionadas para `http://localhost:3000/drfPriceSwap/*`

---

## 🧪 Como Testar o Botão "Reprovar"

### 1. Iniciar Backend e Frontend

**Terminal 1 - Backend:**
```bash
cd C:\Linx\cliente\digitalrf\projeto\trocapreco\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Linx\cliente\digitalrf\projeto\trocapreco
npm start
```

### 2. Acessar a Aplicação

Abra o navegador em: [http://localhost:4200](http://localhost:4200)

### 3. Fazer Login

Use credenciais de um usuário com permissão de aprovação:
- Usuário com `ind_aprova_negociacao = 'S'`

### 4. Navegar para Aprovação de Negociações

- Tela Home → "Aprovação de Negociações"
- URL: [http://localhost:4200/home/aprovacao-negociacao](http://localhost:4200/home/aprovacao-negociacao)

### 5. Reprovar uma Negociação

1. **Identifique um card de negociação pendente**
   - Status: "Em Processamento" ou "Concluído"
   - Progresso: deve estar completo

2. **Clique no botão "Reprovar"** (vermelho, com ícone de X)

3. **Confirme a ação** no alerta que aparecer

4. **Aguarde o processamento**
   - Aparecerá "Reprovando Negociação..."
   - Toast de sucesso: "Negociação Reprovada com Sucesso."

5. **Verifique o resultado**
   - O card deve DESAPARECER da lista
   - A contagem de negociações pendentes deve diminuir

### 6. Verificar no Console do Backend

Você verá logs como:

```
POST /drfPriceSwap/reprovaRegra
{ schema: 'nome_do_schema', seq_lote: 123 }
```

### 7. Verificar no Banco de Dados

Conecte no PostgreSQL e execute:

```sql
-- Verificar registros reprovados
SELECT seq_lote_alteracao, ind_status, dta_inclusao
FROM schema.tab_nova_regra
WHERE ind_status = 'X'
ORDER BY dta_inclusao DESC;

-- Verificar progresso do lote
SELECT seq_lote, error, progresso, total
FROM schema.tab_progresso_lote
WHERE error = 'Reprovado';
```

---

## 📊 Endpoints do Backend

### POST /drfPriceSwap/reprovaRegra

**Request Body:**
```json
{
  "schema": "nome_do_schema",
  "seq_lote": 123
}
```

**Response Success (200):**
```json
{
  "message": "Negociação Reprovada com Sucesso."
}
```

**Response Error (500):**
```json
{
  "message": "Falha em reprovar negociação: [erro detalhado]"
}
```

### POST /drfPriceSwap/buscaNegociacoesEmpresa

**Request Body:**
```json
{
  "schema": "nome_do_schema",
  "cod_empresa": [1, 2, 3]
}
```

**Response Success (200):**
```json
{
  "message": [
    {
      "seq_lote_alteracao": 123,
      "nom_fantasia": "Empresa Teste",
      "cod_empresa": 1,
      "ind_excluido": "N",
      "total_registros": 50,
      "progresso": 50,
      "total": 50,
      "error": null,
      "des_observacao": "Lote 001",
      "dta_inclusao": "2026-01-29T10:30:00"
    }
  ]
}
```

---

## 🐛 Solução de Problemas

### Problema 1: Backend não inicia

**Sintomas:** Erro ao executar `npm run dev`

**Soluções:**
1. Verificar se o Node.js está instalado: `node --version`
2. Reinstalar dependências: `npm install`
3. Verificar arquivo `.env`
4. Verificar se a porta 3000 está disponível: `netstat -ano | findstr :3000`

### Problema 2: Erro de conexão com banco de dados

**Sintomas:** "connection refused" ou "authentication failed"

**Soluções:**
1. Verificar se o PostgreSQL está rodando
2. Conferir credenciais no arquivo `.env`
3. Testar conexão: `psql -h localhost -U usuario -d banco`

### Problema 3: Card não desaparece após reprovar

**Sintomas:** Card continua visível na lista

**Soluções:**
1. Verificar logs do backend para confirmar execução do UPDATE
2. Verificar no banco se `ind_status = 'X'` foi setado
3. Forçar atualização da lista clicando no botão de refresh
4. Verificar se o WebSocket está conectado (console do navegador)

### Problema 4: Proxy não funciona

**Sintomas:** Erro 404 ou CORS ao chamar API

**Soluções:**
1. Verificar se o proxy está configurado em `proxy.conf.js`
2. Reiniciar o frontend: `Ctrl+C` e `npm start` novamente
3. Verificar se o backend está rodando em `localhost:3000`
4. Verificar logs do proxy no terminal do frontend

### Problema 5: Permissão negada

**Sintomas:** Botão "Reprovar" não aparece

**Soluções:**
1. Verificar se o usuário tem `ind_aprova_negociacao = 'S'`
2. Fazer logout e login novamente
3. Verificar permissões no banco de dados

---

## 📝 Estrutura de Arquivos

```
backend/
├── server.js                    # Servidor principal
├── package.json                 # Dependências
├── .env                        # Variáveis de ambiente
├── src/
│   ├── app.js                  # Configuração Express
│   ├── config/
│   │   └── database.js         # Conexão PostgreSQL
│   ├── routes/
│   │   ├── index.js            # Rota raiz
│   │   └── drfPriceSwap.js     # Rotas da API
│   └── controllers/
│       └── drfPriceSwap.js     # Lógica de negócio
```

---

## 🔐 Segurança

- ✅ Autenticação via JWT
- ✅ Validação de schema por usuário
- ✅ CORS configurado para origens permitidas
- ✅ Transações SQL (BEGIN/COMMIT/ROLLBACK)
- ✅ Prepared statements para prevenir SQL injection

---

## 📞 Próximos Passos

Após testar localmente e confirmar que tudo funciona:

1. **Commit das alterações**
   ```bash
   git add .
   git commit -m "Fix: Corrige query de aprovação para excluir reprovadas (ind_status != 'X')"
   ```

2. **Fazer deploy do backend**
   - Atualizar backend em: `https://variedades.digitalrf.com.br:443`
   - Verificar variáveis de ambiente no servidor
   - Reiniciar serviço

3. **Fazer build do frontend**
   ```bash
   npm run ionic:build:prod
   ```

4. **Fazer deploy do frontend**
   - Fazer upload dos arquivos de build para o servidor
   - Ou fazer deploy no Firebase: `firebase deploy`

5. **Testar em produção**
   - Verificar se o botão "Reprovar" funciona corretamente
   - Confirmar que cards reprovados desaparecem
   - Validar com usuários reais

---

## 📚 Documentação Relacionada

- [BOTAO_ATUALIZAR_FLUXO.md](BOTAO_ATUALIZAR_FLUXO.md) - Documentação do botão "Atualizar Dados"
- [ANALISE_SINCRONIZACAO.md](ANALISE_SINCRONIZACAO.md) - Análise do problema de sincronização
- [GUIA_TESTE_SINCRONIZACAO.md](GUIA_TESTE_SINCRONIZACAO.md) - Guia de teste da sincronização

---

**Criado em:** 2026-01-29
**Sistema:** TrocaPreço v1.0.12
**Arquivo:** GUIA_BACKEND_LOCAL.md
