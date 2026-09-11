from fastapi import Request
from fastapi.responses import JSONResponse


def register_exception_handlers(app):
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(status_code=422, content={'type': 'about:blank', 'title': 'Validation Error', 'status': 422, 'detail': str(exc)})

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=500, content={'type': 'about:blank', 'title': 'AI Engine Error', 'status': 500, 'detail': 'The planning operation failed safely'})
