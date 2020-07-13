# Refactor for Jenkins
# Year 2020, Commit 115

class JenkinsHandler:
    """Handler for jenkins."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = JenkinsHandler()
    print(handler.process({"test": "data"}))
