#!/bin/bash
datestr=$(date '+%Y-%m-%dT%H%M')

# Push to dockerhub
docker tag sdc-visualization-static openearth/sdc-visualization-static:build-${datestr}
docker push openearth/sdc-visualization-static:build-${datestr}

docker tag sdc-visualization-static openearth/sdc-visualization-static
docker push openearth/sdc-visualization-static

# Push to greece
docker tag sdc-visualization-static registry-sdc.argo.grnet.gr/sdc-visualization-static:build-${datestr}
docker push registry-sdc.argo.grnet.gr/sdc-visualization-static:build-${datestr}

docker tag sdc-visualization-static registry-sdc.argo.grnet.gr/sdc-visualization-static
docker push registry-sdc.argo.grnet.gr/sdc-visualization-static
