<div align="center">

# Revendaja Backend

**API REST para gestão de usuários, lojas, catálogo, pedidos, pagamentos e integrações da plataforma Revendaja**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify)](https://fastify.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?style=flat-square&logo=stripe)](https://stripe.com)
[![AWS](https://img.shields.io/badge/AWS-S3-FF9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com)
[![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)](LICENSE)

</div>

---

## O que é

**Revendaja Backend** é a API principal da plataforma Revendaja. Ela centraliza autenticação, gerenciamento de usuários, lojas, produtos, catálogo, pedidos, pagamentos e integrações externas como Stripe, S3, notificações push e WhatsApp.

O backend foi construído para sustentar uma operação de vendas com catálogo, estoque, personalização de produtos por loja, fluxo de checkout, plano por assinatura e comunicação em tempo real com clientes e lojistas.

---

## Monolito backend

Este repositório representa o backend da aplicação e organiza a regra de negócio em módulos dentro de `src/services`, além de configuração, entidades, middlewares, integrações e camada de persistência com Prisma.

```bash
revendaja-backend-beta/
├── prisma/                 # Schema, migrations e arquivos de carga inicial
├── src/
│   ├── config/             # Planos e permissões
│   ├── entities/           # Tipagens e entidades da aplicação
│   ├── lib/                # Utilitários e inicialização de recursos compartilhados
│   ├── mail/               # Recursos relacionados a e-mail
│   ├── middlewares/        # Middlewares como autenticação por token
│   ├── services/           # Módulos da regra de negócio e controllers
│   ├── types/              # Tipos auxiliares
│   ├── whatsapp/           # Integrações específicas de WhatsApp
│   └── server.ts           # Bootstrap do servidor Fastify
├── docker-compose.yml      # PostgreSQL local para desenvolvimento
├── package.json
├── prisma.config.ts
└── README.md
```

---

## Funcionalidades principais

- **Autenticação de usuários** — cadastro, login, verificação de token, recuperação e redefinição de senha
- **Verificação por e-mail e OTP** — confirmação de conta e fluxo de recuperação com código
- **Gestão de lojas** — criação, edição e operação de lojas com subdomínio e identidade visual
- **Catálogo de produtos** — base de catálogo com preço normal, sugerido, marca, categoria e código de barras
- **Produtos por loja** — controle de preço, quantidade, validade, status e vínculo com catálogo
- **Produtos customizados** — suporte a itens próprios da loja fora do catálogo base
- **Pedidos** — criação e acompanhamento de pedidos com itens, pagamento e entrega
- **Área web pública da loja** — rotas dedicadas para consumo via `/api/web`
- **Pagamentos via Stripe** — checkout, portal do cliente e consulta de assinaturas
- **Webhooks** — recebimento de eventos externos com tratamento específico
- **Upload de arquivos** — suporte a multipart com limite configurado no Fastify
- **Notificações push** — registro e gerenciamento de tokens por dispositivo
- **Integração com WhatsApp** — recebimento de eventos e automações relacionadas
- **Socket.IO** — suporte a comunicação em tempo real
- **Documentação OpenAPI** — Swagger disponível na rota `/docs`

---

## Planos

Os limites e recursos dos planos são definidos em `src/config/plans.ts`.

| Recurso | Free | Starter | Exclusive |
|---|---|---|---|
| Pedidos mensais | 10 | 40 | Ilimitado |
| Produtos máximos | 15 | 200 | Ilimitado |
| Loja online | ✓ | ✓ | ✓ |
| Integração com WhatsApp | — | — | ✓ |
| Exportação de relatórios | — | ✓ | ✓ |
| Suporte prioritário | — | ✓ | ✓ |

---

## Quick Start

```bash
# Clone
git clone https://github.com/JasielLeal/revendaja-backend-beta.git
cd revendaja-backend-beta

# Infra local
docker compose up -d

# Variáveis de ambiente
cp .env.example .env

# Dependências
npm install

# Rode em desenvolvimento
npm run dev
```

API disponível em:

```bash
http://localhost:3333
```

Documentação Swagger:

```bash
http://localhost:3333/docs
```

---

## Estrutura de domínio

Os módulos principais registrados no servidor incluem:

| Módulo | Descrição |
|---|---|
| `user` | Cadastro, login, verificação de e-mail, OTP, perfil e autenticação |
| `store` | Gestão da loja e dados principais do estabelecimento |
| `product` | Operações relacionadas a produtos |
| `catalog` | Catálogo base compartilhado |
| `store-product` | Produtos da loja vinculados ao catálogo |
| `store-product-custom` | Produtos próprios/customizados por loja |
| `order` | Criação e gestão de pedidos |
| `banner` | Banners e identidade visual |
| `webhook` | Eventos externos, especialmente pagamentos |
| `payment` | Checkout, portal e assinaturas Stripe |
| `store-web` | Endpoints públicos da loja para web |
| `push-token` | Registro de dispositivos para push notification |
| `whatsapp` | Integração e webhooks do WhatsApp |

---

## Modelos principais do banco

Com base no `prisma/schema.prisma`, o backend possui entidades centrais como:

- **User** — usuários, plano, role, verificação de e-mail e vínculo Stripe
- **Store** — loja, subdomínio, identidade visual, configurações e relacionamento com usuário
- **Catalog** — base de produtos do catálogo
- **StoreProduct** — produto da loja vinculado ao catálogo
- **StoreProductCustom** — produto exclusivo/customizado da loja
- **Order** — pedido realizado na loja
- **OrderItem** — itens do pedido
- **Banner** — banners visuais
- **PushToken** — tokens de notificação por usuário e loja
- **StoreSettings** — configurações como chave Pix

---

## Variáveis de ambiente

O arquivo `.env.example` inclui as seguintes variáveis base:

| Categoria | Variáveis |
|---|---|
| Banco de dados | `DATABASE_URL` |
| JWT | `JWT_SECRET` |
| E-mail | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC` |
| Servidor | `PORT` |

---

## Segurança e acesso

O backend utiliza autenticação baseada em token JWT e middleware de proteção de rotas.

Os papéis definidos em `src/config/permissions.ts` são:

- `Admin`
- `Member`

Entre as permissões previstas estão:

- gerenciamento de produtos
- criação e visualização de pedidos
- edição da loja
- visualização de dashboard e métricas
- gerenciamento de usuários e planos

---

## Integrações

- **PostgreSQL** — persistência principal com Prisma
- **Stripe** — checkout, portal do cliente e assinaturas
- **AWS S3** — armazenamento de arquivos
- **SMTP / e-mail** — envio de mensagens transacionais
- **WhatsApp** — recebimento de eventos e integrações específicas
- **Socket.IO** — eventos em tempo real

---

## Roadmap

- [x] API Fastify com documentação Swagger
- [x] Autenticação com JWT
- [x] Gestão de usuários e lojas
- [x] Catálogo, produtos e produtos customizados
- [x] Pedidos e fluxo de pagamento
- [x] Integração com Stripe
- [x] Registro de push tokens
- [x] Integração inicial com WhatsApp
- [ ] Evolução dos relatórios por plano
- [ ] Expansão das automações em tempo real
- [ ] Melhorias em observabilidade e testes

---

## Autor

**Jasiel Viana Leal**

| | |
|---|---|
| GitHub | [https://github.com/JasielLeal](https://github.com/JasielLeal) |
| LinkedIn | [https://www.linkedin.com/in/jasiel-leal-0781b9284/](https://www.linkedin.com/in/jasiel-leal-0781b9284/) |
| E-mail | jasieloficial@hotmail.com |

---

## Licença

Este projeto está licenciado sob a licença definida no repositório.
