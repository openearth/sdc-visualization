FROM nginx
LABEL maintainer="Cindy.vandeVriesSafaviNic@deltares.nl"
USER root

# update system and install dependencies

RUN apt-get update && \
    apt-get install davfs2 --yes


COPY dist /usr/share/nginx/html

# Expose http port
EXPOSE 80
# Allow user to overwrite the html, logs and configuration
VOLUME /usr/share/nginx/html
VOLUME /etc/nginx
VOLUME /var/log/nginx/log
