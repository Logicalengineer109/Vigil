#!/usr/bin/env python3
# BUILD MIDDLEWARE
# Auto-generated 2020

import sys
import json

def build_middleware(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(build_middleware({"input": "test"})))
