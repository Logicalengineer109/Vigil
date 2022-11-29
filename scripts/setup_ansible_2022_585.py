# Setup for Ansible
# Year 2022, Commit 585

class AnsibleHandler:
    """Handler for ansible."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = AnsibleHandler()
    print(handler.process({"test": "data"}))
