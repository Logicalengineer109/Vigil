# Improve for Handler
# Year 2021, Commit 272

class HandlerHandler:
    """Handler for handler."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = HandlerHandler()
    print(handler.process({"test": "data"}))
