#!/bin/bash
datestr=$(date '+%Y-%m-%dT%H%M')

# This assumes you have ran `npm install` in sdc-static

# Build the webservice
pushd sdc-static
npm run build
popd

# Put it in a docker container
docker build -t sdc-visualization-static -f Dockerfile.sdc-visualization-static .
