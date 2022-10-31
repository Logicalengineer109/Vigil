#!/usr/bin/env python3
# DEBUG LOGGER
# Auto-generated 2022

import sys
import json

def debug_logger(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(debug_logger({"input": "test"})))
