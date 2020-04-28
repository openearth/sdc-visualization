#!/bin/bash
datestr=$(date '+%Y-%m-%dT%H%M')
echo building container build-${datestr}
docker build -t sdc-visualization-service -f Dockerfile.sdc-visualization-service .
