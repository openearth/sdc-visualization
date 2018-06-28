# sdc-visualization
Visualizations of ODV files for SeaDataCloud

## build Docker container
`docker build -t deltares-jupyter:latest .`

## run Docker image on port 8888
`docker run -d -p 8888:8888 --name deltares-jupyter --privileged --cap-add SYS_ADMIN --device /dev/fuse  deltares-jupyter start-notebook.sh  --NotebookApp.token='sdc'`

## mount b2drop in the running Docker container, if needed
`docker exec -it deltares-jupyter bash /etc/init.d/mount-b2drop <B2DROP_APP_USERNAME> <B2DROP_APP_PASSWORD> https://b2drop.eudat.eu/remote.php/webdav/`
