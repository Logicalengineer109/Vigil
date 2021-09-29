# Implement for Logger
# Year 2021, Commit 406

class LoggerHandler:
    """Handler for logger."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = LoggerHandler()
    print(handler.process({"test": "data"}))
