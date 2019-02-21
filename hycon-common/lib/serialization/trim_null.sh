#!/bin/bash 

sed -i -e 's/?: [(]\(.*\)\s*[|]\s*null[)]/?: \1/g' lib/serialization/proto.d.ts
