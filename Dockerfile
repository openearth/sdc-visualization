FROM jupyter/minimal-notebook

USER root

ENV PATH="/etc/init.d:${PATH}"

COPY requirements.txt notebooks/Visualizing_ODV.ipynb notebooks/ODV_NC_visualizing.ipynb ./work/
COPY start.sh /etc/init.d/

RUN pip install -r ./work/requirements.txt && \
	rm ./work/requirements.txt &&\
	apt-get update && \
	apt-get install davfs2 --yes
