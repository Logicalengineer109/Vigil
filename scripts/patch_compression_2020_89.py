#!/usr/bin/env python3
# PATCH COMPRESSION
# Auto-generated 2020

import sys
import json

def patch_compression(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(patch_compression({"input": "test"})))
