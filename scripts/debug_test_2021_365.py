#!/usr/bin/env python3
# DEBUG TEST
# Auto-generated 2021

import sys
import json

def debug_test(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(debug_test({"input": "test"})))
