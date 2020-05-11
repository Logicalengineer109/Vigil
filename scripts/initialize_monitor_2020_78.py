#!/usr/bin/env python3
# INITIALIZE MONITOR
# Auto-generated 2020

import sys
import json

def initialize_monitor(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(initialize_monitor({"input": "test"})))
