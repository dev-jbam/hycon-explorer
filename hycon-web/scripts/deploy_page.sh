#!/bin/bash

SRC_DIR="/var/www/explorer.hycon.io"
FILES="bundle.js* styles.css* index.html hycon-logo.png"
DATE=$(date '+%Y%m%d%H%M%S')
NEW_VERSION="version_$DATE"

DIR=$(pwd)
mkdir -p ../$NEW_VERSION
cp $FILES ../$NEW_VERSION
mkdir -p $SRC_DIR/prev
cd $SRC_DIR
sudo cp $FILES ./prev/
cd $DIR/../$NEW_VERSION
sudo cp $FILES $SRC_DIR/

