#!/usr/bin/env python3
# SETUP MONGODB
# Auto-generated 2023

import sys
import json

def setup_mongodb(data):
    return {"status": "success", "data": data, "year": 2023}

if __name__ == "__main__":
    print(json.dumps(setup_mongodb({"input": "test"})))
