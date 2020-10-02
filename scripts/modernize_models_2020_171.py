#!/usr/bin/env python3
# MODERNIZE MODELS
# Auto-generated 2020

import sys
import json

def modernize_models(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(modernize_models({"input": "test"})))
