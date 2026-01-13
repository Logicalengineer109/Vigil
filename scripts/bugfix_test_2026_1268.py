#!/usr/bin/env python3
# BUGFIX TEST
# Auto-generated 2026

import sys
import json

def bugfix_test(data):
    return {"status": "success", "data": data, "year": 2026}

if __name__ == "__main__":
    print(json.dumps(bugfix_test({"input": "test"})))
