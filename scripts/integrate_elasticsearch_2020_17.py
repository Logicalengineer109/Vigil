# Integrate for Elasticsearch
# Year 2020, Commit 17

class ElasticsearchHandler:
    """Handler for elasticsearch."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = ElasticsearchHandler()
    print(handler.process({"test": "data"}))
