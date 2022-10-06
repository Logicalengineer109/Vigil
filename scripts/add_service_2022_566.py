#!/usr/bin/env python3
# ADD SERVICE
# Auto-generated 2022

import sys
import json

def add_service(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(add_service({"input": "test"})))
