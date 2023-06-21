#!/usr/bin/env python3
# DEBUG COMPRESSION
# Auto-generated 2023

import sys
import json

def debug_compression(data):
    return {"status": "success", "data": data, "year": 2023}

if __name__ == "__main__":
    print(json.dumps(debug_compression({"input": "test"})))
