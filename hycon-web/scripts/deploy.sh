#!/bin/bash

DIR="explorer.hycon.io/jabiru"

CMD=${1:?"requires an argument deploy | rollback" }

if [ $CMD != "deploy" ] && [ $CMD != "rollback" ] 
then
    echo "================== Error: give rollback or deploy  ==============="
    exit 1
fi

cp deploy_page.sh rollback_page.sh ../dist
cd ..
if [ $CMD == "deploy" ] 
then
	scp -r dist aws-hycon-web:$DIR/
	ssh aws-hycon-web  "cd $DIR/dist; sudo sh deploy_page.sh"
exit 0
fi

if [$CMD == "rollback"] 
then
	ssh aws-hycon-web "cd $DIR/dist; sudo sh rollback_page.sh"
exit 0
fi
