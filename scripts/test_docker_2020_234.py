#!/usr/bin/env python3
# TEST DOCKER
# Auto-generated 2020

import sys
import json

def test_docker(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(test_docker({"input": "test"})))
