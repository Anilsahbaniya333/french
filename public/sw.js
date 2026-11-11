/*
 * Service-worker kill switch.
 *
 * This site does not use a service worker. Browsers that still have an old one
 * registered for this origin (from an earlier build or another app on the same
 * host/port) keep serving stale cached JavaScript, which causes React hydration
 * errors and outdated pages. Browsers re-check /sw.js on navigation; this version
 * clears every cache, unregisters itself and reloads open tabs with fresh code.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

// Never serve anything from cache — always go to the network.
self.addEventListener("fetch", () => {});
