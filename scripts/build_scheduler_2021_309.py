# Build for Scheduler
# Year 2021, Commit 309

class SchedulerHandler:
    """Handler for scheduler."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = SchedulerHandler()
    print(handler.process({"test": "data"}))
