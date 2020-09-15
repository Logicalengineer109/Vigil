#!/usr/bin/env python3
# TEST TRACE
# Auto-generated 2020

import sys
import json

def test_trace(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(test_trace({"input": "test"})))
