# 🧪 Guia de Teste - Sincronização de Dados

**Sistema:** TrocaPreço v1.0.12
**Data:** 2026-01-29

---

## 📋 Como Testar a Sincronização

### 1️⃣ Abrir o Console do Navegador

**No Chrome/Edge:**
- Pressione `F12` ou `Ctrl + Shift + I`
- Clique na aba **Console**

**No Firefox:**
- Pressione `F12` ou `Ctrl + Shift + K`
- Clique na aba **Console**

---

### 2️⃣ Acessar a Aplicação

1. Faça login com o usuário **cod_usuario 466** (Admin)
2. Aguarde carregar a tela principal (Home)
3. **NÃO CLIQUE NO BOTÃO AINDA!**

---

### 3️⃣ Limpar o Console

1. No console, clique no botão **Clear console** (ícone 🚫)
2. Ou pressione `Ctrl + L`

Isso garante que você verá apenas os logs da sincronização.

---

### 4️⃣ Clicar no Botão "Atualizar Dados"

1. Clique no botão verde **"Atualizar Dados"**
2. O botão ficará cinza com texto **"Sincronizando..."**
3. Aguarde a conclusão (pode levar até 9 minutos)

---

### 5️⃣ Verificar os Logs no Console

Você verá uma sequência de logs detalhados. Copie **TODOS** os logs e envie para análise.

#### Logs Esperados:

```
===== INÍCIO SINCRONIZAÇÃO FRONTEND =====
Timestamp: 2026-01-29T...
Dados disponíveis para busca de empresa:
  - this.empresas.length: 10
  - auth.userLogado.empresa.length: 1
✓ Usando código da primeira empresa da tab_base: 1
  Empresa completa: {cod_empresa: 1, nom_fantasia: "...", ...}
---
Schema a ser usado: digitalrf_schema
Código da empresa (param1): 1
---
Parâmetros completos da procedure:
  schema_base: digitalrf_schema
  param1: 1 (cod_empresa)
  param2: S (Sincronizar)
  param3: 0
  param4: R (Registro)
---
SQL esperado no backend:
  SET search_path TO digitalrf_schema, public;
  SELECT zmaisz.sp_atualiza_cadastro(1, 'S', 0, 'R');
===== CHAMANDO SERVIÇO =====

===== MovimentoService.sincronizaCadastros =====
URL completa: https://variedades.digitalrf.com.br:443/drfPriceSwap/sincronizaCadastros
Método: POST
---
Body enviado:
{
  "schema_base": "digitalrf_schema",
  "param1": 1,
  "param2": "S",
  "param3": 0,
  "param4": "R"
}
---
Headers:
  Content-Type: application/json
  Authorization: Token presente ✓
---
Tipos dos parâmetros:
  schema_base: string = digitalrf_schema
  param1: number = 1
  param2: string = S
  param3: number = 0
  param4: string = R
===== Enviando requisição HTTP =====

[Aguardando resposta do servidor...]

===== RESPOSTA DO SERVIDOR RECEBIDA =====
Tipo de resposta: object
Resposta completa: {
  "success": true,
  "message": "Sincronização concluída com sucesso",
  "registros_atualizados": 123
}

===== SINCRONIZAÇÃO CONCLUÍDA =====
Observable completado com sucesso
```

---

### 6️⃣ Verificar a Aba Network (Rede)

1. No DevTools, clique na aba **Network** (Rede)
2. Certifique-se que está gravando (botão vermelho ●)
3. Clique no botão **"Atualizar Dados"** novamente
4. Procure pela requisição **sincronizaCadastros**
5. Clique nela para ver os detalhes

#### O Que Verificar:

**Headers (Cabeçalhos):**
- Request URL: `https://variedades.digitalrf.com.br:443/drfPriceSwap/sincronizaCadastros`
- Request Method: `POST`
- Status Code: `200 OK` (se tudo correu bem)
- Content-Type: `application/json`

**Payload (Dados Enviados):**
```json
{
  "schema_base": "nome_do_schema",
  "param1": 1,
  "param2": "S",
  "param3": 0,
  "param4": "R"
}
```

**Response (Resposta):**
- Ver o que o servidor retornou
- Copiar a resposta completa

---

### 7️⃣ Tirar Screenshots

Tire screenshots de:

1. **Console** com todos os logs
2. **Network → Headers** da requisição sincronizaCadastros
3. **Network → Payload** (dados enviados)
4. **Network → Response** (resposta do servidor)

---

## 🔍 O Que Procurar nos Logs

### ✅ Sinais de Sucesso

- ✓ Empresa encontrada e código capturado
- ✓ Token presente nos headers
- ✓ Body enviado com todos os parâmetros corretos
- ✓ Tipos dos parâmetros corretos (number, string)
- ✓ Status HTTP 200
- ✓ Resposta do servidor com `success: true`
- ✓ Observable completado

### ❌ Sinais de Problema

- ✗ Nenhuma empresa encontrada
- ✗ Token ausente
- ✗ Erro HTTP (500, 404, 0)
- ✗ Timeout após 560 segundos
- ✗ Resposta com `success: false`
- ✗ Erro no console antes de completar

---

## 📊 Possíveis Cenários

### Cenário 1: Frontend OK, Backend Recebe Correto

**Logs mostram:**
- ✓ Parâmetros enviados corretamente
- ✓ Status 200
- ✓ Resposta positiva do servidor

**Problema:** Backend não está executando a procedure corretamente

**Solução:** Verificar código do backend no endpoint `/sincronizaCadastros`

---

### Cenário 2: Frontend OK, Backend Retorna Erro

**Logs mostram:**
- ✓ Parâmetros enviados corretamente
- ✗ Status 500 ou erro
- ✗ Mensagem de erro na resposta

**Problema:** Backend teve erro ao processar

**Solução:** Verificar logs do servidor backend

---

### Cenário 3: Timeout

**Logs mostram:**
- ✓ Parâmetros enviados corretamente
- ✗ TimeoutError após 560 segundos
- ✗ Nenhuma resposta do servidor

**Problema:** Backend está demorando muito ou travou

**Solução:** Verificar performance da procedure no banco de dados

---

### Cenário 4: Erro de Conexão

**Logs mostram:**
- ✓ Parâmetros enviados corretamente
- ✗ Status 0 ou 404
- ✗ Erro de rede

**Problema:** Não consegue conectar ao servidor

**Solução:** Verificar firewall, VPN, ou disponibilidade do servidor

---

## 🗂️ Arquivos Criados para Análise

1. **ANALISE_SINCRONIZACAO.md**
   - Análise completa do problema
   - Código esperado no backend
   - Possíveis causas do erro

2. **GUIA_TESTE_SINCRONIZACAO.md** (este arquivo)
   - Passo a passo para testar
   - Como interpretar os logs
   - Screenshots a tirar

3. **BOTAO_ATUALIZAR_FLUXO.md**
   - Documentação completa do botão
   - Fluxo de execução
   - Configurações técnicas

---

## 📞 Próximos Passos

Após seguir este guia:

1. **Copiar TODOS os logs do console**
2. **Tirar screenshots da aba Network**
3. **Enviar para análise**
4. **Se possível, acessar logs do backend** (variedades.digitalrf.com.br)
5. **Se possível, testar procedure direto no PostgreSQL**

---

## 💡 Dica

Para facilitar, você pode:

1. Clicar com botão direito no console
2. Selecionar **"Save as..."** (Salvar como...)
3. Salvar o log completo em um arquivo `.log`

Ou simplesmente:

1. Selecionar todos os logs (`Ctrl + A`)
2. Copiar (`Ctrl + C`)
3. Colar em um arquivo de texto

---

**Criado em:** 2026-01-29
**Sistema:** TrocaPreço v1.0.12
**Arquivo:** GUIA_TESTE_SINCRONIZACAO.md
