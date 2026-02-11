# Sistema de Troca de Preços

Sistema web/mobile para gestão e troca de preços de produtos, desenvolvido com Angular e Ionic Framework.

## 🚀 Tecnologias

- **Angular** 16+
- **Ionic Framework** 7+
- **TypeScript**
- **SCSS**
- **Socket.io** (WebSocket)
- **Firebase Analytics**
- **Service Worker** (PWA)

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Ionic CLI

```bash
npm install -g @ionic/cli
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start
# ou
ionic serve

# Build para produção
npm run build
# ou
ionic build --prod
```

## 🎨 Design System

O projeto utiliza um design system baseado em:

- Paleta de cores roxo moderno (#24024b → #4a0e78)
- Cards com efeito vidro fosco (backdrop-filter)
- Animações suaves e responsivas
- Sistema de variáveis SCSS reutilizáveis

Consulte o [GUIA-DE-ESTILO.md](src/GUIA-DE-ESTILO.md) para mais detalhes.

## 📱 Funcionalidades

- ✅ Autenticação JWT
- ✅ Seleção multi-empresa
- ✅ Troca de preços de bomba
- ✅ Gestão de negociações
- ✅ Aprovação de negociações
- ✅ Histórico de alterações
- ✅ Filtros avançados
- ✅ Atualizações em tempo real (WebSocket)
- ✅ PWA (Progressive Web App)
- ✅ Suporte offline

## 🏗️ Estrutura do Projeto

```
trocapreco/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── home/
│   │   ├── services/
│   │   └── class/
│   ├── assets/
│   ├── environments/
│   └── theme/
├── angular.json
├── ionic.config.json
├── package.json
└── tsconfig.json
```

## 🌐 Ambiente

O sistema se conecta a:

- **API**: https://variedades.digitalrf.com.br:443/drfPriceSwap
- **WebSocket**: https://variedades.digitalrf.com.br:443

## 👥 Autor

**Digital RF**

- Website: https://digitalrf.com.br

## 📄 Licença

Privado - Digital RF © 2026

## 📚 Documentação Adicional

- [GUIA-DE-ESTILO.md](src/GUIA-DE-ESTILO.md) - Padrões visuais
- [ALTERACOES.md](src/ALTERACOES.md) - Histórico de mudanças
- [EXEMPLO-APLICACAO.md](src/EXEMPLO-APLICACAO.md) - Templates
- [RESUMO-EXECUTIVO.md](src/RESUMO-EXECUTIVO.md) - Visão geral

## 🐛 Issues

Para reportar problemas ou sugerir melhorias, entre em contato com a equipe Digital RF.
