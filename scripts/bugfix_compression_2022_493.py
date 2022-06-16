#!/usr/bin/env python3
# BUGFIX COMPRESSION
# Auto-generated 2022

import sys
import json

def bugfix_compression(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(bugfix_compression({"input": "test"})))
