#!/usr/bin/env python3
# UPDATE MIDDLEWARE
# Auto-generated 2021

import sys
import json

def update_middleware(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(update_middleware({"input": "test"})))
