export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ type: 'about:blank', title: 'Forbidden', status: 403, detail: 'The current role cannot perform this action' });
    next();
  };
}
