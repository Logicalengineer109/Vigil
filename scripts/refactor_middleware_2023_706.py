# Refactor for Middleware
# Year 2023, Commit 706

class MiddlewareHandler:
    """Handler for middleware."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = MiddlewareHandler()
    print(handler.process({"test": "data"}))
