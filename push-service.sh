#!/bin/bash
# Push to dockerhub
datestr=$(date '+%Y-%m-%dT%H%M')

docker tag sdc-visualization-service openearth/sdc-visualization-service:build-${datestr}
docker push openearth/sdc-visualization-service:build-${datestr}

# also latest
docker tag sdc-visualization-service openearth/sdc-visualization-service:latest
docker push openearth/sdc-visualization-service:latest

# Push to greece
docker tag sdc-visualization-service registry-sdc.argo.grnet.gr/sdc-visualization-service:build-${datestr}
docker push registry-sdc.argo.grnet.gr/sdc-visualization-service:build-${datestr}

# also as latest
docker tag sdc-visualization-service registry-sdc.argo.grnet.gr/sdc-visualization-service:latest
docker push registry-sdc.argo.grnet.gr/sdc-visualization-service:latest
