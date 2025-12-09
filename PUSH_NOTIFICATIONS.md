# 📱 Push Notifications (Expo/FCM/APNs)

## 🎯 Visão Geral

Sistema de notificações push onde **apenas o dono da loja recebe notificações** quando uma venda é criada. O dono se conecta (com autenticação), registra seu token push (Expo/FCM/APNs) no backend, e todas as vendas da sua loja disparam notificações para seus dispositivos registrados.

### 🔐 Fluxo de Segurança

- ✅ Requer autenticação (JWT) para registrar token
- ✅ Token vinculado ao userId (dono da loja)
- ✅ Apenas o dono recebe notificações de suas vendas
- ✅ Suporta múltiplos dispositivos por dono

## 📦 Instalação (Backend)

### Dependências necessárias

```bash
npm install axios
```

### Variáveis de Ambiente

```env
# Expo
EXPO_ACCESS_TOKEN=seu_token_expo

# FCM (Firebase Cloud Messaging)
FCM_SERVER_KEY=sua_chave_fcm

# APNs (opcional)
APNS_CERT_PATH=/caminho/para/cert.pem
APNS_KEY_PATH=/caminho/para/key.pem
```

## 📱 Implementação no Mobile (React Native/Expo)

### 1. Instalar Dependências

```bash
npm install expo-notifications
# ou
yarn add expo-notifications
```

### 2. Solicitar Permissão e Obter Token

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function registerOwnerPushToken(
  storeId: string,
  jwtToken: string // Token do dono da loja
) {
  try {
    // 1. Verificar se é dispositivo físico
    if (!Device.isDevice) {
      console.warn("⚠️ Notificações push requerem dispositivo físico");
      return;
    }

    // 2. Solicitar permissão
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("❌ Permissão de notificações negada");
      return;
    }

    // 3. Obter token
    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

    // 4. Registrar no backend (COM autenticação)
    await registerTokenWithBackend(pushToken, storeId, jwtToken);

    console.log("✅ Token registrado:", pushToken);
  } catch (error) {
    console.error("❌ Erro ao registrar push token:", error);
  }
}

async function registerTokenWithBackend(
  pushToken: string,
  storeId: string,
  jwtToken: string
) {
  try {
    const response = await fetch(
      "https://seu-servidor.com/api/push-tokens/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          token: pushToken,
          provider: "expo",
          storeId,
          deviceId: Device.osInternalBuildId,
          deviceName: Device.modelName,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Token registrado com sucesso:", data);
  } catch (error) {
    console.error("❌ Erro ao registrar token:", error);
  }
}
```

### 3. Configurar Handler de Notificações

```typescript
import * as Notifications from "expo-notifications";

// Configurar como a notificação será exibida quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Escutar notificações recebidas
export function setupNotificationListeners() {
  // Notificação recebida enquanto app está em foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("📬 Notificação recebida (foreground):", notification);

      // Processar dados da notificação
      const { orderId, orderNumber, total } = notification.request.content.data;

      // Atualizar UI, reproduzir som, etc.
      handleNewOrder({ orderId, orderNumber, total });
    }
  );

  // Notificação tocada/pressionada
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notificação tocada:", response);

      const { orderId } = response.notification.request.content.data;

      // Navegar para detalhes do pedido
      navigation.navigate("OrderDetails", { orderId });
    });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}
```

### 4. Usar no App Principal

```typescript
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  registerOwnerPushToken,
  setupNotificationListeners,
} from "./services/notifications";
import { useAuth } from "./contexts/AuthContext"; // Seu contexto de autenticação

export default function App() {
  const { user, token } = useAuth(); // Dados do dono logado
  const storeId = user?.storeId; // ID da loja do dono

  useEffect(() => {
    if (!token || !storeId) return;

    // Registrar para receber notificações (com autenticação)
    registerOwnerPushToken(storeId, token);

    // Configurar listeners
    const unsubscribe = setupNotificationListeners();

    return unsubscribe;
  }, [token, storeId]);

  return <NavigationContainer>{/* seu app aqui */}</NavigationContainer>;
}
```

## 🔔 Endpoints do Backend

### Registrar Token (COM AUTENTICAÇÃO)

**IMPORTANTE:** Apenas o dono da loja pode registrar seu token (requer JWT)

```http
POST /api/push-tokens/register
Authorization: Bearer seu-jwt-token
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "provider": "expo",
  "storeId": "uuid-da-loja",
  "deviceId": "device-identifier",
  "deviceName": "iPhone 13 Pro"
}
```

**Resposta (201):**

```json
{
  "message": "Token registrado com sucesso",
  "pushToken": {
    "id": "uuid",
    "token": "ExponentPushToken[...]",
    "provider": "expo",
    "userId": "uuid-do-dono",
    "storeId": "uuid-da-loja",
    "deviceId": "device-identifier",
    "deviceName": "iPhone 13 Pro"
  }
}
```

**Erros Possíveis:**

- `401 Unauthorized` - JWT inválido ou ausente
- `400 Bad Request` - Dados inválidos

### Listar Meus Tokens

```http
GET /api/push-tokens/my-tokens
Authorization: Bearer seu-jwt-token
```

**Resposta (200):**

```json
{
  "tokens": [
    {
      "id": "uuid",
      "token": "ExponentPushToken[...]",
      "provider": "expo",
      "storeId": "uuid-da-loja",
      "deviceId": "device-1",
      "deviceName": "iPhone 13 Pro",
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ]
}
```

### Desativar Token (COM AUTENTICAÇÃO)

```http
POST /api/push-tokens/deactivate
Authorization: Bearer seu-jwt-token
Content-Type: application/json

{
  "token": "ExponentPushToken[...]"
}
```

**Resposta (200):**

```json
{
  "message": "Token desativado com sucesso"
}
```

## 📧 Eventos de Notificação

### Nova Venda (PDV)

Disparado quando uma venda é criada via `POST /api/orders`

```json
{
  "title": "🛒 Nova Venda!",
  "body": "Pedido #ORD-001 - R$ 150,00",
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-001",
    "total": "150.00"
  }
}
```

### Nova Venda Online

Disparado quando uma venda online é criada via `POST /api/orders/online`

```json
{
  "title": "🛍️ Novo Pedido Online!",
  "body": "Pedido #ORD-002 - R$ 299,90",
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-002",
    "total": "299.90",
    "source": "online"
  }
}
```

## 🔐 Providers Suportados

### 📲 Expo

- ✅ Implementado
- Melhor para desenvolvimento rápido
- Requer apenas o token Expo

```typescript
{
  "token": "ExponentPushToken[...]",
  "provider": "expo",
  "storeId": "uuid"
}
```

### 🔥 FCM (Firebase Cloud Messaging)

- ✅ Implementado
- Para Android e iOS
- Requer configuração Firebase

```typescript
{
  "token": "cVYBdoqrT...",
  "provider": "fcm",
  "storeId": "uuid"
}
```

### 🍎 APNs (Apple Push Notification)

- ✅ Implementado
- Para iOS
- Requer certificados Apple

```typescript
{
  "token": "iphone-token-abc123...",
  "provider": "apns",
  "storeId": "uuid"
}
```

## 🧪 Testando

### 1. Fazer Login e Obter Token JWT

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dono@exemplo.com",
    "password": "senha123"
  }'

# Guardar o token JWT da resposta
```

### 2. Registrar Token Push com Autenticação

```bash
curl -X POST http://localhost:3333/api/push-tokens/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "token": "ExponentPushToken[test...]",
    "provider": "expo",
    "storeId": "seu-store-id",
    "deviceName": "Test Device"
  }'
```

### 3. Listar Meus Tokens

```bash
curl -X GET http://localhost:3333/api/push-tokens/my-tokens \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### 4. Criar Venda para Testar Notificação

```bash
curl -X POST http://localhost:3333/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "customerName": "João Silva",
    "paymentMethod": "pix",
    "items": [
      {
        "storeProductId": "product-uuid",
        "quantity": 2
      }
    ]
  }'

# ✅ Notificação será enviada APENAS para o dono da loja
```

## ⚙️ Configuração por Provider

### Expo

1. Criar conta em https://expo.dev
2. Gerar access token: `expo login` → Settings → Tokens
3. Adicionar em `.env`:

```env
EXPO_ACCESS_TOKEN=seu_token_aqui
```

### FCM

1. Criar projeto Firebase em https://console.firebase.google.com
2. Ir para Settings → Service Accounts
3. Gerar Server Key (chave privada)
4. Adicionar em `.env`:

```env
FCM_SERVER_KEY=sua_chave_aqui
```

### APNs

1. Gerar certificado/key no Apple Developer
2. Salvar certificado em `.pem`
3. Adicionar em `.env`:

```env
APNS_CERT_PATH=/caminho/cert.pem
APNS_KEY_PATH=/caminho/key.pem
```

## 📋 Checklist de Implementação

- [ ] Fazer login como dono da loja
- [ ] Instalar `expo-notifications` no mobile
- [ ] Solicitar permissão de notificações
- [ ] Obter token push (Expo/FCM/APNs)
- [ ] Registrar token no backend COM JWT (autenticado)
- [ ] Verificar token registrado via GET /push-tokens/my-tokens
- [ ] Criar cliente/comprador (sem login)
- [ ] Cliente cria compra via PDV ou online
- [ ] **Dono recebe notificação** (APENAS ele)
- [ ] Tocar notificação abre app
- [ ] Navegar para detalhes do pedido
- [ ] Registrar múltiplos dispositivos do mesmo dono
- [ ] Testar notificações em todos os dispositivos
- [ ] Desativar token antigo
- [ ] Configurar FCM ou APNs conforme necessário

## 🚀 Fluxo Completo

```
┌─────────────────────────────────────────┐
│ 1. Dono da Loja (COM LOGIN)            │
│ - Faz login com email/senha            │
│ - Recebe JWT token                     │
│ - Solicita permissão de notificações   │
│ - Obtém token (Expo/FCM/APNs)         │
│ - Envia storeId + token ao backend     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 2. Backend (Autentica)                 │
│ - Verifica JWT                         │
│ - Armazena token + userId + storeId    │
│ - Associa ao dispositivo               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 3. Cliente cria compra (PDV/Online)    │
│ - POST /api/orders                     │
│ - Backend recupera tokens DO DONO      │
│ - Envia notificação APENAS AO DONO     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 4. Dono recebe notificação             │
│ - Exibe alerta/som                     │
│ - Toca e abre o app                    │
│ - Vê detalhes do pedido                │
└─────────────────────────────────────────┘
```

## ⚠️ Tratamento de Erros

### Token Inválido

Se receber erro ao enviar notificação, o token é automaticamente marcado como inativo:

```typescript
await repository.deactivate(token);
```

### Permissão Negada

Se o usuário negar permissão de notificações:

- App não será capaz de registrar token
- Notificações não funcionarão
- Mostrar mensagem orientando o usuário a permitir

### Sem Conectividade

Se o backend não conseguir alcançar os serviços (Expo/FCM):

- Erro é logado
- Fluxo de venda continua normalmente
- Notificação falha silenciosamente

## 📞 Suporte

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
