#!/usr/bin/env python3
# ADD JENKINS
# Auto-generated 2020

import sys
import json

def add_jenkins(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(add_jenkins({"input": "test"})))
