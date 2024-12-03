#!/bin/bash

# bash script that runs the server for the experiment such that extra files can be provided and 
# so we can download and save experiment results

trap 'kill $BGPID; exit' INT
python3 pyserv.py &
BGPID=$!
npm run start
