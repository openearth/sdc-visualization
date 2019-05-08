"""Create a visualization server."""

import datetime
import time
import logging

import netCDF4
import numpy as np
import geojson

from flask import Blueprint, Flask, jsonify, current_app, request, g
from flask_cors import CORS, cross_origin

from sdc_visualization.ds import get_ds, close_ds

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

blueprint = Blueprint('public', __name__, static_folder='../static')
CORS(blueprint)


def antimeridian_cut(lon):
    """longitudes > 180 -> -360"""
    return np.mod(np.array(lon) + 180, 360) - 180


@blueprint.route('/', methods=['GET', 'POST'])
@cross_origin()
def home():
    """Home page."""
    return 'home'


@blueprint.route('/api/dataset', methods=['GET', 'POST'])
@cross_origin()
def dataset():
    """Return dataset metadata."""
    # get the dataset from the current app
    ds = get_ds()
    logger.info('opened %s', ds)
    if ds is None:
        resp = {
            "_comment": "no data loaded"
        }
        return jsonify(resp)
    # this can be a bit slow
    date_nums = ds.variables['date_time'][:]

    def ensure_datetime(maybe_datetime):
        """sometimes < 1582 we get netCDF4 datetimes which have an explicit Gregorian calendar"""

        if hasattr(maybe_datetime, '_to_real_datetime'):
            date = maybe_datetime._to_real_datetime()
        else:
            date = maybe_datetime

        return date
    print(ds.variables['date_time'])
    # if we have an actual range, use that
    try:
        times = netCDF4.num2date(
            ds.variables['date_time'].valid_range,
            ds.variables['date_time'].units
        )
    except AttributeError:
        # use datenums
        times = netCDF4.num2date(
            [date_nums.min(), date_nums.max()],
            ds.variables['date_time'].units
        )

    if times[0].year < 1970:
        times[0] = datetime.datetime(1970, 1, 1)
    resp = {
        "name": ds.filepath(),
        "variables": list(ds.variables.keys()),
        "time_extent": [
            ensure_datetime(times[0]).isoformat(),
            ensure_datetime(times[-1]).isoformat()
        ]
    }
    ds.close()
    return jsonify(resp)


@blueprint.route('/api/extent', methods=['GET', 'POST'])
@cross_origin()
def extent():
    """Return dataset extent."""
    # get the dataset from the current app
    ds = get_ds()
    if ds is None:
        return jsonify({
            'error': 'data not loaded'
        })

    # ensure that our array is always masked
    date_time = np.ma.masked_array(
        ds.variables['date_time'][:]
    )

    t_ini = netCDF4.num2date(
        np.min(date_time[:]),
        ds.variables['date_time'].units
    )
    t_fin = netCDF4.num2date(
        np.max(date_time[:]),
        ds.variables['date_time'].units
    )

    resp = [t_ini.year, t_fin.year]
    ds.close()
    return jsonify(resp)


@blueprint.route('/api/load', methods=['POST'])
@cross_origin()
def load():
    # TODO: validate filename further, otherwise we might load any file
    req_data = request.get_json()
    filename = req_data.get('filename')
    resp = {"loaded": False}
    if not filename.endswith('.nc'):
        resp["error"] = "filename does not end in .nc"
    # add the dataset to the loaded app
    # perhaps use flask.g, but that did not work
    current_app.filename = filename
    ds = get_ds()
    resp["loaded"] = True
    ds.close()
    return jsonify(resp)


@blueprint.route('/api/get_timeseries', methods=['GET', 'POST'])
@cross_origin()
def get_timeseries():
    """Return timeseries for point data"""
    lon_e = float(request.values.get("lon", 0))
    lat_e = float(request.values.get("lat", 0))

    """
    read some variables and return an open file handle,
    based on data selection.
    """
    ds = get_ds()
    if ds is None:
        return jsonify({
            'error': 'data not loaded'
        })

    if 'lat' in ds.variables:
        lat = ds['lat'][:]
    elif 'latitude' in ds.variables:
        lat = ds['latitude'][:]
    if 'lon' in ds.variables:
        lon = ds['lon'][:]
    elif 'longitude' in ds.variables:
        lon = ds['longitude'][:]

    ind = np.argmin( np.abs(np.sqrt((lat - lat_e)**2 + (lon - lon_e)**2)))

    data = ds.variables['var2'][ind][:].data

    ds.close()

    # TODO: read timeseries
    timeseries = dict({
        "time": np.arange(10).tolist() ,
        "data": np.arange(10).tolist()
    })
    return jsonify(timeseries)

@blueprint.route('/api/slice', methods=['GET', 'POST'])
@cross_origin()
def dataset_slice():
    """Return dataset content."""
    # get the dataset from the current app
    year = int(request.values.get('year', datetime.datetime.now().year))
    depth = int(request.values.get('depth', 0))
    """
    read some variables and return an open file handle,
    based on data selection.
    """
    ds = get_ds()
    if ds is None:
        return jsonify({
            'error': 'data not loaded'
        })

    # slicing in time!
    t0 = netCDF4.date2num(
        datetime.datetime(year=year, month=1, day=1),
        ds.variables['date_time'].units
    )
    t1 = netCDF4.date2num(
        datetime.datetime(year=year + 1, month=1, day=1),
        ds.variables['date_time'].units
    )

    # ensure that our array is always masked
    date_time = np.ma.masked_array(
        ds.variables['date_time'][:]
    )
    is_in_date = np.logical_and(
        date_time[:] >= t0,
        date_time[:] < t1
    ).data
    t = np.empty(
        len(date_time[is_in_date]),
        dtype=type(datetime.datetime.now())
    )

    # split nans and notnans makes it much faster
    dtf = np.where(date_time[is_in_date].mask == False)
    dtt = np.where(date_time[is_in_date].mask == True)
    t[dtf] = netCDF4.num2date(
        date_time[is_in_date][dtf],
        ds.variables['date_time'].units
    )
    # do we have any masked values
    if dtt and dtt[0]:
        t[dtt] = netCDF4.num2date(
            date_time[is_in_date][dtt],
            ds.variables['date_time'].units
        )

    # # TODO: slicing through Depth... Hard with this sort of unstructured netcdf.
    # if data['var1'].long_name == "Depth":
    #     depth = None
    # else:
    depth = None

    if 'lat' in ds.variables:
        lat = ds['lat'][is_in_date]
    elif 'latitude' in ds.variables:
        lat = ds['latitude'][is_in_date]
    if 'lon' in ds.variables:
        lon = ds['lon'][is_in_date]
    elif 'longitude' in ds.variables:
        lon = ds['longitude'][is_in_date]

    geometry = geojson.MultiPoint(
        np.c_[
            antimeridian_cut(lon),
            lat
        ].tolist()
    )
    feature = geojson.Feature(
        geometry=geometry,
        properties={}
    )

    ds.close()
    return jsonify(feature)



#TODO: Need a request to get all variables back
# def get_variables():
#     return ds.variables

def create_app():
    """Create an app."""

    app = Flask(__name__.split('.')[0])
    app.register_blueprint(blueprint)
    # make sure file is closed
    # app.teardown_appcontext(close_ds)
    # add CORS to everything under /api/
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    return app
