# Debug for Redis
# Year 2023, Commit 766

class RedisHandler:
    """Handler for redis."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = RedisHandler()
    print(handler.process({"test": "data"}))
