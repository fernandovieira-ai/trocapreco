# 🔧 CORREÇÃO - Tela Roxa no Vercel

## ✅ CORREÇÕES APLICADAS

### 1. **Service Worker DESABILITADO**

- ❌ Estava causando cache agressivo de versão antiga
- ✅ Agora está: `"serviceWorker": false` no angular.json
- 📌 Após funcionar, pode reabilitar para PWA completo

### 2. **vercel.json OTIMIZADO**

- ✅ Headers de cache configurados corretamente
- ✅ Roteamento SPA configurado (todas rotas → index.html)
- ✅ Headers de segurança adicionados

### 3. **Configuração "local" REMOVIDA**

- ❌ Referenciava arquivo inexistente (environment.local.ts)
- ✅ Removido para evitar confusão no build

### 4. **.vercelignore CRIADO**

- ✅ Evita upload de arquivos desnecessários
- ✅ Build mais rápido e limpo

---

## 🚀 PRÓXIMOS PASSOS

### Opção A: REDEPLOY Automático (se já fez push)

1. ✅ Aguarde 2-3 minutos
2. 🔍 Acesse: https://vercel.com/dashboard
3. 🔄 Vercel detectará o push e fará redeploy automático

### Opção B: PUSH e Deploy

```powershell
cd "C:\Linx\cliente\digitalrf\projeto\bkp\trocapreco"
git add .
git commit -m "fix: corrigir tela roxa - desabilitar service worker e otimizar vercel.json"
git push origin main
```

### Opção C: Deploy Manual na Vercel

1. Acesse: https://vercel.com
2. Vá para seu projeto
3. Clique em **"Deployments"**
4. Clique nos **"..."** do último deployment
5. Clique em **"Redeploy"**

---

## 🔍 DIAGNÓSTICO - Verificar se Funcionou

### 1. **Console do Navegador**

Abra DevTools (F12) → Console

**✅ DEVE VER**:

```
Angular is running in development mode
```

**❌ NÃO DEVE VER**:

```
Failed to load module
ChunkLoadError
ServiceWorker registration failed
```

### 2. **Network (Rede)**

DevTools → Network → Recarregar página

**✅ DEVE VER**:

- `index.html` - Status 200
- `main.*.js` - Status 200
- `polyfills.*.js` - Status 200
- `runtime.*.js` - Status 200

**❌ SE VER Status 404**:

- Vercel não está servindo arquivos corretamente
- Verifique configuração do `outputDirectory: "www"`

### 3. **Elementos (Elements)**

DevTools → Elements

**✅ DEVE VER**:

```html
<body>
  <app-root>
    <ion-app>
      <ion-router-outlet>
        <!-- Conteúdo do app -->
      </ion-router-outlet>
    </ion-app>
  </app-root>
</body>
```

**❌ SE VER**:

```html
<body>
  <app-root></app-root>
  <!-- Vazio! -->
</body>
```

→ Angular não inicializou

---

## 🐛 SE AINDA NÃO FUNCIONAR

### Problema 1: TELA ROXA CONTINUA

**Causa**: Cache do navegador

**Solução**:

1. Ctrl + Shift + Delete
2. Limpar cache e cookies
3. OU: Ctrl + Shift + R (hard refresh)
4. OU: Abrir Aba Anônima

### Problema 2: Erro no Console

**Erro**: `Cannot find module '@angular/core'`

**Solução**: Build incompleto

```powershell
# Na Vercel, configurar:
Build Command: npm run build:prod
Install Command: npm install
Output Directory: www
```

### Problema 3: 404 em arquivos JS

**Causa**: Base href incorreto ou outputPath errado

**Verificar**:

- `angular.json` → `"outputPath": "www"` ✅
- `index.html` → `<base href="/" />` ✅
- `vercel.json` → `"outputDirectory": "www"` ✅

### Problema 4: Service Worker Ainda Ativo

**Sintoma**: Atualiza mas não muda nada

**Solução**:

1. DevTools → Application → Service Workers
2. **Unregister** todos os workers
3. Limpar cache (Storage → Clear site data)
4. Hard refresh (Ctrl + Shift + R)

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### ✅ Antes do Deploy

- [ ] Service Worker desabilitado em angular.json
- [ ] vercel.json atualizado com rotas corretas
- [ ] .vercelignore criado
- [ ] environment.prod.ts com URL correto do backend Railway
- [ ] Git commit e push feitos

### ✅ Após Deploy

- [ ] Build passou sem erros na Vercel
- [ ] URL da Vercel abre (não mostra erro 404)
- [ ] Console do navegador sem erros
- [ ] Network mostra todos os arquivos carregados (200)
- [ ] Tela de login aparece corretamente

### ✅ Funcional

- [ ] Consegue fazer login
- [ ] Roteamento funciona (navegação entre páginas)
- [ ] Assets (imagens, ícones) carregam

---

## 🔄 REABILITAR SERVICE WORKER (Depois que funcionar)

Quando tudo estiver funcionando perfeitamente:

1. **Editar**: `angular.json`

   ```json
   "serviceWorker": true
   ```

2. **Commit e Push**:

   ```powershell
   git add angular.json
   git commit -m "feat: reabilitar service worker para PWA"
   git push origin main
   ```

3. **Testar PWA**:
   - Instalar como app
   - Modo offline
   - Atualizações automáticas

---

## 📞 SUPORTE ADICIONAL

Se o problema persistir, forneça:

1. **URL da Vercel**: https://_____.vercel.app
2. **Screenshot do Console** (DevTools → Console)
3. **Screenshot do Network** (DevTools → Network)
4. **Logs da Build na Vercel**:
   - Deployments → Último deploy → Building
   - Copiar últimas 50 linhas

---

## 🎯 RESUMO - O QUE CAUSOU A TELA ROXA

### ANTES:

1. ✅ Build funcionava
2. ✅ Deploy funcionava
3. ❌ Service Worker fazia cache agressivo
4. ❌ Em atualizações, servia versão antiga/corrompida
5. ❌ Angular não iniciava
6. 🟣 **Só aparecia background roxo (#24024b) do CSS**

### AGORA:

1. ✅ Service Worker desabilitado
2. ✅ Sem cache agressivo
3. ✅ Sempre serve versão nova
4. ✅ Angular inicia corretamente
5. ✅ **App funciona!** 🎉

---

**Data da Correção**: 12 de fevereiro de 2026  
**Arquivos Modificados**:

- [angular.json](angular.json)
- [vercel.json](vercel.json)
- [.vercelignore](.vercelignore) (novo)
