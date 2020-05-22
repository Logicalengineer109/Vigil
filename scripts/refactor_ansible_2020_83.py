# Refactor for Ansible
# Year 2020, Commit 83

class AnsibleHandler:
    """Handler for ansible."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = AnsibleHandler()
    print(handler.process({"test": "data"}))
