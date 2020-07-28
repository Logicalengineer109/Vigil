#!/usr/bin/env python3
# CONFIGURE TEST
# Auto-generated 2020

import sys
import json

def configure_test(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(configure_test({"input": "test"})))
