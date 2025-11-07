# Configuração do Webhook do Stripe

## Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Stripe Price IDs para diferentes planos
STRIPE_PRICE_ID_BASIC="price_basic_plan_id"
STRIPE_PRICE_ID_PREMIUM="price_premium_plan_id"
STRIPE_PRICE_ID_ENTERPRISE="price_enterprise_plan_id"
```

## Configuração no Dashboard do Stripe

1. **Acesse o Dashboard do Stripe**: https://dashboard.stripe.com/

2. **Crie um Webhook**:

   - Vá para "Developers" > "Webhooks"
   - Clique em "Add endpoint"
   - URL do endpoint: `https://seu-dominio.com/api/webhook/stripe`
   - Selecione os eventos:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Copie o Webhook Secret**:

   - Após criar o webhook, clique nele
   - Na seção "Signing secret", clique em "Reveal"
   - Copie o valor e adicione à variável `STRIPE_WEBHOOK_SECRET`

4. **Configure os Price IDs**:
   - Vá para "Products" no dashboard
   - Para cada produto/plano, copie o Price ID
   - Adicione aos respectivos `STRIPE_PRICE_ID_*`

## Endpoints da API

### Criar Checkout Session

```
POST /api/payment/create-checkout
Authorization: Bearer <token>

{
  "priceId": "price_1234567890",
  "successUrl": "https://seuapp.com/success",
  "cancelUrl": "https://seuapp.com/cancel"
}
```

### Criar Portal do Cliente

```
POST /api/payment/create-portal
Authorization: Bearer <token>

{
  "returnUrl": "https://seuapp.com/dashboard"
}
```

### Listar Subscriptions do Usuário

```
GET /api/payment/subscriptions
Authorization: Bearer <token>
```

### Webhook do Stripe

```
POST /api/webhook/stripe
Stripe-Signature: <signature>

{
  // Payload do Stripe
}
```

## Como Funciona

O webhook processa os seguintes eventos do Stripe:

### `checkout.session.completed`

- Disparado quando um checkout é concluído com sucesso
- Atualiza o plano do usuário baseado na subscription criada

### `invoice.payment_succeeded`

- Disparado quando um pagamento recorrente é processado
- Confirma que o plano continua ativo

### `customer.subscription.updated`

- Disparado quando uma subscription é modificada
- Atualiza o plano do usuário conforme a mudança

### `customer.subscription.deleted`

- Disparado quando uma subscription é cancelada
- Reverte o usuário para o plano "Free"

## Mapeamento de Planos

Os Price IDs do Stripe são mapeados para nomes de planos no sistema:

- `STRIPE_PRICE_ID_BASIC` → "Basic"
- `STRIPE_PRICE_ID_PREMIUM` → "Premium"
- `STRIPE_PRICE_ID_ENTERPRISE` → "Enterprise"
- Qualquer outro Price ID → "Free"

## Testando o Webhook

Para testar localmente, você pode usar o Stripe CLI:

```bash
# Instale o Stripe CLI
# https://stripe.com/docs/stripe-cli

# Faça login
stripe login

# Escute os webhooks e redirecione para seu servidor local
stripe listen --forward-to localhost:3333/api/webhook/stripe

# Em outro terminal, simule eventos
stripe trigger checkout.session.completed
```

## Logs e Monitoramento

- Todos os eventos processados são logados no console
- Erros são tratados e retornados com status apropriados
- Eventos não reconhecidos são logados mas não geram erro

## Segurança

- O webhook verifica a assinatura do Stripe usando o webhook secret
- Apenas eventos com assinatura válida são processados
- Headers CORS estão configurados para permitir requisições do Stripe
