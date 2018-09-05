FROM jupyter/minimal-notebook
LABEL maintainer="Cindy.vandeVriesSafaviNic@deltares.nl"
USER root

# update system and install dependencies
RUN apt-get update && \
    apt-get install davfs2 --yes

COPY notebooks/*.ipynb ./work/
COPY . ./src/
# Copy the mount command to the proper directory
COPY scripts/mount-b2drop /etc/init.d/mount-b2drop
# Copy the logging code to the home directory
COPY scripts/b-log .b-log

RUN echo ". ~/.b-log" >> ~/.bashrc
RUN pip install -r ./src/requirements.txt && \
    chmod a+w ./work/*.ipynb
RUN pip install -e ./src

# create configuration and overwrite with custom logging
RUN jupyter notebook --generate-config
RUN chmod 755 .jupyter
COPY notebooks/jupyter_notebook_config.py .jupyter

CMD echo 'starting notebook with token sdc' && start-notebook.sh --NotebookApp.token='sdc'
