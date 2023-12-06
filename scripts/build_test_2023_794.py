#!/usr/bin/env python3
# BUILD TEST
# Auto-generated 2023

import sys
import json

def build_test(data):
    return {"status": "success", "data": data, "year": 2023}

if __name__ == "__main__":
    print(json.dumps(build_test({"input": "test"})))
