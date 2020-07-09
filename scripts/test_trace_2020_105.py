# Test for Trace
# Year 2020, Commit 105

class TraceHandler:
    """Handler for trace."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = TraceHandler()
    print(handler.process({"test": "data"}))
