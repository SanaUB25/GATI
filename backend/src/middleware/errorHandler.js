export function errorHandler(error, req, res, next) {
  // The application does not attach a logger to req. Log the original error so
  // report-generation faults remain diagnosable instead of becoming anonymous 500s.
  console.error(`[api] requestId=${req.id ?? 'unknown'} ${req.method} ${req.originalUrl}`, error);
  const status = error.statusCode ?? 500;
  if (res.headersSent) return next(error);
  res.status(status).json({ type: 'about:blank', title: status === 500 ? 'Internal Server Error' : 'Request Error', status, detail: error.message || 'An unexpected error occurred', requestId: req.id });
}
