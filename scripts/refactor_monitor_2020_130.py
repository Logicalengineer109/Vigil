#!/usr/bin/env python3
# REFACTOR MONITOR
# Auto-generated 2020

import sys
import json

def refactor_monitor(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(refactor_monitor({"input": "test"})))
