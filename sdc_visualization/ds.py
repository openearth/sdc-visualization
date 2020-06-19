import pathlib
import logging

from flask import current_app, g
import netCDF4

def get_ds(dataset=None):
    """get the dataset"""
    data_dirs = [
        # the data in the docker container
        pathlib.Path('/data/public/profiles'),
        pathlib.Path('/data/public'),
        # on Fedor's computer...
        pathlib.Path('~/data/odv/public/profiles').expanduser()
    ]
    for data_dir in data_dirs:
        if data_dir.is_dir():
            break
        elif data_dir == data_dirs[-1]:
            raise ValueError('data directory not found. Tried {}'.format(data_dirs))

    if dataset is not None:
        filename =  data_dir  / dataset
    else:
        if hasattr(current_app, 'dataset'):
            # TODO: where does this come from?
            filename = data_dir /  current_app.dataset
        else:
            filename = data_dir  / 'data_from_SDN_2015-09_TS_MedSea_QC_done_v2.nc'

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
