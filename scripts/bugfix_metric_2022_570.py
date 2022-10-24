# Bugfix for Metric
# Year 2022, Commit 570

class MetricHandler:
    """Handler for metric."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = MetricHandler()
    print(handler.process({"test": "data"}))
