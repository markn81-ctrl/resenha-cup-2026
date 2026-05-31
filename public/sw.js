self.addEventListener("push", (event) => {
  let payload = {
    title: "Resenha Cup 2026",
    body: "Tem novidade na sua liga.",
    url: "/resenha"
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json()
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: {
        url: payload.url || "/resenha"
      },
      tag: payload.url || "resenha-cup",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/resenha", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});
