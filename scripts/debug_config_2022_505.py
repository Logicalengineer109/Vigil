#!/usr/bin/env python3
# DEBUG CONFIG
# Auto-generated 2022

import sys
import json

def debug_config(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(debug_config({"input": "test"})))
