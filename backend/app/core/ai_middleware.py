"""Transport bound before JSON parsing; no unbounded AI request buffering."""

from starlette.responses import JSONResponse


class AIBodyLimitMiddleware:
    def __init__(self, app, *, prefix, max_bytes=16384,
                 detail="La solicitud IA excede el límite de transporte", code="AI_BODY_LIMIT"):
        self.app, self.prefix, self.max_bytes = app, prefix, max_bytes
        self.detail, self.code = detail, code

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if scope["type"] != "http" or scope.get("method") not in {"POST", "PATCH"} or not (path == self.prefix or path.startswith(self.prefix+"/")):
            await self.app(scope, receive, send)
            return
        headers = dict(scope.get("headers", []))
        try:
            size = int(headers.get(b"content-length", b"0"))
        except ValueError:
            size = self.max_bytes+1
        async def reject():
            response = JSONResponse({"detail":self.detail, "code":self.code},
                status_code=413, headers={"Cache-Control":"private, no-store"})
            await response(scope, receive, send)
        if size > self.max_bytes:
            await reject()
            return
        chunks, length = [], 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            length += len(chunk)
            if length > self.max_bytes:
                await reject()
                return
            chunks.append(chunk)
            if not message.get("more_body", False):
                break
        replayed = False
        async def replay():
            nonlocal replayed
            if not replayed:
                replayed = True
                return {"type":"http.request", "body":b"".join(chunks), "more_body":False}
            return await receive()
        await self.app(scope, replay, send)
