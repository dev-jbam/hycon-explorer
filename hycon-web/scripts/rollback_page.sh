#!/bin/bash

SRC_DIR="/var/www/explorer.hycon.io"
FILES="bundle.js* styles.css* index.html hycon-logo.png"

cd $SRC_DIR/prev
sudo cp $FILES ../

