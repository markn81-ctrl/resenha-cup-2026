import webPush, { type PushSubscription as WebPushSubscription } from "web-push";
import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type StoredPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    subject: process.env.VAPID_SUBJECT ?? "mailto:admin@resenhacup.local"
  };
}

export function getVapidPublicKey() {
  return getVapidConfig()?.publicKey ?? null;
}

function configureWebPush() {
  const config = getVapidConfig();

  if (!config) {
    return false;
  }

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

async function sendToSubscription(subscription: StoredPushSubscription, payload: PushPayload) {
  const webPushSubscription: WebPushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };

  try {
    await webPush.sendNotification(webPushSubscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : null;

    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({
        where: { id: subscription.id }
      });
    }

    return { ok: false };
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);

  if (!uniqueUserIds.length || !configureWebPush()) {
    return { attempted: 0, sent: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: {
        in: uniqueUserIds
      }
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  const results = await Promise.all(
    subscriptions.map((subscription) => sendToSubscription(subscription, payload))
  );

  return {
    attempted: subscriptions.length,
    sent: results.filter((result) => result.ok).length
  };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload);
}
