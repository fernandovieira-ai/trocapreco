# 🔄 Documentação do Botão "Atualizar Dados"

## 📍 Localização
**Arquivo:** `src/app/home/home.page.html` (linhas 17-39)
**Visível apenas para:** Usuário com `cod_usuario === 466` (Admin)

---

## 🎯 Função Principal
Sincronizar cadastros e preços do sistema EMSys3 com o banco de dados local da aplicação.

---

## 🔄 Fluxo de Execução Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣  CLIQUE NO BOTÃO "ATUALIZAR DADOS"                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2️⃣  atualizaRegistro() - home.page.ts:329                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Mostra alerta de confirmação profissional           │ │
│  │ • Título: "Sincronização de Dados"                     │ │
│  │ • Aviso: Processo pode levar vários minutos           │ │
│  │ • Informa: Usuário será desconectado ao finalizar     │ │
│  │ • Botões: "Cancelar" ou "Iniciar Sincronização"       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3️⃣  executarSincronizacao() - home.page.ts:345             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • isSyncInProgress = true (botão fica desabilitado)   │ │
│  │ • Ícone muda para rotativo (spinning)                  │ │
│  │ • Texto muda para "Sincronizando..."                   │ │
│  │ • Mostra spinner no botão                              │ │
│  │ • Abre loading: "Iniciando sincronização de dados..."  │ │
│  │ • Timeout definido: 550 segundos (9min 10s)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4️⃣  movimento.sincronizaCadastros() - movimento.service.ts:424│
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📡 REQUISIÇÃO HTTP POST                                │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ Endpoint: /sincronizaCadastros                     │ │ │
│  │ │ Método: POST                                        │ │ │
│  │ │ Body: { schema_base }                              │ │ │
│  │ │ Headers: Authorization: Bearer Token               │ │ │
│  │ │ Timeout: 560 segundos (9min 20s)                   │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5️⃣  BACKEND PROCESSA A SINCRONIZAÇÃO                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ O servidor backend realiza:                            │ │
│  │ • Conecta com sistema EMSys3                           │ │
│  │ • Baixa cadastros atualizados (clientes, produtos)     │ │
│  │ • Baixa tabelas de preços atualizadas                  │ │
│  │ • Sincroniza formas de pagamento                       │ │
│  │ • Atualiza custos e margens                            │ │
│  │ • Sincroniza regiões e grupos de clientes             │ │
│  │                                                        │ │
│  │ ⏱️  PODE LEVAR ATÉ 9 MINUTOS                           │ │
│  │ (depende do volume de dados a sincronizar)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6️⃣  RESPOSTA DO SERVIDOR                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟢 SUCESSO:                                             │ │
│  │ {                                                      │ │
│  │   message: "X registros baixados com sucesso",        │ │
│  │   registros_baixados: 1234,                           │ │
│  │   detalhe: "Clientes, produtos e preços atualizados"  │ │
│  │ }                                                      │ │
│  │                                                        │ │
│  │ 🟡 SEM ALTERAÇÕES:                                      │ │
│  │ {                                                      │ │
│  │   message: "Nenhuma alteração encontrada"             │ │
│  │ }                                                      │ │
│  │                                                        │ │
│  │ 🔴 ERRO:                                                │ │
│  │ • TimeoutError: Tempo esgotado                         │ │
│  │ • Status 500: Erro no servidor                         │ │
│  │ • Status 0/404: Sem conexão                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  7️⃣  mostrarResultadoSincronizacao() - home.page.ts:375     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Analisa resposta do servidor                         │ │
│  │ • Formata mensagem adequada                            │ │
│  │ • Mostra Toast com resultado                           │ │
│  │ • Adiciona ícones: ✅ sucesso / ⚠️ aviso / ❌ erro      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  8️⃣  FINALIZAÇÃO                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • isSyncInProgress = false (botão volta ao normal)    │ │
│  │ • Fecha loading após 500ms                             │ │
│  │ • Aguarda 2 segundos                                   │ │
│  │ • Executa logout() automaticamente                     │ │
│  │ • Usuário é redirecionado para tela de login          │ │
│  │ • Próximo login terá dados atualizados                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Estados Visuais do Botão

### 🟢 Estado Normal (Pronto)
```html
[✓] Botão habilitado
[✓] Cor: Verde gradiente (#059669 → #10b981)
[✓] Ícone: cloud-download-outline
[✓] Texto: "Atualizar Dados"
[✓] Efeito hover: Brilho animado
```

### 🔄 Estado Sincronizando (Em Progresso)
```html
[✓] Botão desabilitado
[✓] Cor: Cinza gradiente (#6b7280 → #9ca3af)
[✓] Ícone: sync-outline (rotativo ♻️)
[✓] Texto: "Sincronizando..."
[✓] Spinner adicional ao lado direito
[✓] Cursor: not-allowed
```

---

## ⚙️ Configurações Técnicas

### Timeouts Configurados
| Local | Timeout | Propósito |
|-------|---------|-----------|
| HTTP Request | 560 segundos | Tempo máximo de resposta do servidor |
| Toast Resultado | 3 segundos | Exibição da mensagem de resultado |
| Atualização Dados | 1 segundo | Aguarda antes de recarregar dados |

### Endpoint de API
```typescript
URL: ${environment.endPoint}/sincronizaCadastros
Método: POST
Headers: {
  'Content-Type': 'application/json',
  'Authorization': token
}
Body: {
  schema_base: string,  // Schema do banco de dados do cliente
  param1: number,       // Código da empresa (buscado da tab_base)
  param2: string,       // 'S' - Sincronizar
  param3: number,       // 0
  param4: string        // 'R' - Registro
}
```

### 🔍 Busca Dinâmica do Código da Empresa

O código da empresa (param1) é buscado dinamicamente seguindo esta lógica:

**1. Primeira Opção**: Busca da primeira empresa no array `this.empresas`
- Array populado pelo método `buscaEmpresasBase()` no `ngOnInit`
- Retorna empresas da `tab_base` filtradas pelo schema do usuário
- Usa `empresas[0].cod_empresa`

**2. Segunda Opção**: Se não houver empresas, usa `auth.userLogado.empresa`
- Código da empresa principal do usuário logado

**3. Fallback**: Se nenhuma opção estiver disponível
- Exibe toast: "Erro: Nenhuma empresa encontrada para sincronização"
- Cancela a sincronização

### 🎯 Procedure Executada no Backend

```sql
SELECT zmaisz.sp_atualiza_cadastro(
  cod_empresa,  -- Código da empresa buscado da tab_base
  'S',          -- Sincronizar
  0,            -- Parâmetro 3
  'R'           -- Registro
)
```

O backend recebe os parâmetros e executa a stored procedure com o schema correto.

---

## 🚨 Tratamento de Erros

### TimeoutError (Tempo Esgotado)
```
⏱️ Tempo Esgotado
Tempo de sincronização excedido.
Verifique sua conexão e tente novamente.
```

### Erro 500 (Servidor)
```
❌ Erro na Sincronização
Erro no servidor.
Tente novamente mais tarde.
```

### Erro 0/404 (Sem Conexão)
```
🌐 Sem Conexão
Não foi possível conectar ao servidor.
Verifique sua conexão com a internet.
```

### Erro Genérico
```
❌ Erro na Sincronização
Ocorreu um erro durante a sincronização.
[Mensagem específica do erro]
```

---

## 💾 Dados Sincronizados

A operação sincroniza as seguintes informações do EMSys3:

1. **👥 Cadastro de Clientes**
   - Códigos e nomes
   - Documentos (CPF/CNPJ)
   - Endereços e contatos
   - Status de crédito

2. **📦 Cadastro de Produtos**
   - Códigos e descrições
   - Combustíveis disponíveis
   - Categorias e grupos
   - Status (ativo/inativo)

3. **💰 Tabelas de Preços**
   - Preços A, B, C, D, E
   - Preços por forma de pagamento
   - Custos médios
   - Margens de lucro

4. **💳 Formas de Pagamento**
   - Tipos de pagamento
   - Condições especiais
   - Descontos/acréscimos

5. **🗺️ Regiões e Grupos**
   - Regiões de atendimento
   - Grupos de clientes
   - Subgrupos

6. **📊 Dados de Negociação**
   - Regras ativas
   - Histórico de alterações
   - Status de aprovação

---

## 🔒 Segurança

- ✅ Apenas usuário admin (cod_usuario 466) tem acesso
- ✅ Token JWT validado em cada requisição
- ✅ Conexão HTTPS obrigatória
- ✅ Schema isolado por cliente (multi-tenancy)
- ✅ Logout automático após sincronização (limpa sessão)

---

## 🎨 Animações e Efeitos

### Efeito de Brilho no Hover
```scss
// Barra de luz que atravessa o botão
&::before {
  content: '';
  position: absolute;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}
```

### Rotação do Ícone
```scss
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.spinning {
  animation: spin 1s linear infinite;
}
```

---

## 📱 Responsividade

### Mobile (< 480px)
- Altura: 30px
- Font-size: 11px
- **Texto oculto** (apenas ícones)
- Padding reduzido

### Tablet (480-768px)
- Altura: 32px
- Font-size: 12px
- Texto visível
- Ícones menores

### Desktop (> 768px)
- Altura: 36px
- Font-size: 13px
- Layout completo
- Efeitos completos

---

## ⚡ Otimizações Implementadas

1. **Estado de Loading Global**
   - Variável `isSyncInProgress` controla estado
   - Previne múltiplos cliques
   - Feedback visual imediato

2. **Finalize Operator**
   - Garante reset do estado mesmo com erro
   - Fecha loading em qualquer cenário
   - Limpa recursos corretamente

3. **Timeout Apropriado**
   - 9+ minutos para operações pesadas
   - Maior que loading (evita conflito)
   - Mensagem clara se esgotar

4. **Feedback Visual Rico**
   - Ícone rotativo
   - Texto dinâmico
   - Spinner adicional
   - Toast informativo

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: "Botão não responde"
**Causa:** Sincronização ainda em andamento
**Solução:** Aguardar conclusão ou timeout

### Problema: "Timeout frequente"
**Causa:** Volume muito grande de dados
**Solução:** Backend pode precisar otimização

### Problema: "Usuário não deslogado"
**Causa:** Erro antes do complete()
**Solução:** Verificar logs de erro

---

## 📞 Suporte

Para questões sobre o botão "Atualizar Dados":
- **Frontend:** Verificar logs do console do navegador
- **Backend:** Verificar endpoint `/sincronizaCadastros`
- **Rede:** Verificar firewall na porta configurada

---

## 📝 Changelog

### Versão Atual (Modernizada)
- ✅ Substituído ion-chip por ion-button
- ✅ Adicionado indicador visual de progresso
- ✅ Melhorado feedback durante sincronização
- ✅ Implementado sistema de estados
- ✅ Adicionado ícone rotativo animado
- ✅ Otimizado para mobile

### Versão Anterior
- ❌ Chip simples sem feedback visual
- ❌ Sem indicação de progresso
- ❌ Sem prevenção de múltiplos cliques

---

## 🔗 Documentos Relacionados

- **ANALISE_SINCRONIZACAO.md** - Análise detalhada do problema de sincronização e como o backend deve processar
- **GUIA_TESTE_SINCRONIZACAO.md** - Guia passo a passo para testar e identificar problemas

---

**Gerado em:** 2026-01-29
**Atualizado em:** 2026-01-29 (adicionados logs detalhados)
**Sistema:** TrocaPreço v1.0.12
**Cliente:** Digital RF
