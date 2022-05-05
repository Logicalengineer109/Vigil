#!/usr/bin/env python3
# INITIALIZE MONITOR
# Auto-generated 2022

import sys
import json

def initialize_monitor(data):
    return {"status": "success", "data": data, "year": 2022}

if __name__ == "__main__":
    print(json.dumps(initialize_monitor({"input": "test"})))
