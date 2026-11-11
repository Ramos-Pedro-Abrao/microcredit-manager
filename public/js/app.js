document.querySelectorAll(".app-alert").forEach((alert) => {
  window.setTimeout(() => {
    if (alert.isConnected && window.bootstrap) {
      window.bootstrap.Alert.getOrCreateInstance(alert).close();
    }
  }, 6000);
});

document.querySelectorAll("[data-confirm]").forEach((element) => {
  element.addEventListener("click", (event) => {
    if (!window.confirm(element.dataset.confirm)) event.preventDefault();
  });
});
