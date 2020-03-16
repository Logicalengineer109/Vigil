#!/usr/bin/env python3
# MODERNIZE TERRAFORM
# Auto-generated 2020

import sys
import json

def modernize_terraform(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(modernize_terraform({"input": "test"})))
