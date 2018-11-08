"""Create a visualization server."""

import datetime

import netCDF4
import numpy as np
import geojson

from flask import Blueprint, Flask, jsonify, current_app, request
from flask_cors import CORS

blueprint = Blueprint('public', __name__, static_folder='../static')


@blueprint.route('/', methods=['GET', 'POST'])
def home():
    """Home page."""
    return 'home'

@blueprint.route('/api/dataset', methods=['GET', 'POST'])
def dataset():
    """Return dataset content."""
    # get the dataset from the current app
    resp = list(current_app.ds.variables.keys())
    return jsonify(resp)

@blueprint.route('/api/extent', methods=['GET', 'POST'])
def extent():
    """Return dataset extent."""
    # get the dataset from the current app
    data = current_app.ds

    # ensure that our array is always masked
    date_time = np.ma.masked_array(
        data.variables['date_time'][:]
    )
    
    t_ini = netCDF4.num2date(
        np.min(date_time[:]),
        data.variables['date_time'].units
    )
    t_fin = netCDF4.num2date(
        np.max(date_time[:]),
        data.variables['date_time'].units
    )
    
    resp = [t_ini.year, t_fin.year]
    
    return jsonify(resp)

@blueprint.route('/api/slice', methods=['GET', 'POST'])
def dataset_slice():
    """Return dataset content."""
    # get the dataset from the current app
    year = int(request.values.get('year', datetime.datetime.now().year))
    print(request.form)
    depth = int(request.values.get('depth', 0))


    """
    read some variables and return an open file handle,
    based on data selection.
    """
    data = current_app.ds

    # slicing in time!
    t0 = netCDF4.date2num(
        datetime.datetime(year=year, month=1, day=1),
        data.variables['date_time'].units
    )
    t1 = netCDF4.date2num(
        datetime.datetime(year=year + 1, month=1, day=1),
        data.variables['date_time'].units
    )

    # ensure that our array is always masked
    date_time = np.ma.masked_array(
        data.variables['date_time'][:]
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
        data.variables['date_time'].units
    )
    # do we have any masked values
    if dtt[0]:
        t[dtt] = netCDF4.num2date(
            date_time[is_in_date][dtt],
            data.variables['date_time'].units
        )

    # # TODO: slicing through Depth... Hard with this sort of unstructured netcdf.
    # if data['var1'].long_name == "Depth":
    #     depth = None
    # else:
    depth = None

    if 'lat' in data.variables:
        lat = data['lat'][is_in_date]
    elif 'latitude' in data.variables:
        lat = data['latitude'][is_in_date]
    if 'lon' in data.variables:
        lon = data['lon'][is_in_date]
    elif 'longitude' in data.variables:
        lon = data['longitude'][is_in_date]

    resp = {
        "grids": {
            "lat": lat,
            "lon": lon,
            "time": t,
            "depth": depth,
            "nc_file": data
        },
        "trajectories": [],
        "profiles": []

    }
    geometry = geojson.MultiPoint(
        np.c_[lon, lat].tolist()
    )
    feature = geojson.Feature(
        geometry=geometry,
        properties={}
    )
    return jsonify(feature)

def create_app(ds):
    """Create an app."""

    app = Flask(__name__.split('.')[0])
    app.register_blueprint(blueprint)

    # add CORS to everything under /api/
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # add the dataset to the loaded app
    # perhaps use flask.g, but that did not work
    with app.app_context():
        current_app.ds = ds
    return app
