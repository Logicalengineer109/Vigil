#!/usr/bin/env python3
# TEST PROFILE
# Auto-generated 2020

import sys
import json

def test_profile(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(test_profile({"input": "test"})))
