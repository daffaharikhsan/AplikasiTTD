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
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/ikon/192",
        badge: "/ikon/96",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        requireInteraction: true,
        // Getar mengikuti irama nada TTD (dua ketukan, jeda, panjang)
        vibrate: [100, 40, 100, 120, 420, 140, 120, 60, 120, 60, 200],
        data: { url: data.url || "/" },
      }),
      // Aplikasi sedang terbuka → minta halaman memutar nada TTD
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((list) => list.forEach((c) => c.postMessage({ type: "pengingat-ttd", title }))),
    ]),
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
