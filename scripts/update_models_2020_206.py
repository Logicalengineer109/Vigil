# models update
# 2020

class ModelsProcessor:
    def __init__(self, year=2020):
        self.year = year
        self.results = []

    def execute(self):
        self.results.append({"year": self.year, "status": "complete"})
        return self.results

processor = ModelsProcessor()
print(processor.execute())
