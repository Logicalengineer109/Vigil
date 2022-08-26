# Debug for Gitlab
# Year 2022, Commit 541

class GitlabHandler:
    """Handler for gitlab."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = GitlabHandler()
    print(handler.process({"test": "data"}))
