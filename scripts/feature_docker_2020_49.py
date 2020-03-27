#!/usr/bin/env python3
# FEATURE DOCKER
# Auto-generated 2020

import sys
import json

def feature_docker(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(feature_docker({"input": "test"})))
