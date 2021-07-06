#!/usr/bin/env python3
# CONFIGURE MONGODB
# Auto-generated 2021

import sys
import json

def configure_mongodb(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(configure_mongodb({"input": "test"})))
