"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

type PushStatus = "checking" | "unavailable" | "default" | "active" | "denied" | "loading";

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getVapidPublicKey() {
  const response = await fetch("/api/push/vapid-public-key", {
    method: "GET"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { publicKey?: string };
  return payload.publicKey ?? null;
}

export function PushOptIn() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!isPushSupported()) {
        setStatus("unavailable");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const publicKey = await getVapidPublicKey();

      if (!publicKey) {
        setStatus("unavailable");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (!cancelled) {
        setStatus(subscription ? "active" : "default");
      }
    }

    void checkStatus().catch(() => {
      if (!cancelled) {
        setStatus("unavailable");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function activatePush() {
    setMessage(null);

    if (!isPushSupported()) {
      setStatus("unavailable");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    setStatus("loading");

    try {
      const publicKey = await getVapidPublicKey();

      if (!publicKey) {
        setStatus("unavailable");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error("subscribe_failed");
      }

      setStatus("active");
      setMessage("Push ativo");
    } catch {
      setStatus("default");
      setMessage("Nao foi possivel ativar");
    }
  }

  async function deactivatePush() {
    setMessage(null);
    setStatus("loading");

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }

      setStatus("default");
      setMessage("Push desativado");
    } catch {
      setStatus("active");
      setMessage("Nao foi possivel desativar");
    }
  }

  if (status === "checking" || status === "unavailable") {
    return null;
  }

  const active = status === "active";
  const disabled = status === "loading" || status === "denied";
  const label =
    status === "loading"
      ? "Aguarde"
      : status === "denied"
        ? "Push bloqueado"
        : active
          ? "Push ativo"
          : "Ativar push";

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          void (active ? deactivatePush() : activatePush());
        }}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          active
            ? "border-brand-300/50 bg-brand-400/15 text-brand-100 hover:bg-brand-400/20"
            : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
        )}
        title={active ? "Desativar notificacoes push" : "Ativar notificacoes push"}
      >
        {active ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
      </button>
      {message ? <span className="text-[10px] text-slate-400">{message}</span> : null}
    </div>
  );
}
