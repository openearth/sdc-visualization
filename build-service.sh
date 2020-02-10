#!/bin/bash
datestr=$(date '+%Y-%m-%dT%H%M')
echo building container build-${datestr}
docker build -t sdc-visualization-service -f Dockerfile.sdc-visualization-service .

# Push to dockerhub
docker tag sdc-visualization-service openearth/sdc-visualization-service:build-${datestr}
docker push openearth/sdc-visualization-service:build-${datestr}

# Push to greece
docker tag sdc-visualization-service registry-sdc.argo.grnet.gr/sdc-visualization-service:build-${datestr}
docker push registry-sdc.argo.grnet.gr/sdc-visualization-static:build-${datestr}
