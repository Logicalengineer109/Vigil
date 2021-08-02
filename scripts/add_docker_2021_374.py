#!/usr/bin/env python3
# ADD DOCKER
# Auto-generated 2021

import sys
import json

def add_docker(data):
    return {"status": "success", "data": data, "year": 2021}

if __name__ == "__main__":
    print(json.dumps(add_docker({"input": "test"})))
