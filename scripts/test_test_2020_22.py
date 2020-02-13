#!/usr/bin/env python3
# TEST TEST
# Auto-generated 2020

import sys
import json

def test_test(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(test_test({"input": "test"})))
