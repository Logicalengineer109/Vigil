#!/usr/bin/env python3
# PATCH TERRAFORM
# Auto-generated 2020

import sys
import json

def patch_terraform(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(patch_terraform({"input": "test"})))
