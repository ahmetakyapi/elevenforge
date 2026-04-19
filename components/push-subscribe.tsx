"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * One-tap push opt-in. Registers /sw.js, requests Notification permission,
 * subscribes via PushManager, and POSTs the subscription to the API. If
 * VAPID isn't configured the button shows a disabled state instead of
 * silently failing.
 */
export function PushSubscribeButton() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  const subscribe = () => {
    startTransition(async () => {
      try {
        if (!VAPID_PUBLIC) {
          toast({
            icon: "⚠",
            title: "Push devre dışı",
            body: "VAPID anahtarı ayarlanmamış (dev modu).",
            accent: "var(--muted)",
          });
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast({
            icon: "🔕",
            title: "İzin verilmedi",
            body: "Bildirimler tarayıcıda kapalı kaldı.",
            accent: "var(--danger)",
          });
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC),
        });
        const json = sub.toJSON();
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
          }),
        });
        if (!res.ok) throw new Error("subscribe failed");
        setSubscribed(true);
        toast({
          icon: "🔔",
          title: "Bildirimler açıldı",
          body: "Maç sonu, casus ve transfer haberlerini al.",
          accent: "var(--emerald)",
        });
      } catch (err) {
        toast({
          icon: "⚠",
          title: "Olmadı",
          body: String((err as Error).message ?? err),
          accent: "var(--danger)",
        });
      }
    });
  };

  const unsubscribe = () => {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } catch {
        // best-effort
      }
    });
  };

  if (supported === null) return null;
  if (!supported) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" disabled title="Tarayıcı push desteklemiyor">
        <BellOff size={14} strokeWidth={1.6} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${subscribed ? "btn-ghost" : ""}`}
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={pending}
      title={subscribed ? "Bildirimleri kapat" : "Bildirimleri aç"}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {subscribed ? (
        <>
          <Bell size={14} strokeWidth={1.6} style={{ color: "var(--emerald)" }} />
          <span style={{ fontSize: 11 }}>Açık</span>
        </>
      ) : (
        <>
          <BellOff size={14} strokeWidth={1.6} />
          <span style={{ fontSize: 11 }}>Bildirimleri Aç</span>
        </>
      )}
    </button>
  );
}

function urlB64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(safe);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}
