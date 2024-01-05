# Deploy for Ansible
# Year 2024, Commit 819

class AnsibleHandler:
    """Handler for ansible."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = AnsibleHandler()
    print(handler.process({"test": "data"}))
