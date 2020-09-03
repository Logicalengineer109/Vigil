# Stabilize for Worker
# Year 2020, Commit 155

class WorkerHandler:
    """Handler for worker."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = WorkerHandler()
    print(handler.process({"test": "data"}))
