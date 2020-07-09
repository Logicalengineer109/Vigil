#!/usr/bin/env python3
# SETUP PROFILE
# Auto-generated 2020

import sys
import json

def setup_profile(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(setup_profile({"input": "test"})))
