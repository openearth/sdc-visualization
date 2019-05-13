import pathlib

from flask import current_app, g
import netCDF4

def get_ds():
    """get the dataset"""
    if not hasattr(current_app, 'filename'):
        return None

    ds = load_dataset(current_app.filename)

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
