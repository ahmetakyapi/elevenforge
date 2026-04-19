// ElevenForge service worker — handles push notifications.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = (() => {
    try {
      return event.data.json();
    } catch {
      return { title: "ElevenForge", body: event.data.text() };
    }
  })();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "ElevenForge", {
      body: data.body,
      icon: data.icon ?? "/icon-192.png",
      badge: "/icon-96.png",
      data: { url: data.url ?? "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
