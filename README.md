# sdc-visualization
Visualizations of ODV files for SeaDataCloud

## build Docker container
`docker build -t deltares-jupyter:latest .`

## run Docker image on port 8888
`docker run -d -p 8888:8888 --name deltares-jupyter --privileged --cap-add SYS_ADMIN --device /dev/fuse  deltares-jupyter start-notebook.sh  --NotebookApp.token='sdc'`

## mount b2drop in the running Docker container, if needed
`docker exec -it deltares-jupyter bash /etc/init.d/mount-b2drop <B2DROP_APP_USERNAME> <B2DROP_APP_PASSWORD> https://b2drop.eudat.eu/remote.php/webdav/`

## Logging
Both the start-notebook and the b2drop script use logging to stdout. Both use configurable logging as defined in [b-log](https://github.com/idelsink/b-log) for bash in [python logging](https://docs.python.org/3.6/library/logging.html).
