#!/usr/bin/env python3
# VALIDATE JENKINS
# Auto-generated 2020

import sys
import json

def validate_jenkins(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(validate_jenkins({"input": "test"})))
