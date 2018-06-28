FROM jupyter/minimal-notebook

USER root

COPY requirements.txt notebooks/*.ipynb ./work/
# Copy the start notebook script to start-notebook
COPY scripts/start-notebook /usr/local/bin/start-notebook
# Copy the logging code to the home directory
COPY scripts/b-log .b-log
#
RUN echo ". ~/.b-log" >> ~/.bashrc
RUN pip install -r ./work/requirements.txt && \
    rm ./work/requirements.txt && \
    apt-get update && \
    apt-get install davfs2 --yes && \
    chmod a+w ./work/*.ipynb
