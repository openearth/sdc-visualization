import pathlib
import logging

from flask import current_app, g
import netCDF4

logger = logging.getLogger(__name__)

def get_ds(dataset=None):
    """get the dataset"""


    data_dirs = [
        pathlib.Path('/data/public'),
        pathlib.Path('~/data/odv').expanduser(),
        pathlib.Path('app/data'),
        pathlib.Path('data')
    ]
    for data_dir in data_dirs:
        if data_dir.is_dir():
            logger.info('found  data in %s', data_dir)
            break
    else:
        raise ValueError('data directory not found. Tried {}'.format(data_dirs))

    if dataset is not None:
        filename =  data_dir  / dataset
    else:
        if hasattr(current_app, 'filename'):
            # TODO: where does this come from?
            filename = data_dir /  current_app.filename
        else:
            filename = data_dir  / 'data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
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
