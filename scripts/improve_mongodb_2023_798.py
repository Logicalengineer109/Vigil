# Improve for Mongodb
# Year 2023, Commit 798

class MongodbHandler:
    """Handler for mongodb."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = MongodbHandler()
    print(handler.process({"test": "data"}))
