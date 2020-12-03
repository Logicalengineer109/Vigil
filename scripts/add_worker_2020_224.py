#!/usr/bin/env python3
# ADD WORKER
# Auto-generated 2020

import sys
import json

def add_worker(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(add_worker({"input": "test"})))
