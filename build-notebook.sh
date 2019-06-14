#!/bin/bash
docker build -t sdc-visualization-notebook -f Dockerfile.sdc-visualization-notebook .
docker tag sdc-visualization-notebook openearth/sdc-visualization-notebook
docker push openearth/sdc-visualization-notebook
