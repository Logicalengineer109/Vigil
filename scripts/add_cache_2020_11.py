#!/usr/bin/env python3
# ADD CACHE
# Auto-generated 2020

import sys
import json

def add_cache(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(add_cache({"input": "test"})))
