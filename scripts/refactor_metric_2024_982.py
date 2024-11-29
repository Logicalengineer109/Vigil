# Refactor for Metric
# Year 2024, Commit 982

class MetricHandler:
    """Handler for metric."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = MetricHandler()
    print(handler.process({"test": "data"}))
