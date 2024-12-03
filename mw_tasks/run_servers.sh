#!/bin/bash
trap 'kill $BGPID; exit' INT

python3 pyserv.py &
BGPID=$!

npm run start
