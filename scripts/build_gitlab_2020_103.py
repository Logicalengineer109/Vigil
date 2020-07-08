#!/usr/bin/env python3
# BUILD GITLAB
# Auto-generated 2020

import sys
import json

def build_gitlab(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(build_gitlab({"input": "test"})))
