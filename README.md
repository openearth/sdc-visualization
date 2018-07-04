# SeaDataCloud visualizations

[![pypi](https://img.shields.io/pypi/v/sdc_visualization.svg)](https://pypi.python.org/pypi/sdc_visualization)

[![travis](https://img.shields.io/travis/SiggyF/sdc_visualization.svg)](https://travis-ci.org/SiggyF/sdc_visualization)
[![docs](https://readthedocs.org/projects/sdc-visualization/badge/?version=latest)](https://sdc-visualization.readthedocs.io/en/latest/?badge=latest)
[![pyup](https://pyup.io/repos/github/SiggyF/sdc_visualization/shield.svg)](https://pyup.io/repos/github/SiggyF/sdc_visualization/)


Visualisation tools and services for SeaDataCloud


* Free software: GNU General Public License v3
* Documentation: https://sdc-visualization.readthedocs.io.


# Features

Visualizations of ODV files for SeaDataCloud

## build Docker container
`docker build -t deltares-jupyter:latest .`

## run Docker image on port 8888
`docker run -d -p 8888:8888 --name deltares-jupyter --privileged --cap-add SYS_ADMIN --device /dev/fuse  deltares-jupyter start-notebook.sh  --NotebookApp.token='sdc'`

## mount b2drop in the running Docker container, if needed
`docker exec -it deltares-jupyter bash /etc/init.d/mount-b2drop <B2DROP_APP_USERNAME> <B2DROP_APP_PASSWORD> https://b2drop.eudat.eu/remote.php/webdav/`

## Logging
Both the start-notebook and the b2drop script use logging to stdout. Both use configurable logging as defined in [b-log](https://github.com/idelsink/b-log) for bash in [python logging](https://docs.python.org/3.6/library/logging.html).

# Credits


This package was created with [Cookiecutter](https://github.com/audreyr/cookiecutter) and the [`audreyr/cookiecutter-pypackage`](https://github.com/audreyr/cookiecutter-pypackage) project template.

