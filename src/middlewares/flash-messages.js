export function flashMessages(req, res, next) {
  const storedMessages = req.session.flashMessages ?? [];
  delete req.session.flashMessages;

  res.locals.flashMessages = storedMessages;
  req.flash = (type, message) => {
    req.session.flashMessages ??= [];
    req.session.flashMessages.push({ type, message });
  };

  next();
}
