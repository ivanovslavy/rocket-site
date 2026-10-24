#!/bin/bash
cd /home/slavy/rocket-site
npx vite preview --port 5210 --strictPort > /tmp/prev.log 2>&1 &
VPID=$!
for i in $(seq 1 25); do grep -q "Local:" /tmp/prev.log 2>/dev/null && break; sleep 1; done
node vfinal.mjs >> /tmp/vfinal.err 2>&1
kill $VPID 2>/dev/null
echo "TESTDONE" >> /tmp/vfinal.err
