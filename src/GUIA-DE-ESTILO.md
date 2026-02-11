# Guia de Estilo - Sistema de Troca de Preços

## 📋 Visão Geral

Este documento descreve o novo padrão visual do sistema, baseado no design do **AppPedidoExpo**, mantendo todas as funcionalidades existentes do aplicativo Angular/Ionic.

## 🎨 Paleta de Cores

### Cores Principais

- **Primary (Roxo Escuro)**: `#24024b` - Usado para elementos principais e destaques
- **Secondary (Roxo Médio)**: `#4a0e78` - Usado para elementos secundários
- **White**: `#ffffff` - Fundo de cards e textos em áreas escuras

### Cores de Texto

- **Text Primary**: `#1a1a2e` - Títulos e textos principais
- **Text Secondary**: `#6b7280` - Textos secundários e descrições
- **Text Label**: `#374151` - Labels de formulários

### Cores de Estado

- **Success**: `#059669` - Ações positivas e confirmações
- **Warning**: `#d97706` - Avisos e alertas
- **Error**: `#dc2626` - Erros e ações destrutivas
- **Info**: `#2563eb` - Informações gerais

### Gradientes

- **Background Principal**: `linear-gradient(180deg, #24024b 0%, #4a0e78 100%)`
- **Botões**: `linear-gradient(135deg, #24024b 0%, #4a0e78 100%)`

## 🧩 Componentes

### Cards (`.standard-card`)

```scss
background: rgba(255, 255, 255, 0.95);
border-radius: 16px;
padding: 24px;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(20px);
```

**Uso:**

```html
<div class="standard-card">
  <div class="card-header">
    <ion-icon name="icon-name" class="card-icon"></ion-icon>
    <h2 class="card-title">Título do Card</h2>
  </div>
  <!-- Conteúdo -->
</div>
```

### Botões

#### Botão Gradiente (`.gradient-button`)

```html
<ion-button expand="block" class="gradient-button"> Texto do Botão </ion-button>
```

#### Botão Outline (`.outline-button`)

```html
<ion-button expand="block" fill="outline" class="outline-button">
  Texto do Botão
</ion-button>
```

### Inputs (`.custom-input-wrapper`)

```html
<div class="custom-input-wrapper">
  <label class="input-label">Nome do Campo</label>
  <ion-input type="text" placeholder="Digite aqui..."></ion-input>
</div>
```

### Modais (`.custom-modal`)

```html
<ion-modal class="custom-modal">
  <ng-template>
    <ion-header class="modal-header">
      <ion-toolbar>
        <ion-title>Título do Modal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <!-- Conteúdo -->
    </ion-content>

    <ion-footer class="modal-footer">
      <!-- Ações -->
    </ion-footer>
  </ng-template>
</ion-modal>
```

## 📐 Espaçamentos

Sistema baseado em múltiplos de 8px:

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## 📏 Tipografia

### Tamanhos de Fonte

- **xs**: 12px
- **sm**: 14px
- **md**: 16px (padrão)
- **lg**: 18px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 30px

### Pesos de Fonte

- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## 🎭 Efeitos Visuais

### Sombras

```scss
// Pequena
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

// Média
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

// Grande
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

// Extra Grande
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Glass Effect (Vidro Fosco)

```scss
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Texto com Gradiente

```html
<h1 class="text-gradient">Texto com Gradiente</h1>
```

## 🔄 Border Radius

- **sm**: 4px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px
- **full**: 9999px (circular)

## 📱 Responsividade

### Breakpoints

```scss
// Mobile
@media (max-width: 480px) {
}

// Tablet
@media (max-width: 768px) {
}

// Desktop
@media (min-width: 769px) {
}
```

## ✨ Animações

### Fade In Up

```scss
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Fade In Down

```scss
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Float

```scss
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

## 🗂️ Estrutura de Arquivos

```
theme/
├── colors.scss        # Variáveis de cores
└── variables.scss     # Variáveis do Ionic

app/
├── login/
│   ├── login.page.html      # Template da tela de login
│   ├── login.page.scss      # Estilos da tela de login
│   └── login.page.ts        # Lógica da tela de login
└── home/
    ├── home.page.html       # Template da tela home
    ├── home.page.scss       # Estilos da tela home
    └── home.page.ts         # Lógica da tela home

global.scss            # Estilos globais e utilitários
```

## 🔧 Como Aplicar o Padrão

### 1. Importar Variáveis

```scss
@import "../../theme/colors.scss";
```

### 2. Usar Variáveis SCSS

```scss
.meu-componente {
  color: $text-primary;
  background: $card-background;
  padding: $spacing-md;
  border-radius: $radius-lg;
}
```

### 3. Usar Classes Utilitárias

```html
<div class="standard-card shadow-lg">
  <h2 class="text-gradient">Título</h2>
</div>
```

## 📋 Checklist para Novos Componentes

- [ ] Usar paleta de cores definida
- [ ] Aplicar border-radius apropriado
- [ ] Adicionar sombras conforme hierarquia
- [ ] Implementar estados hover/active
- [ ] Garantir responsividade
- [ ] Adicionar animações sutis
- [ ] Testar em dispositivos móveis
- [ ] Verificar contraste de cores (acessibilidade)

## 🎯 Boas Práticas

1. **Consistência**: Use sempre as variáveis definidas no arquivo `colors.scss`
2. **Responsividade**: Teste em diferentes tamanhos de tela
3. **Performance**: Use `backdrop-filter` com moderação
4. **Acessibilidade**: Mantenha contraste adequado (mínimo 4.5:1)
5. **Animações**: Mantenha animações sutis (< 500ms)
6. **Feedback Visual**: Sempre forneça feedback para ações do usuário

## 🔄 Migração de Componentes Existentes

### Passo 1: Backup

```powershell
Copy-Item "componente.scss" "componente.scss.BACKUP"
```

### Passo 2: Aplicar Novo Padrão

- Substituir cores hardcoded por variáveis
- Adicionar border-radius e sombras
- Implementar backdrop-filter em cards
- Adicionar transições e animações

### Passo 3: Testar

- Verificar visualmente
- Testar interações
- Validar responsividade

## 📞 Suporte

Para dúvidas sobre o padrão de estilo, consulte:

- Este guia de estilo
- Arquivos de referência: `login.page.scss` e `home.page.scss`
- Projeto de referência: `AppPedidoExpo`

---

**Última atualização**: Janeiro 2026
**Versão do Guia**: 1.0
**Autor**: Digital RF
