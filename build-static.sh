#!/bin/bash
docker build -t sdc-visualization-static -f Dockerfile.sdc-visualization-static .
docker tag sdc-visualization-static openearth/sdc-visualization-static
docker push openearth/sdc-visualization-static
