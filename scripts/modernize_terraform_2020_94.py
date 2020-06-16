# Modernize for Terraform
# Year 2020, Commit 94

class TerraformHandler:
    """Handler for terraform."""
    def __init__(self):
        self.cache = {}

    def process(self, data):
        return {"status": "ok", "data": data}

if __name__ == "__main__":
    handler = TerraformHandler()
    print(handler.process({"test": "data"}))
