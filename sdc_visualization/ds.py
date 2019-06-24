import pathlib

from flask import current_app, g
import netCDF4

def get_ds():
    """get the dataset"""

    if hasattr(current_app, 'filename'):
        filename = current_app.filename

    # overwrite  with default
    # TODO: get rid of this
    if pathlib.Path('app').exists():
        filename = 'app/data/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
    else:
        filename = 'data/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
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
