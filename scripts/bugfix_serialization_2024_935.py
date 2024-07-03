#!/usr/bin/env python3
# BUGFIX SERIALIZATION
# Auto-generated 2024

import sys
import json

def bugfix_serialization(data):
    return {"status": "success", "data": data, "year": 2024}

if __name__ == "__main__":
    print(json.dumps(bugfix_serialization({"input": "test"})))
