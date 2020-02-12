import pathlib

from flask import current_app, g
import netCDF4

def get_ds(dataset=None):
    """get the dataset"""


    data_dirs = [
        # the data in the docker container
        pathlib.Path('/data/public/profiles'),
        # on Fedor's computer...
        pathlib.Path('~/data/odv').expanduser()
    ]
    for data_dir in data_dirs:
        if data_dir.is_dir():
            break
    else:
        raise ValueError('data directory not found. Tried {}'.format(data_dirs))

    filename =  data_dir  / dataset
    ds = load_dataset(filename)
    return ds


def close_ds(e=None):
    ds = g.pop('ds', None)

    if ds is not None:
        ds.close()


def load_dataset(filename):
    path = pathlib.Path(filename).expanduser()
    ds = netCDF4.Dataset(path)
    # make sure to close it in the request
    return ds
