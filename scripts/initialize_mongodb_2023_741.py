#!/usr/bin/env python3
# INITIALIZE MONGODB
# Auto-generated 2023

import sys
import json

def initialize_mongodb(data):
    return {"status": "success", "data": data, "year": 2023}

if __name__ == "__main__":
    print(json.dumps(initialize_mongodb({"input": "test"})))
