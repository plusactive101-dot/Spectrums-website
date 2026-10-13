#!/bin/bash
# Auto-deploy script for spectrums.nft via Pinata IPFS
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkZjk5M2U2MS04NTBhLTRmNjgtYjFlMy1iMmYwOWZhZTAyNjMiLCJlbWFpbCI6InBsdXMuYWN0aXZlMTAxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIwNjM3ZTEyNTE3OGRjNTM0MmZmZCIsInNjb3BlZEtleVNlY3JldCI6IjViYTBiODYzZDRhNDFjNDBjNTNmYTExYTc5Mjk1ZTcxZWRiYzc5YjFhZDYwOGUwMWYxZGM0OGFhMDZkOWJkYjciLCJleHAiOjE4MjM0MDgxMzh9.T590PZL1tNcdQi4sj3SOu3JgI847ueWYOPaKvdwtFdQ"

echo "Deploying spectrums.nft website to IPFS..."
python3 - <<EOF
import os, json, requests

jwt = "$JWT"
headers = {'Authorization': f'Bearer {jwt}'}

files = [
    ('file', ('site/index.html', open('$DIR/index.html', 'rb'))),
    ('file', ('site/app.js', open('$DIR/app.js', 'rb')))
]

metadata = {
    'name': f'spectrums.nft-{int(os.path.getmtime("$DIR/index.html"))}',
    'keyvalues': {'domain': 'spectrums.nft'}
}

options = {
    'cidVersion': 0,
    'wrapWithDirectory': False
}

data = {
    'pinataMetadata': json.dumps(metadata),
    'pinataOptions': json.dumps(options)
}

res = requests.post('https://api.pinata.cloud/pinning/pinFileToIPFS', headers=headers, files=files, data=data)
if res.status_code == 200:
    cid = res.json().get('IpfsHash')
    print("\nSUCCESS! New IPFS Hash:")
    print(cid)
else:
    print("Error:", res.status_code, res.text)
    exit(1)
EOF
