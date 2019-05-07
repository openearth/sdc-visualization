#!/bin/bash
docker build -t sdc-visualization-service -f Dockerfile.sdc-visualization-service .
docker build -t sdc-visualization-static -f Dockerfile.sdc-visualization-static .
docker build -t sdc-visualization-notebook -f Dockerfile.sdc-visualization-notebook .

docker tag sdc-visualization-service openearth/sdc-visualization-service
docker tag sdc-visualization-static openearth/sdc-visualization-static
docker tag sdc-visualization-notebook openearth/sdc-visualization-notebook

docker push openearth/sdc-visualization-service
docker push openearth/sdc-visualization-static
docker push openearth/sdc-visualization-notebook

# docker tag sdc-visualization-service registry-sdc.argo.grnet.gr/sdc-visualization-service:devel
# docker tag sdc-visualization-static registry-sdc.argo.grnet.gr/sdc-visualization-static:devel
# docker tag sdc-visualization-notebook registry-sdc.argo.grnet.gr/sdc-visualization-notebook:devel
# docker push registry-sdc.argo.grnet.gr/sdc-visualization-service:devel
# docker push registry-sdc.argo.grnet.gr/sdc-visualization-static:devel
# docker push registry-sdc.argo.grnet.gr/sdc-visualization-notebook:devel
