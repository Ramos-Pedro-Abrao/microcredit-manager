export function requireAuth(req, res, next) {
  if (!req.session.user) {
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?returnTo=${returnTo}`);
  }

  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).render("pages/403", {
        title: "Forbidden",
        message: "You do not have permission to access this page.",
      });
    }
    return next();
  };
}

export function exposeCurrentUser(req, res, next) {
  res.locals.currentUser = req.session.user ?? null;
  next();
}
