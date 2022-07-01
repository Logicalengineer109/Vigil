#!/usr/bin/env python3
# TEST REDIS
# Auto-generated 2022

import sys
import json

def test_redis(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(test_redis({"input": "test"})))
