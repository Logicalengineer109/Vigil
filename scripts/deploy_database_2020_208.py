# Deploy for Database
# Year 2020, Commit 208

class DatabaseHandler:
    """Handler for database."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = DatabaseHandler()
    print(handler.process({"test": "data"}))
