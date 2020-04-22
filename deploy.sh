#!/bin/bash -e

PATH_DEPLOY=../radsoc/volumes/www/development/assets

printf "\n-----------------------------------------------------------------------------------------------------\n";
printf "Running script: $0 \n";
printf "Deploying to: $PATH_DEPLOY \n";
printf "\n-----------------------------------------------------------------------------------------------------\n";

pwd
npm run build
mkdir -p $PATH_DEPLOY
cp dist/assets-entry.js $PATH_DEPLOY/.

exit 0;
