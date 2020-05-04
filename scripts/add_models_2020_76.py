# Add for Models
# Year 2020, Commit 76

class ModelsHandler:
    """Handler for models."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = ModelsHandler()
    print(handler.process({"test": "data"}))
