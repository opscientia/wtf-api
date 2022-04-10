#!/bin/bash
shopt -s expand_aliases
alias run_startup='node ./wtf-js/test/utils/runTestNode.js'
# alias run_tests='npx mocha test/test.js'

alias run_tests='npx mocha ./wtf-js/test/test.js'
export WTF_USE_TEST_CONTRACT_ADDRESSES=true

run_startup & 
startup_pid=$!
sleep 5 && 
run_tests & # && fg
mocha_pid=$!

sleep 7
kill -9 $(lsof -i :8545 -t)
