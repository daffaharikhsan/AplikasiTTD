/* Service worker Pengingat TTD: menerima push & membuka halaman saat notifikasi diketuk. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Pengingat TTD", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Pengingat TTD";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/ikon/192",
      badge: "/ikon/96",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of list) {
        if (c.url === target && "focus" in c) return c.focus();
      }
      for (const c of list) {
        if ("navigate" in c && new URL(c.url).origin === self.location.origin) {
          await c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});

/* Diperlukan sebagian browser agar aplikasi bisa dipasang; tidak menyimpan cache. */
self.addEventListener("fetch", () => {});
