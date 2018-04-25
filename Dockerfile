FROM jupyter/minimal-notebook

USER root

ENV PATH="/etc/init.d:${PATH}"

COPY requirements.txt notebooks/*.ipynb ./work/
COPY start.sh /etc/init.d/

RUN pip install -r ./work/requirements.txt && \
	rm ./work/requirements.txt && \
	apt-get update && \
	apt-get install davfs2 --yes && \
	chmod a+w ./work/*.ipynb
