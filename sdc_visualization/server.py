"""Create a visualization server."""

import datetime
import time
import logging
import json
import tempfile
import pathlib
import shutil
import os

import netCDF4
import numpy as np
import geojson
import pyproj
import pandas as pd

import webdav3.client

from flask import Blueprint, Flask, jsonify, session, current_app, request, g, redirect
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


@blueprint.route('/login', methods=['POST'])
def login():
    """Login"""
    session['username'] = request.form['username']
    session['password'] = request.form['password']
    session['url'] = request.form['url']
    return redirect('/')


@blueprint.route('/logout', methods=['POST'])
def logout():
    # remove the username from the session if it's there
    session.pop('username', None)
    session.pop('password', None)
    session.pop('url', None)
    return jsonify({"result": "ok", "message": "user logged out"})

@blueprint.route('/api/load-webdav', methods=['POST'])
def load_webdav():
    req_data = request.get_json()
    filename = req_data['filename']
    options = {
        'webdav_login': session['username'],
        'webdav_password': session['password'],
        'webdav_hostname': session['url']
    }
    filename = 'viz/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
    remote_path = pathlib.Path(
        filename
    )
    tmp_dir = tempfile.mkdtemp(prefix='sdc-', suffix='-remove')
    local_path = pathlib.Path(tmp_dir) / remote_path.name

    print(options)
    client = webdav3.client.Client(options)
    client.http_header['list'].append('Authorization: Bearer')
    # for  debuggin show the list of files
    try:
        ls = client.list()
        resp = {'ls': ls}
        ls_viz = client.list('viz')
        resp['ls_viz'] = ls_viz
    except webdav3.exceptions.RemoteResourceNotFound:
        pass


    # let's assume it works
    resp["loaded"] = True
    resp["local_path"] = str(local_path)
    resp["remote_path"] = str(remote_path)

    resp["check"] = client.check(remote_path=str(remote_path))

    # if file exists
    if resp['check']:
        # split for debugging
        args = dict(
            local_path=str(local_path),
            remote_path=str(remote_path)
        )
        client.download(**args)
    else:
        logger.exception("download failed")
        resp['message'] = str(e)
        resp['loaded'] = False

    resp["filename"] = filename
    return jsonify(resp)

@blueprint.route('/api/load', methods=['POST'])
@cross_origin()
def load():
    # TODO: validate filename further, otherwise we might load any file
    req_data = request.get_json()

    # the filename string
    filename = req_data.get('filename')

    # the expanded path
    filepath = pathlib.Path(filename).expanduser()

    resp = {"loaded": False}
    if not filepath.suffix == '.nc':
        resp["error"] = "filename does not end in .nc"
        return jsonify(resp)
    if not filepath.exists():
        resp["error"] = "file does not exist"
        return jsonify(resp)
    print(req_data)
    if req_data.get('copy', False):
        tmp_dir = tempfile.mkdtemp(prefix='sdc-', suffix='-remove')
        # copy the expanded file
        shutil.copy(filepath, tmp_dir)
        # replace filename with new filename
        filename = str(pathlib.Path(tmp_dir) / filepath.name)
    # add the dataset to the loaded app
    # perhaps use flask.g, but that did not work
    current_app.filename = filename
    ds = get_ds()
    resp["loaded"] = True
    resp["filename"] = filename
    ds.close()
    return jsonify(resp)


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



@blueprint.route('/api/get_timeseries', methods=['GET', 'POST'])
@cross_origin()
def get_timeseries():
    """Return timeseries for point data"""
    lon_i = request.values.get("lon")
    lat_i = request.values.get("lat")

    cdi_id  = request.values.get("cdi_id")

    if (lon_i is not None and lat_i is not None):
        lon_i = float(lon_i)
        lat_i = float(lat_i)
    elif cdi_id is not None:
        cdi_id = str(cdi_id)
    else:
        raise ValueError("Invalid input")

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
        station_lat = ds['lat'][:]
    elif 'latitude' in ds.variables:
        station_lat = ds['latitude'][:]
    if 'lon' in ds.variables:
        station_lon = ds['lon'][:]
    elif 'longitude' in ds.variables:
        station_lon = ds['longitude'][:]

    cdi_ids = netCDF4.chartostring(ds.variables['metavar4'][:])

    # convert to vector
    if (lon_i is not None and lat_i is not None):
        lon = np.zeros_like(station_lon) + lon_i
        lat = np.zeros_like(station_lat) + lat_i

        wgs84 = pyproj.Geod(ellps='WGS84')
        _, _, distance = wgs84.inv(
            lon, lat,
            station_lon, station_lat
        )
        idx = distance.argmin()
    elif cdi_id is not None:
        # get the first
        idx = np.argmax(cdi_ids == cdi_id)
    else:
        raise ValueError("Invalid input still....")

    var_names = [
        name
        for name, var
        in ds.variables.items()
        if name.startswith('var') and not '_' in name
    ]

    # add the variables to the list
    variables = {}
    for var_name in var_names:
        var = ds.variables[var_name]
        variables[var.long_name] = var[idx]

    df = pd.DataFrame(data=variables)
    # get rid of missing data
    df = df.dropna(how='all')

    # get metadata
    date_nums = ds.variables['date_time'][idx]
    date_units = ds.variables['date_time'].units
    date = netCDF4.num2date(date_nums, date_units)
    records = json.loads(df.to_json(orient='records'))
    ds.close()

    response = {
        "data": records,
        "meta": {
            "date": date.isoformat(),
            "cdi_id": str(cdi_ids[idx])
        }
    }
    return jsonify(response)

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


    cdi_id = netCDF4.chartostring(ds.variables['metavar4'][is_in_date])

    coordinates = np.c_[
        antimeridian_cut(lon),
        lat
    ].tolist()


    features = []
    for i, (coordinate, cdi_id_i) in enumerate(zip(coordinates, cdi_id)):
        geometry = geojson.Point(coordinate)
        feature = geojson.Feature(
            id=i,
            geometry=geometry,
            properties={
                "cdi_id": cdi_id_i
            }
        )
        features.append(feature)

    collection = geojson.FeatureCollection(features=features)
    ds.close()
    return jsonify(collection)



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

    # TODO: get this from docker secret /run/secret
    app.secret_key = os.urandom(16)

    return app
