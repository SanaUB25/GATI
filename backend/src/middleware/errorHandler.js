export function errorHandler(error, req, res, next) {
  req.log?.error?.(error);
  const status = error.statusCode ?? 500;
  res.status(status).json({ type: 'about:blank', title: status === 500 ? 'Internal Server Error' : 'Request Error', status, detail: status === 500 ? 'An unexpected error occurred' : error.message });
}
