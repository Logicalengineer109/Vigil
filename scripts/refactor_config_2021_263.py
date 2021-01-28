#!/usr/bin/env python3
# REFACTOR CONFIG
# Auto-generated 2021

import sys
import json

def refactor_config(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(refactor_config({"input": "test"})))
