FROM jupyter/minimal-notebook

USER root

ENV PATH="/etc/init.d:${PATH}"

COPY requirements.txt Visualizing_ODV.ipynb ./work/
COPY start.sh /etc/init.d/

RUN pip install -r ./work/requirements.txt
RUN rm ./work/requirements.txt
RUN apt-get update
RUN apt-get install davfs2 --yes
