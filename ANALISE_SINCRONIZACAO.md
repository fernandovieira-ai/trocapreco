# 🔍 Análise do Problema de Sincronização

**Data:** 2026-01-29
**Sistema:** TrocaPreço v1.0.12
**Problema:** Procedure `sp_atualiza_cadastro` não está atualizando dados de pessoa

---

## 📋 Resumo do Problema

O usuário relata que ao clicar no botão "Atualizar Dados", a procedure PostgreSQL `zmaisz.sp_atualiza_cadastro` está sendo chamada de forma incorreta e **não está atualizando os dados de pessoa (pessoa/cliente)**.

---

## ✅ O Que Está CORRETO no Frontend

### 1. Requisição HTTP

**Arquivo:** `src/app/services/movimento.service.ts:523`

```typescript
sincronizaCadastros(
  schema_base,
  param1 = 1,
  param2 = "S",
  param3 = 0,
  param4 = "R",
): Observable<any> {
  const token = window.localStorage.getItem("token");
  const body = { schema_base, param1, param2, param3, param4 };

  console.log(
    "MovimentoService.sincronizaCadastros - Enviando para backend:",
    body,
  );
  console.log("URL:", `${this.baseURL}/sincronizaCadastros`);

  return (
    this.httpClient
      .post<any>(`${this.baseURL}/sincronizaCadastros`, body)
      .pipe(
        take(1),
        catchError((err) => {
          console.error("Erro na requisição sincronizaCadastros:", err);
          throw err;
        }),
      )
  );
}
```

### 2. Busca Dinâmica do Código da Empresa

**Arquivo:** `src/app/home/home.page.ts:335`

```typescript
executarSincronizacao() {
  this.isSyncInProgress = true;
  const schema = this.auth.userLogado.schema;

  // Busca o código da empresa dinamicamente
  let codEmpresa: number;

  if (this.empresas && this.empresas.length > 0) {
    // Opção 1: Busca da primeira empresa na tab_base
    codEmpresa = this.empresas[0].cod_empresa;
    console.log("Usando código da primeira empresa da tab_base:", codEmpresa);
  } else if (this.auth.userLogado.empresa && this.auth.userLogado.empresa.length > 0) {
    // Opção 2: Usa empresa do usuário logado
    codEmpresa = this.auth.userLogado.empresa[0];
    console.log("Usando código da empresa do usuário logado:", codEmpresa);
  } else {
    // Opção 3: Erro - nenhuma empresa encontrada
    this.isSyncInProgress = false;
    this.alert.presentToast("Erro: Nenhuma empresa encontrada para sincronização", 3000);
    return;
  }

  console.log("Iniciando sincronização com schema:", schema);
  console.log("Parâmetros da procedure:", {
    schema_base: schema,
    param1: codEmpresa,
    param2: "S",
    param3: 0,
    param4: "R",
  });

  this.movimento
    .sincronizaCadastros(schema, codEmpresa, "S", 0, "R")
    .pipe(timeout(560000), finalize(() => { this.isSyncInProgress = false; }))
    .subscribe({
      next: (data) => {
        console.log("Sincronização concluída - Resposta do servidor:", data);
      },
      error: (err) => {
        console.error("Erro na sincronização:", err);
        this.handleErrorSincronizacao(err);
      },
      complete: () => {
        this.alert.presentToast("Dados sincronizados com sucesso!", 2000);
        setTimeout(() => { this.atualizarDadosAposSincronizacao(); }, 1000);
      },
    });
}
```

### 3. Dados Enviados ao Backend

```json
{
  "schema_base": "nome_do_schema",
  "param1": 1,
  "param2": "S",
  "param3": 0,
  "param4": "R"
}
```

**Endpoint:** `POST https://variedades.digitalrf.com.br:443/drfPriceSwap/sincronizaCadastros`

**Headers:**
```
Content-Type: application/json
Authorization: <token_jwt>
```

---

## ❌ O Que Pode Estar ERRADO no Backend

### Possíveis Problemas

#### 1. **Backend Não Está Usando o Schema Correto**

O backend precisa setar o search_path do PostgreSQL antes de executar a procedure:

```sql
-- CORRETO ✅
SET search_path TO nome_do_schema, public;
SELECT zmaisz.sp_atualiza_cadastro(1, 'S', 0, 'R');
```

```sql
-- INCORRETO ❌ (vai executar no schema errado)
SELECT zmaisz.sp_atualiza_cadastro(1, 'S', 0, 'R');
```

#### 2. **Backend Não Está Passando os Parâmetros Corretamente**

```javascript
// CORRETO ✅
const { schema_base, param1, param2, param3, param4 } = req.body;

await db.query(`SET search_path TO ${schema_base}, public`);
await db.query(`SELECT zmaisz.sp_atualiza_cadastro($1, $2, $3, $4)`,
  [param1, param2, param3, param4]
);
```

```javascript
// INCORRETO ❌ (parâmetros fixos ou na ordem errada)
await db.query(`SELECT zmaisz.sp_atualiza_cadastro(1, 'S', 0, 'R')`);
```

#### 3. **Backend Está Usando Valores Fixos ao Invés dos Recebidos**

```javascript
// INCORRETO ❌
const codEmpresa = 1; // Sempre fixo
await db.query(`SELECT zmaisz.sp_atualiza_cadastro(${codEmpresa}, 'S', 0, 'R')`);
```

```javascript
// CORRETO ✅
const codEmpresa = req.body.param1; // Dinâmico do request
await db.query(`SELECT zmaisz.sp_atualiza_cadastro($1, 'S', 0, 'R')`, [codEmpresa]);
```

#### 4. **Procedure Está Recebendo Parâmetros mas Não Está Executando**

A stored procedure `zmaisz.sp_atualiza_cadastro` pode ter problemas internos:

- Não está commitando as transações
- Tem alguma condição que impede a atualização dos dados de pessoa
- Está executando mas retornando antes de processar tudo

---

## 🎯 O Que o Backend DEVE Fazer

### Fluxo Correto no Endpoint `/sincronizaCadastros`

```javascript
// Exemplo em Node.js/Express
app.post('/sincronizaCadastros', async (req, res) => {
  try {
    const { schema_base, param1, param2, param3, param4 } = req.body;

    console.log('===== INÍCIO SINCRONIZAÇÃO =====');
    console.log('Schema recebido:', schema_base);
    console.log('Parâmetros recebidos:', { param1, param2, param3, param4 });

    // 1. Validar parâmetros
    if (!schema_base || !param1) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: 'schema_base e param1 são obrigatórios'
      });
    }

    // 2. Setar o schema correto no PostgreSQL
    await db.query(`SET search_path TO ${schema_base}, public`);
    console.log('Search path setado para:', schema_base);

    // 3. Executar a procedure com os parâmetros recebidos
    console.log('Executando procedure...');
    const result = await db.query(
      `SELECT zmaisz.sp_atualiza_cadastro($1, $2, $3, $4)`,
      [param1, param2, param3, param4]
    );

    console.log('Procedure executada com sucesso');
    console.log('Resultado:', result.rows);

    // 4. Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      registros_atualizados: result.rows[0]?.sp_atualiza_cadastro || 0
    });

  } catch (error) {
    console.error('===== ERRO NA SINCRONIZAÇÃO =====');
    console.error('Erro completo:', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Erro ao sincronizar dados',
      message: error.message
    });
  }
});
```

---

## 🔍 Como Verificar o Problema

### 1. Verificar Logs do Console no Frontend

Ao clicar em "Atualizar Dados", deve aparecer:

```
Usando código da primeira empresa da tab_base: 1
Iniciando sincronização com schema: nome_do_schema
Parâmetros da procedure: {schema_base: "nome_do_schema", param1: 1, param2: "S", param3: 0, param4: "R"}
MovimentoService.sincronizaCadastros - Enviando para backend: {schema_base: "nome_do_schema", param1: 1, param2: "S", param3: 0, param4: "R"}
URL: https://variedades.digitalrf.com.br:443/drfPriceSwap/sincronizaCadastros
Sincronização concluída - Resposta do servidor: {...}
```

### 2. Verificar no Network do DevTools

Abrir **DevTools → Network → XHR/Fetch**

Procurar requisição para `/sincronizaCadastros`

**Request:**
```json
{
  "schema_base": "nome_do_schema",
  "param1": 1,
  "param2": "S",
  "param3": 0,
  "param4": "R"
}
```

**Response esperada:**
```json
{
  "success": true,
  "message": "Sincronização concluída com sucesso",
  "registros_atualizados": 123
}
```

### 3. Verificar Logs do Backend

O backend deve logar:

```
===== INÍCIO SINCRONIZAÇÃO =====
Schema recebido: nome_do_schema
Parâmetros recebidos: { param1: 1, param2: 'S', param3: 0, param4: 'R' }
Search path setado para: nome_do_schema
Executando procedure...
Procedure executada com sucesso
Resultado: [...]
```

### 4. Verificar no PostgreSQL

Conectar no banco de dados e executar manualmente:

```sql
-- Setar o schema correto
SET search_path TO nome_do_schema, public;

-- Executar a procedure manualmente
SELECT zmaisz.sp_atualiza_cadastro(1, 'S', 0, 'R');

-- Verificar se os dados de pessoa foram atualizados
SELECT COUNT(*) FROM pessoa;
SELECT * FROM pessoa ORDER BY data_atualizacao DESC LIMIT 10;
```

---

## 🛠️ Possíveis Soluções

### Se o problema for no schema:

```javascript
// Adicionar escape de SQL injection
const schema = req.body.schema_base.replace(/[^a-zA-Z0-9_]/g, '');
await db.query(`SET search_path TO "${schema}", public`);
```

### Se o problema for nos parâmetros:

```javascript
// Garantir tipos corretos
const param1 = parseInt(req.body.param1);
const param2 = String(req.body.param2);
const param3 = parseInt(req.body.param3);
const param4 = String(req.body.param4);
```

### Se o problema for na procedure:

```sql
-- Verificar se a procedure existe
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'sp_atualiza_cadastro'
AND pronamespace = 'zmaisz'::regnamespace;

-- Ver o código da procedure
\df+ zmaisz.sp_atualiza_cadastro
```

---

## 📞 Próximos Passos

1. **Testar a requisição no frontend** - Verificar logs do console
2. **Verificar Request/Response** - Analisar no Network do DevTools
3. **Acessar logs do backend** - Ver se os parâmetros estão chegando corretos
4. **Testar procedure manualmente** - Executar SQL direto no banco
5. **Corrigir o backend** - Ajustar código conforme problemas encontrados

---

## 📝 Informações Adicionais

**Frontend Envia:**
- `schema_base`: Schema do banco de dados (ex: "digitalrf_schema")
- `param1`: Código da empresa (ex: 1)
- `param2`: Tipo de operação (sempre "S" - Sincronizar)
- `param3`: Parâmetro adicional (sempre 0)
- `param4`: Tipo de registro (sempre "R" - Registro)

**Backend Deve Executar:**
```sql
SET search_path TO <schema_base>, public;
SELECT zmaisz.sp_atualiza_cadastro(<param1>, <param2>, <param3>, <param4>);
```

**Resultado Esperado:**
- Dados de pessoa (clientes) devem ser atualizados
- Dados de produtos devem ser atualizados
- Preços devem ser atualizados
- Formas de pagamento devem ser atualizadas

---

**Atualizado em:** 2026-01-29
**Por:** Claude Code
**Arquivo:** ANALISE_SINCRONIZACAO.md
