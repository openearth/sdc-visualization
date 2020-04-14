#!/bin/bash
datestr=$(date '+%Y-%m-%dT%H%M')

#  build the  webservice
pushd sdc-static
npm run build
popd

docker build -t sdc-visualization-static -f Dockerfile.sdc-visualization-static .
