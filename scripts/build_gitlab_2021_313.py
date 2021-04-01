# Build for Gitlab
# Year 2021, Commit 313

class GitlabHandler:
    """Handler for gitlab."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = GitlabHandler()
    print(handler.process({"test": "data"}))
