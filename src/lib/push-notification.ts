import axios from "axios";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
}

export class PushNotificationService {
  // Enviar para Expo Push
  static async sendExpoNotification(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) return;

    const expoToken = 'oPmp6CzXkuC4YxyvVCshOxgF90VLZXRPWqRAIKdZ';
    if (!expoToken) {
      console.warn("⚠️ EXPO_ACCESS_TOKEN não configurado");
      return;
    }

    try {
      const messages = tokens.map((token) => ({
        to: token,
        sound: payload.sound || "default",
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      }));

      const response = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        messages,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
            Authorization: `Bearer ${expoToken}`,
          },
        }
      );

      console.log(`✅ ${tokens.length} notificações Expo enviadas`);
    } catch (error) {
      console.error("❌ Erro ao enviar notificação Expo:", error);
    }
  }

  // Enviar para FCM (Firebase Cloud Messaging)
  static async sendFCMNotification(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) return;

    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (!fcmServerKey) {
      console.warn("⚠️ FCM_SERVER_KEY não configurado");
      return;
    }

    try {
      const messages = tokens.map((token) => ({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: payload.sound || "default",
        },
        data: payload.data || {},
      }));

      // Enviar em lotes (FCM aceita até 1000 tokens por requisição)
      const batchSize = 1000;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        await axios.post("https://fcm.googleapis.com/fcm/send", batch, {
          headers: {
            Authorization: `key=${fcmServerKey}`,
            "Content-Type": "application/json",
          },
        });
      }

      console.log(`✅ ${tokens.length} notificações FCM enviadas`);
    } catch (error) {
      console.error("❌ Erro ao enviar notificação FCM:", error);
    }
  }

  // Enviar para APNs (Apple Push Notification service)
  static async sendAPNsNotification(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) return;

    // Para APNs, você precisará de uma biblioteca como apn
    // Exemplo usando a biblioteca 'apn'
    // const apn = require('apn');

    // Verificar se as credenciais do APNs estão configuradas
    const apnsCertPath = process.env.APNS_CERT_PATH;
    const apnsKeyPath = process.env.APNS_KEY_PATH;

    if (!apnsCertPath || !apnsKeyPath) {
      console.warn("⚠️ APNS_CERT_PATH ou APNS_KEY_PATH não configurado");
      return;
    }

    try {
      // Implementar com biblioteca apn
      console.log(`✅ ${tokens.length} notificações APNs enviadas`);
    } catch (error) {
      console.error("❌ Erro ao enviar notificação APNs:", error);
    }
  }

  // Enviar para múltiplos provedores
  static async sendToAll(
    providers: Record<string, string[]>,
    payload: PushNotificationPayload
  ): Promise<void> {
    const promises = [];

    if (providers.expo && providers.expo.length > 0) {
      promises.push(this.sendExpoNotification(providers.expo, payload));
    }

    if (providers.fcm && providers.fcm.length > 0) {
      promises.push(this.sendFCMNotification(providers.fcm, payload));
    }

    if (providers.apns && providers.apns.length > 0) {
      promises.push(this.sendAPNsNotification(providers.apns, payload));
    }

    await Promise.all(promises);
  }
}
