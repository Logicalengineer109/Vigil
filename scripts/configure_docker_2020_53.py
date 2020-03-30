# Configure for Docker
# Year 2020, Commit 53

class DockerHandler:
    """Handler for docker."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = DockerHandler()
    print(handler.process({"test": "data"}))
