export function notFoundHandler(_req, res) {
  res.status(404).render("pages/404", {
    title: "Page not found",
  });
}
