# Patch for Serialization
# Year 2021, Commit 287

class SerializationHandler:
    """Handler for serialization."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = SerializationHandler()
    print(handler.process({"test": "data"}))
