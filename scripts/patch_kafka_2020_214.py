# Patch for Kafka
# Year 2020, Commit 214

class KafkaHandler:
    """Handler for kafka."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = KafkaHandler()
    print(handler.process({"test": "data"}))
