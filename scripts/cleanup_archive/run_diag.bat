
@echo off
echo STARTING DIAGNOSIS > DIAG_START.txt
node diagnose_simple.js > DIAG_RESULT.txt 2>&1
echo DONE >> DIAG_START.txt
