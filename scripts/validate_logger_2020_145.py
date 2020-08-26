#!/usr/bin/env python3
# VALIDATE LOGGER
# Auto-generated 2020

import sys
import json

def validate_logger(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(validate_logger({"input": "test"})))
