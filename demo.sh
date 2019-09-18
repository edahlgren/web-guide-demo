#!/bin/bash

CWD=$(pwd)

rm -rf ~/docs-format-demo/snippets/commands
rm -rf ~/docs-format-demo/snippets/specs

cd ~/demo-mag-cli
node index.js docs --make \
     --demofile example/shared/demo.yml \
     --out ~/docs-format-demo/snippets

rm -rf ~/docs-format-demo/static/command
rm -rf ~/docs-format-demo/static/spec

cd ~/docs-format-demo
node index.js --config config.yml --out static

cd $CWD
