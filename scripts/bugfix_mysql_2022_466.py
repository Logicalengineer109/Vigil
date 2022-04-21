# Bugfix for Mysql
# Year 2022, Commit 466

class MysqlHandler:
    """Handler for mysql."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = MysqlHandler()
    print(handler.process({"test": "data"}))
