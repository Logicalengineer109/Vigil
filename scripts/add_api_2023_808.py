#!/usr/bin/env python3
# ADD API
# Auto-generated 2023

import sys
import json

def add_api(data):
    return {"status": "success", "data": data, "year": 2023}

if __name__ == "__main__":
    print(json.dumps(add_api({"input": "test"})))
