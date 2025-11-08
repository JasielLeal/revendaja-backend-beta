# Exemplos de Integração Frontend

## JavaScript/TypeScript - Criar Checkout

```javascript
// Função para criar uma sessão de checkout
async function createCheckoutSession(priceId) {
  try {
    const response = await fetch("/api/payment/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        priceId: priceId,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    });

    const data = await response.json();

    if (data.url) {
      // Redireciona para o checkout do Stripe
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL received");
    }
  } catch (error) {
    console.error("Error creating checkout:", error);
    alert("Erro ao criar checkout. Tente novamente.");
  }
}

// Exemplo de uso
document.getElementById("basic-plan-btn").addEventListener("click", () => {
  createCheckoutSession("price_basic_plan_id");
});

document.getElementById("premium-plan-btn").addEventListener("click", () => {
  createCheckoutSession("price_premium_plan_id");
});
```

## React - Componente de Planos

```jsx
import React, { useState } from "react";

const PricingComponent = () => {
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: "Basic",
      price: "R$ 29/mês",
      priceId: "price_basic_plan_id",
      features: ["Até 100 produtos", "Suporte por email", "Dashboard básico"],
    },
    {
      name: "Premium",
      price: "R$ 59/mês",
      priceId: "price_premium_plan_id",
      features: [
        "Produtos ilimitados",
        "Suporte prioritário",
        "Analytics avançados",
      ],
    },
  ];

  const handleSubscribe = async (priceId) => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Erro ao criar checkout");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payment/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao abrir portal do cliente.");
    }
  };

  return (
    <div className="pricing-container">
      <h2>Escolha seu Plano</h2>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.name} className="plan-card">
            <h3>{plan.name}</h3>
            <p className="price">{plan.price}</p>

            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.priceId)}
              disabled={loading}
              className="subscribe-btn"
            >
              {loading ? "Processando..." : "Assinar"}
            </button>
          </div>
        ))}
      </div>

      <div className="customer-portal">
        <h3>Já é assinante?</h3>
        <button onClick={openCustomerPortal} className="portal-btn">
          Gerenciar Assinatura
        </button>
      </div>
    </div>
  );
};

export default PricingComponent;
```

## Vue.js - Composable para Pagamentos

```javascript
// composables/usePayments.js
import { ref } from "vue";

export function usePayments() {
  const loading = ref(false);
  const error = ref(null);

  const createCheckout = async (priceId) => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Erro ao criar checkout");
      }
    } catch (err) {
      error.value = err.message;
      console.error("Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const openPortal = async () => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payment/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      error.value = err.message;
      console.error("Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const getSubscriptions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payment/subscriptions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (err) {
      error.value = err.message;
      console.error("Error:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    createCheckout,
    openPortal,
    getSubscriptions,
  };
}
```

## Páginas de Sucesso e Cancelamento

### success.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pagamento Realizado com Sucesso!</title>
  </head>
  <body>
    <div class="success-container">
      <h1>🎉 Pagamento Realizado com Sucesso!</h1>
      <p>
        Sua assinatura foi ativada. Você já pode aproveitar todos os benefícios
        do seu novo plano.
      </p>
      <a href="/dashboard">Ir para Dashboard</a>
    </div>

    <script>
      // Opcional: Atualizar dados do usuário após sucesso
      async function updateUserData() {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const userData = await response.json();
       
        } catch (error) {
          console.error("Erro ao atualizar dados:", error);
        }
      }

      // Chama a função quando a página carrega
      updateUserData();
    </script>
  </body>
</html>
```

### cancel.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pagamento Cancelado</title>
  </head>
  <body>
    <div class="cancel-container">
      <h1>Pagamento Cancelado</h1>
      <p>
        Seu pagamento foi cancelado. Você pode tentar novamente quando quiser.
      </p>
      <a href="/pricing">Voltar aos Planos</a>
    </div>
  </body>
</html>
```

## Exemplo de Verificação de Plano

```javascript
// Função para verificar o plano atual do usuário
async function checkUserPlan() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await response.json();

    // Atualiza a UI baseado no plano
    updateUIBasedOnPlan(userData.plan);

    return userData.plan;
  } catch (error) {
    console.error("Erro ao verificar plano:", error);
    return "Free";
  }
}

function updateUIBasedOnPlan(plan) {
  const planBadge = document.getElementById("plan-badge");
  const upgradeBtn = document.getElementById("upgrade-btn");

  if (planBadge) {
    planBadge.textContent = plan;
    planBadge.className = `plan-badge plan-${plan.toLowerCase()}`;
  }

  if (upgradeBtn) {
    upgradeBtn.style.display = plan === "Free" ? "block" : "none";
  }

  // Habilita/desabilita funcionalidades baseado no plano
  const premiumFeatures = document.querySelectorAll(".premium-feature");
  premiumFeatures.forEach((feature) => {
    if (plan === "Free") {
      feature.classList.add("disabled");
      feature.title = "Upgrade para Premium para usar esta funcionalidade";
    } else {
      feature.classList.remove("disabled");
      feature.title = "";
    }
  });
}
```
