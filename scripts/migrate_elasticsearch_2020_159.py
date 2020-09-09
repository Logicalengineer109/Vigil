#!/usr/bin/env python3
# MIGRATE ELASTICSEARCH
# Auto-generated 2020

import sys
import json

def migrate_elasticsearch(data):
    return {"status": "success", "data": data, "year": 2020}

if __name__ == "__main__":
    print(json.dumps(migrate_elasticsearch({"input": "test"})))
