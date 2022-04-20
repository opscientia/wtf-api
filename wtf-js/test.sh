#!/bin/bash
shopt -s expand_aliases
alias run_startup='node ./wtf-js/test/utils/runTestNode.js'

alias run_tests_w_hardhat='npx mocha ./wtf-js/test/testWithHardhat.js'
export WTF_USE_TEST_CONTRACT_ADDRESSES=true

run_startup & 
startup_pid=$!
sleep 5 && 
run_tests_w_hardhat & # && fg
mocha_pid=$!

sleep 7
kill -9 $(lsof -i :8545 -t)

export WTF_USE_TEST_CONTRACT_ADDRESSES=false
alias run_tests_w_out_hardhat='npx mocha ./wtf-js/test/testWithoutHardhat.js'
run_tests_w_out_hardhat
