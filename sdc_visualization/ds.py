import pathlib

from flask import current_app, g
import netCDF4

def get_ds():
    """get the dataset"""
    if not hasattr(current_app, 'filename'):
        return None
    if 'ds' not in g:
        g.ds = load_dataset(current_app.filename)

    return g.ds


def close_ds(e=None):
    ds = g.pop('ds', None)

    if ds is not None:
        ds.close()


def load_dataset(filename):
    path = pathlib.Path(filename).expanduser()
    ds = netCDF4.Dataset(path)
    return ds
