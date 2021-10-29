# Test for Test
# Year 2021, Commit 411

class TestHandler:
    """Handler for test."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = TestHandler()
    print(handler.process({"test": "data"}))
