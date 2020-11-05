# Update for Api
# Year 2020, Commit 195

class ApiHandler:
    """Handler for api."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = ApiHandler()
    print(handler.process({"test": "data"}))
