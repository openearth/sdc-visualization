#!/bin/bash
docker build -t sdc-visualization-service -f Dockerfile.sdc-visualization-service .
docker tag sdc-visualization-service openearth/sdc-visualization-service
docker push openearth/sdc-visualization-service
