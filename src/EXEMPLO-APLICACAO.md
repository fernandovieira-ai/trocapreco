# Exemplo: Como Aplicar o Padrão em Outras Telas

## 📋 Template Base para Novas Telas

### Estrutura HTML Padrão

```html
<ion-header [translucent]="true" mode="ios" class="custom-header">
  <ion-toolbar class="main-toolbar">
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/home"></ion-back-button>
    </ion-buttons>
    <ion-title>Título da Página</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" mode="ios" class="page-content">
  <!-- Gradiente de fundo -->
  <div class="gradient-overlay"></div>

  <!-- Conteúdo principal -->
  <div class="content-wrapper">
    <!-- Card de informações -->
    <div class="info-card">
      <div class="card-header">
        <ion-icon name="icon-name" class="card-icon"></ion-icon>
        <div class="card-title-section">
          <h2 class="card-title">Título do Card</h2>
          <p class="card-subtitle">Subtítulo ou descrição</p>
        </div>
      </div>

      <!-- Conteúdo do card -->
      <div class="card-content">
        <!-- Seu conteúdo aqui -->
      </div>
    </div>

    <!-- Mais cards conforme necessário -->
  </div>
</ion-content>
```

### SCSS Padrão

```scss
// Importar variáveis de tema
@import "../../theme/colors.scss";

// ===============================
// PAGE CONTENT
// ===============================
.page-content {
  --background: transparent;
  position: relative;
}

// Gradiente de fundo
.gradient-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, $gradient-start 0%, $gradient-end 100%);
  z-index: -1;
}

// ===============================
// HEADER CUSTOMIZADO
// ===============================
.custom-header {
  --background: transparent;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .main-toolbar {
    --background: rgba(36, 2, 75, 0.95);
    --color: $text-white;
  }
}

// ===============================
// CONTENT WRAPPER
// ===============================
.content-wrapper {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

// ===============================
// INFO CARD
// ===============================
.info-card {
  background: $card-background;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-lg;
  border: 1px solid $card-border;
  backdrop-filter: blur(20px);
  animation: fadeInUp 0.6s ease-out;

  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    .card-icon {
      font-size: 36px;
      color: $primary;
    }

    .card-title-section {
      flex: 1;

      .card-title {
        margin: 0;
        font-size: $font-xl;
        font-weight: $font-bold;
        color: $text-primary;
      }

      .card-subtitle {
        margin: $spacing-xs 0 0 0;
        font-size: $font-sm;
        color: $text-secondary;
      }
    }
  }

  .card-content {
    // Estilos do conteúdo
  }
}

// ===============================
// ANIMAÇÕES
// ===============================
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

// ===============================
// RESPONSIVIDADE
// ===============================
@media (max-width: 768px) {
  .content-wrapper {
    padding: $spacing-md;
  }

  .info-card {
    padding: $spacing-lg;
  }
}
```

## 🎯 Exemplo Prático: Tela de Preços

### HTML

```html
<ion-header [translucent]="true" mode="ios" class="custom-header">
  <ion-toolbar class="main-toolbar">
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/home"></ion-back-button>
    </ion-buttons>
    <ion-title>Preços</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="salvar()">
        <ion-icon slot="icon-only" name="save-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" mode="ios" class="precos-content">
  <div class="gradient-overlay"></div>

  <div class="content-wrapper">
    <!-- Card de Filtros -->
    <div class="filter-card">
      <div class="card-header">
        <ion-icon name="filter-outline" class="card-icon"></ion-icon>
        <h2 class="card-title">Filtros</h2>
      </div>

      <div class="filter-form">
        <!-- Campo Produto -->
        <div class="input-wrapper">
          <label class="input-label">Produto</label>
          <div class="input-container">
            <ion-icon name="pricetag-outline" class="input-icon"></ion-icon>
            <ion-select placeholder="Selecione o produto">
              <ion-select-option
                *ngFor="let produto of produtos"
                [value]="produto.cod"
              >
                {{produto.nome}}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Campo Tipo de Preço -->
        <div class="input-wrapper">
          <label class="input-label">Tipo de Preço</label>
          <div class="input-container">
            <ion-icon name="cash-outline" class="input-icon"></ion-icon>
            <ion-select placeholder="Selecione o tipo">
              <ion-select-option value="venda">Venda</ion-select-option>
              <ion-select-option value="custo">Custo</ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Botão Buscar -->
        <ion-button expand="block" class="gradient-button" (click)="buscar()">
          <ion-icon slot="start" name="search-outline"></ion-icon>
          Buscar
        </ion-button>
      </div>
    </div>

    <!-- Card de Resultados -->
    <div class="results-card" *ngIf="resultados.length > 0">
      <div class="card-header">
        <ion-icon name="list-outline" class="card-icon"></ion-icon>
        <h2 class="card-title">Resultados</h2>
        <ion-badge color="primary">{{resultados.length}}</ion-badge>
      </div>

      <!-- Lista de Itens -->
      <div class="items-list">
        <div *ngFor="let item of resultados" class="item-card">
          <div class="item-info">
            <h3 class="item-name">{{item.nome}}</h3>
            <p class="item-code">Código: {{item.codigo}}</p>
          </div>
          <div class="item-price">
            <span class="price-label">Preço Atual</span>
            <span class="price-value">R$ {{item.preco | number:'1.2-2'}}</span>
          </div>
          <ion-button fill="clear" (click)="editar(item)">
            <ion-icon slot="icon-only" name="create-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>

    <!-- Estado Vazio -->
    <div class="empty-state" *ngIf="resultados.length === 0 && buscaRealizada">
      <ion-icon name="search-outline" class="empty-icon"></ion-icon>
      <h3 class="empty-title">Nenhum resultado encontrado</h3>
      <p class="empty-description">Tente ajustar seus filtros de busca</p>
    </div>
  </div>
</ion-content>
```

### SCSS

```scss
@import "../../theme/colors.scss";

.precos-content {
  --background: transparent;
}

.gradient-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, $gradient-start 0%, $gradient-end 100%);
  z-index: -1;
}

.content-wrapper {
  padding: $spacing-lg;
  max-width: 900px;
  margin: 0 auto;
}

// Card de Filtros
.filter-card {
  background: $card-background;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-lg;
  border: 1px solid $card-border;
  backdrop-filter: blur(20px);
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.input-wrapper {
  .input-label {
    display: block;
    margin-bottom: $spacing-sm;
    color: $text-label;
    font-size: $font-sm;
    font-weight: $font-medium;
  }

  .input-container {
    position: relative;
    background: $input-background;
    border: 2px solid $input-border;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;
    transition: all 0.3s ease;

    &:focus-within {
      border-color: $input-border-focus;
      background: $white;
      box-shadow: 0 0 0 4px rgba(36, 2, 75, 0.1);
    }

    .input-icon {
      color: $medium-gray;
      font-size: 20px;
      margin-right: $spacing-sm;
    }

    ion-select {
      flex: 1;
      --padding-start: 0;
    }
  }
}

// Card de Resultados
.results-card {
  background: $card-background;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  box-shadow: $shadow-lg;
  border: 1px solid $card-border;
  backdrop-filter: blur(20px);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.item-card {
  background: $input-background;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary;
    box-shadow: $shadow-sm;
  }

  .item-info {
    flex: 1;

    .item-name {
      margin: 0;
      font-size: $font-md;
      font-weight: $font-semibold;
      color: $text-primary;
    }

    .item-code {
      margin: $spacing-xs 0 0 0;
      font-size: $font-sm;
      color: $text-secondary;
    }
  }

  .item-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .price-label {
      font-size: $font-xs;
      color: $text-secondary;
    }

    .price-value {
      font-size: $font-lg;
      font-weight: $font-bold;
      color: $primary;
    }
  }
}

// Estado Vazio
.empty-state {
  text-align: center;
  padding: $spacing-2xl;

  .empty-icon {
    font-size: 64px;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: $spacing-md;
  }

  .empty-title {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-xl;
    color: $text-white;
  }

  .empty-description {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
  }
}
```

## 📝 Checklist de Aplicação

Ao aplicar o padrão em uma nova tela:

- [ ] Importar `@import '../../theme/colors.scss';`
- [ ] Adicionar `.gradient-overlay` no content
- [ ] Usar `.custom-header` no header
- [ ] Envolver conteúdo em `.content-wrapper`
- [ ] Usar cards com `.info-card` ou classe similar
- [ ] Aplicar `.gradient-button` nos botões primários
- [ ] Usar `.input-wrapper` para formulários
- [ ] Adicionar animação `fadeInUp` aos cards
- [ ] Testar responsividade
- [ ] Verificar contraste de cores

## 🎨 Variações de Cards

### Card com Ação no Header

```html
<div class="info-card">
  <div class="card-header">
    <ion-icon name="icon" class="card-icon"></ion-icon>
    <h2 class="card-title">Título</h2>
    <ion-button fill="clear" size="small">
      <ion-icon slot="icon-only" name="add"></ion-icon>
    </ion-button>
  </div>
</div>
```

### Card com Badge

```html
<div class="info-card">
  <div class="card-header">
    <ion-icon name="icon" class="card-icon"></ion-icon>
    <h2 class="card-title">Título</h2>
    <ion-badge color="success">Novo</ion-badge>
  </div>
</div>
```

### Card Compacto

```html
<div class="compact-card">
  <ion-icon name="icon" class="compact-icon"></ion-icon>
  <div class="compact-content">
    <h3>Título</h3>
    <p>Descrição breve</p>
  </div>
  <ion-icon name="chevron-forward" class="compact-arrow"></ion-icon>
</div>
```

```scss
.compact-card {
  background: $card-background;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary;
    box-shadow: $shadow-sm;
  }
}
```

---

Use este documento como referência ao aplicar o padrão visual nas demais telas do sistema.
