# redis setup
# 2021

class RedisProcessor:
    def __init__(self, year=2021):
        self.year = year
        self.results = []

    def execute(self):
        self.results.append({"year": self.year, "status": "complete"})
        return self.results

processor = RedisProcessor()
print(processor.execute())
