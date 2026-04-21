const CACHE_NAME = "app-shell-v8";
const DYNAMIC_CACHE_NAME = "dynamic-content-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/socket.io/socket.io.js",
  "/styles.css",
  "/manifest.json",
  "/content/home.html",
  "/content/about.html",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-48x48.png",
  "/icons/favicon-64x64.png",
  "/icons/favicon-128x128.png",
  "/icons/icon-192.png",
  "/icons/favicon-256x256.png",
  "/icons/favicon-512x512.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/screenshots/app-wide.png",
  "/screenshots/app-mobile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/content/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkRes;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/content/home.html")))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

self.addEventListener("push", (event) => {
  let data = { title: "Новое уведомление", body: "", reminderId: null };
  if (event.data) data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/favicon-128x128.png",
    badge: "/icons/favicon-48x48.png",
    data: { reminderId: data.reminderId }
  };
  if (data.reminderId) {
    options.actions = [{ action: "snooze", title: "Отложить на 5 минут" }];
  }
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  const { action, notification } = event;
  const reminderId = notification?.data?.reminderId;

  if (action === "snooze" && reminderId) {
    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: "POST" }).finally(() => notification.close())
    );
    return;
  }

  notification.close();
});
