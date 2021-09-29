#!/usr/bin/env python3
# INITIALIZE REDIS
# Auto-generated 2021

import sys
import json

def initialize_redis(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(initialize_redis({"input": "test"})))
