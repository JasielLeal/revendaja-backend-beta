# GuardianDocs Backend

**API REST da plataforma SaaS de Gestão Documental para Empresas de Transporte**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify)](https://fastify.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20Textract-FF9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?style=flat-square&logo=stripe)](https://stripe.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](../LICENSE)

---

## O que é

O **GuardianDocs Backend** é a API principal responsável por autenticação, controle multi-tenant, processamento de documentos, OCR automatizado, gerenciamento de planos, billing e regras de negócio da plataforma.

Ele centraliza toda a operação documental de empresas de transporte, garantindo segurança, rastreabilidade e automação para documentos de funcionários, veículos, boletos e registros corporativos.

---

## Responsabilidades do backend

- **API REST** para frontend e integrações futuras
- **Autenticação JWT** com refresh token e rotação automática
- **Multi-tenant por empresa** com isolamento lógico de dados
- **Upload e armazenamento** de arquivos em nuvem
- **OCR automatizado** com AWS Textract
- **Fila assíncrona** para processamento em background com BullMQ + Redis
- **Classificação automática** de documentos com base no texto extraído
- **Gestão de vencimentos** com alertas automáticos por e-mail
- **Billing e assinaturas** com Stripe
- **Aplicação de limites por plano** em recursos da plataforma
- **Controle de acesso por papéis** (`OWNER`, `ADMIN`, `EMPLOYEE`)

---

## Stack principal

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Framework HTTP | Fastify |
| Linguagem | TypeScript |
| ORM | Prisma |
| Banco de dados | PostgreSQL 16 |
| Cache / filas | Redis 7 |
| Jobs assíncronos | BullMQ |
| Armazenamento | AWS S3 |
| OCR | AWS Textract |
| Billing | Stripe |
| Autenticação | JWT + Refresh Token |

---

## Funcionalidades principais

- **Autenticação segura** — login com access token curto e refresh token httpOnly
- **Controle de acesso por perfil** — permissões segmentadas por papel do usuário
- **Gestão de documentos** — upload, leitura, classificação e vencimento
- **OCR automatizado** — extração de texto após upload de documentos
- **Processamento assíncrono** — OCR executado em background via fila
- **Cadastro automático por CRLV** — criação de veículo com base no documento processado
- **Alertas de vencimento** — verificação diária de documentos críticos por empresa
- **Gestão de boletos** — módulo separado dos documentos corporativos
- **Billing via Stripe** — checkout, portal do cliente e sincronização por webhook
- **Limites por assinatura** — regras aplicadas conforme plano da empresa

---

## Estrutura sugerida do backend

```bash
guardiandocs-backend/
├── prisma/                 # Schema, migrations e seeds
├── src/
│   ├── config/             # Configurações globais e planos
│   ├── modules/            # Domínios da aplicação
│   ├── routes/             # Rotas HTTP
│   ├── jobs/               # Processadores assíncronos
│   ├── queues/             # Configuração de filas
│   ├── services/           # Regras de negócio e integrações
│   ├── utils/              # Helpers utilitários
│   └── server.ts           # Bootstrap da aplicação
├── docker-compose.yml      # Infra local (Postgres + Redis)
├── package.json
└── README.md
```

> A estrutura real pode variar conforme a implementação atual do projeto.

---

## Planos e limites

Os limites da aplicação são validados no backend e podem ser centralizados em arquivos como `src/config/plans.ts`.

| Recurso | Free | Starter | Pro |
|---|---|---|---|
| Funcionários | 5 | 30 | Ilimitado |
| Veículos | 3 | 15 | Ilimitado |
| Usuários | 2 | 10 | Ilimitado |
| Armazenamento | 1 GB | 20 GB | 100 GB |
| OCR de documentos | ✓ | ✓ | ✓ |
| Notificações de vencimento | ✓ | ✓ | ✓ |
| Suporte por e-mail | — | ✓ | ✓ |
| Preço mensal | Grátis | R$ 79/mês | R$ 199/mês |
| Preço anual | Grátis | R$ 59/mês | R$ 149/mês |

---

## Fluxo resumido de processamento documental

1. Usuário envia um documento
2. Backend valida permissões, plano e metadados
3. Arquivo é salvo no storage
4. Um job é enfileirado para OCR
5. AWS Textract extrai o conteúdo
6. O sistema classifica o documento automaticamente
7. Datas e campos relevantes são persistidos
8. Regras de vencimento passam a monitorar o documento

---

## Quick Start

```bash
cd guardiandocs-backend

# Suba a infraestrutura local
Docker compose up -d

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Execute migrations e seed
npm run db:migrate
npm run db:seed

# Rode em desenvolvimento
npm run dev
```

API disponível em:

```bash
http://localhost:3333
```

---

## Variáveis de ambiente esperadas

Exemplos comuns de configuração:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

> Consulte o arquivo `.env.example` para a lista real e atualizada das variáveis obrigatórias.

---

## Segurança e regras de acesso

O backend aplica controle de acesso com base em papéis:

- `OWNER` — controle total da empresa e billing
- `ADMIN` — gestão operacional e administrativa
- `EMPLOYEE` — acesso restrito conforme permissões do domínio

Além disso, o sistema opera em modelo **multi-tenant**, garantindo segregação lógica por empresa.

---

## Integrações

- **AWS S3** — armazenamento de arquivos
- **AWS Textract** — OCR e extração textual
- **Stripe** — assinaturas, checkout e portal do cliente
- **Redis** — cache e filas
- **PostgreSQL** — persistência principal de dados

---

## Roadmap técnico

- [x] API multi-tenant com autenticação JWT
- [x] Upload de arquivos com OCR assíncrono
- [x] Regras de plano e billing via Stripe
- [x] Alertas automáticos de vencimento
- [ ] Autenticação multifator (2FA via TOTP)
- [ ] Auditoria detalhada por ação do usuário
- [ ] Logs estruturados e observabilidade
- [ ] Rate limiting por tenant
- [ ] Webhooks internos para eventos de domínio
- [ ] Testes E2E para fluxos críticos

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

Este projeto está licenciado sob a [MIT License](../LICENSE).
