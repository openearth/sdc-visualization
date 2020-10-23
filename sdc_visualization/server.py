"""Create a visualization server."""

import datetime
import time
import logging
import json
import tempfile
import pathlib
import shutil
import os
import functools

import netCDF4
import numpy as np
import geojson
import pyproj
import pandas as pd
import requests
import simplejson
import shapely.geometry
from shapely.strtree import STRtree

from flask import (
    Blueprint,
    Flask,
    Response,
    jsonify,
    session,
    current_app,
    request,
    g,
    redirect,
)
from flask_cors import CORS, cross_origin
from flask_login import (
    LoginManager,
    login_user,
    login_manager,
    current_user,
    logout_user,
)

import flask.json

from sdc_visualization.ds import get_ds, close_ds
from sdc_visualization.user import User

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

blueprint = Blueprint("public", __name__, static_folder="../static")
# Debug
test = Blueprint("test", __name__)
# TODO: remove CORS from authentication
CORS(blueprint)

# we  need this at  module level because we need to register functions
login_manager = LoginManager()

# Lookup the relevant URL's
# for now added /
VIZ_URL = os.environ.get("VIZ_URL", "https://jellyfish.argo.grnet.gr/viz/")
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "https://sdc-test.argo.grnet.gr")


# TODO: move some of this out of here...
def antimeridian_cut(lon):
    """longitudes > 180 -> -360"""
    return np.mod(np.array(lon) + 180, 360) - 180


@blueprint.route("/", methods=["GET", "POST"])
@cross_origin()
def home():
    """Home page."""
    return "home"


@blueprint.route("/auth", methods=["GET", "POST"])
@cross_origin()
def auth():
    """Check if user is authenticated."""

    # if user was created  with a service-auth-token
    # get form that was filled in when user was created
    form = getattr(current_user, "form", None)
    if form:
        token = current_user.form.get("service_auth_token")
    else:
        # we did not get a service_auth_token
        token = None

    # Do a request to see if token is still valid
    if token is not None:
        status = check_token(token)
    else:
        # or we assume it is  valid
        # TODO: remove this if dashboard is setup properly
        status = 200

    if current_user.is_authenticated and status == 200:
        return "You are logged in! Welcome."
    else:
        return "Sorry, but unfortunately you're not logged in.", 401


def check_token(token):
    # check it against the dashboard
    url = DASHBOARD_URL + "/service_auth"
    request = {"service_auth_token": token}
    # TODO: change  to post later, check security
    resp = requests.post(url, data=request)
    # if we don't have false, or if we did not get a direct response
    if "false" == resp.text or resp.status_code != 200:
        return 401
    else:
        return 200


# ensure datetime function
def ensure_datetime(maybe_datetime):

    """sometimes < 1582 we get netCDF4 datetimes which have an explicit Gregorian calendar"""

    if hasattr(maybe_datetime, "_to_real_datetime"):
        date = maybe_datetime._to_real_datetime()
    else:
        date = maybe_datetime

    return date


@blueprint.route("/login", methods=["POST"])
def login():
    """Login"""

    # You can store extra information like this....
    service_auth_token = request.form.get("service_auth_token")
    # if we get a service_auth_token
    if service_auth_token is not None:
        status = check_token(service_auth_token)
        if status != 200:
            msg = "Dashboard authentication at {} failed".format(DASHBOARD_URL)
            return Response(msg, status=status)

    # Create a new user
    username = request.form["username"]
    user = User.get(username)
    # store anything from the form
    user.form.update(request.form)
    # Log him in, now we know the user
    login_user(user)

    # redirect to this directory.
    return redirect(VIZ_URL)


@blueprint.route("/logout", methods=["POST"])
def logout():
    # remove the username from the session if it's there
    logout_user()
    return jsonify({"result": "ok", "message": "user logged out"})


@blueprint.route("/debug", methods=["GET", "POST"])
@cross_origin()
def debug():
    """Debug page, remove later"""
    debug_info = {
        "session": dict(session),
        "user": current_user.get_id(),
        "form": getattr(current_user, "form", {}),
    }
    return jsonify(dict(debug_info))


@blueprint.route("/health", methods=["GET", "POST"])
@cross_origin()
def health():
    """Home page."""
    return jsonify({"health": "ok"})


@blueprint.route("/api/load", methods=["POST"])
@cross_origin()
def load():
    # TODO: validate filename further, otherwise we might load any file
    req_data = request.get_json()

    # the filename string
    filename = req_data.get("filename")

    logger.debug(filename, pathlib.Path(filename).expanduser())
    # the expanded path
    filepath = pathlib.Path(filename).expanduser()

    resp = {"loaded": False}
    if not filepath.suffix == ".nc":
        resp["error"] = "filename does not end in .nc"
        return jsonify(resp)
    if not filepath.exists():
        resp["error"] = "file does not exist"
        return jsonify(resp)
    print(req_data)
    if req_data.get("copy", False):
        tmp_dir = tempfile.mkdtemp(prefix="sdc-", suffix="-remove")
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


@blueprint.route("/api/dataset", methods=["GET", "POST"])
@cross_origin()
def dataset():
    """Return dataset metadata."""
    # get the dataset from the current app
    ds = get_ds()
    logger.info("opened %s", ds)
    if ds is None:
        resp = {"_comment": "no data loaded"}
        return jsonify(resp)
    # this can be a bit slow
    date_nums = ds.variables["date_time"][:]

    # if we have an actual range, use that
    try:
        times = netCDF4.num2date(
            ds.variables["date_time"].valid_range, ds.variables["date_time"].units
        )
    except AttributeError:
        # use datenums
        times = netCDF4.num2date(
            [date_nums.min(), date_nums.max()], ds.variables["date_time"].units
        )

    if times[0].year < 1970:
        times[0] = datetime.datetime(1970, 1, 1)
    resp = {
        "name": ds.filepath(),
        "variables": list(ds.variables.keys()),
        "time_extent": [
            ensure_datetime(times[0]).isoformat(),
            ensure_datetime(times[-1]).isoformat(),
        ],
    }
    ds.close()
    return jsonify(resp)


@blueprint.route("/api/extent", methods=["GET", "POST"])
@cross_origin()
def extent():
    """Return dataset extent."""
    # get the dataset from the current app
    ds = get_ds()
    if ds is None:
        return jsonify({"error": "data not loaded"})

    # ensure that our array is always masked
    date_time = np.ma.masked_array(ds.variables["date_time"][:])

    t_ini = netCDF4.num2date(np.min(date_time[:]), ds.variables["date_time"].units)
    t_fin = netCDF4.num2date(np.max(date_time[:]), ds.variables["date_time"].units)

    resp = [t_ini.year, t_fin.year]
    ds.close()
    return jsonify(resp)


@functools.lru_cache()
def get_cdi_id_var(ds):
    # TODO we cant always be sure that LOCAL_CDI_ID is the var_name that we need
    for var_name, var in ds.variables.items():
        if var.long_name == "LOCAL_CDI_ID":
            break
    else:
        raise ValueError("no variable found with long_name  LOCAL_CDI_ID")

    return var_name


# @blueprint.route('/api/get_timeseries', methods=['GET', 'POST']) renamed at get_profile
@blueprint.route("/api/get_profile", methods=["GET", "POST"])
@cross_origin()
def get_profile():
    """Return profile for one cdi_id"""

    cdi_id = request.values.get("cdi_id")
    cdi_id = str(cdi_id)

    dataset = request.values.get("dataset")

    ds = get_ds(dataset=dataset)
    if ds is None:
        return jsonify({"error": "data not loaded"})

    cdi_id_var = get_cdi_id_var(ds)
    cdi_ids = netCDF4.chartostring(ds.variables[cdi_id_var][:])

    # get the first
    idx = np.argmax(cdi_ids == cdi_id)

    var_names = [
        name
        for name, var in ds.variables.items()
        if name.startswith("var") and not "_" in name
    ]

    # add the variables to the list
    variables = {}
    for var_name in var_names:
        var = ds.variables[var_name]
        try:
            variables[var.long_name] = var[idx]
        except IndexError:
            logger.exception("failed to index {} with index {}".format(var, idx))

    df = pd.DataFrame(data=variables)
    # get rid of missing data
    df = df.dropna(how="all")

    # get metadata
    date_nums = ds.variables["date_time"][idx]
    date_units = ds.variables["date_time"].units
    date = netCDF4.num2date(date_nums, date_units)
    records = json.loads(df.to_json(orient="records"))

    lon = ds.variables["longitude"][idx]
    lat = ds.variables["latitude"][idx]

    meta_var_names = [
        name
        for name, var in ds.variables.items()
        if name.startswith("metavar") and not "_" in name
    ]
    meta_vars = {}

    for var_name in meta_var_names:
        var = ds.variables[var_name]
        if var.dtype == "S1" and len(var.shape) > 1:
            meta_vars[var.long_name] = str(netCDF4.chartostring(var[idx]))
        else:
            meta_vars[var.long_name] = var[idx]

    ds.close()

    # ensure date time
    date = ensure_datetime(date)
    meta_vars.update(
        {"date": date.isoformat(), "cdi_id": cdi_id, "lon": lon, "lat": lat}
    )

    response = {"data": records, "meta": meta_vars}
    return jsonify(response)


@blueprint.route("/api/slice", methods=["GET", "POST"])
@cross_origin()
def dataset_slice():
    """Return dataset content."""
    # get the dataset from the current app
    year = int(request.values.get("year", datetime.datetime.now().year))
    depth = int(request.values.get("depth", 0))
    """
    read some variables and return an open file handle,
    based on data selection.
    """
    ds = get_ds()
    if ds is None:
        return jsonify({"error": "data not loaded"})

    # slicing in time!
    t0 = netCDF4.date2num(
        datetime.datetime(year=year, month=1, day=1), ds.variables["date_time"].units
    )
    t1 = netCDF4.date2num(
        datetime.datetime(year=year + 1, month=1, day=1),
        ds.variables["date_time"].units,
    )

    # ensure that our array is always masked
    date_time = np.ma.masked_array(ds.variables["date_time"][:])
    is_in_date = np.logical_and(date_time[:] >= t0, date_time[:] < t1).data
    t = np.empty(len(date_time[is_in_date]), dtype=type(datetime.datetime.now()))

    # split nans and notnans makes it much faster
    dtf = np.where(date_time[is_in_date].mask == False)
    dtt = np.where(date_time[is_in_date].mask == True)
    t[dtf] = netCDF4.num2date(
        date_time[is_in_date][dtf], ds.variables["date_time"].units
    )
    # do we have any masked values
    if dtt and dtt[0]:
        t[dtt] = netCDF4.num2date(
            date_time[is_in_date][dtt], ds.variables["date_time"].units
        )

    # # TODO: slicing through Depth... Hard with this sort of unstructured netcdf.
    # if data['var1'].long_name == "Depth":
    #     depth = None
    # else:
    depth = None

    if "lat" in ds.variables:
        lat = ds["lat"][is_in_date]
    elif "latitude" in ds.variables:
        lat = ds["latitude"][is_in_date]
    if "lon" in ds.variables:
        lon = ds["lon"][is_in_date]
    elif "longitude" in ds.variables:
        lon = ds["longitude"][is_in_date]

    cdi_id = netCDF4.chartostring(ds.variables["metavar4"][is_in_date])

    coordinates = np.c_[antimeridian_cut(lon), lat].tolist()

    features = []
    for i, (coordinate, cdi_id_i) in enumerate(zip(coordinates, cdi_id)):
        geometry = geojson.Point(coordinate)
        feature = geojson.Feature(
            id=i, geometry=geometry, properties={"cdi_id": cdi_id_i}
        )
        features.append(feature)

    collection = geojson.FeatureCollection(features=features)
    ds.close()
    return jsonify(collection)


@functools.lru_cache()
def tree_from_dataset(ds):
    # get lat, lon from the dataset
    lon = ds.variables["longitude"][:]
    lat = ds.variables["latitude"][:]

    # create spatial points so that we can query by geometry
    points = [shapely.geometry.Point(lon_i, lat_i) for lon_i, lat_i in zip(lon, lat)]

    index_by_id = dict((id(pt), i) for i, pt in enumerate(points))
    tree = STRtree(points)
    return tree, index_by_id


def query_tree(tree, index_by_id, geom):
    """lookup the indices by geometry"""
    shapes = tree.query(geom)
    idx = [index_by_id[id(pt)] for pt in shapes]
    # improves performance by a factor of 3
    # sort to make it faster
    idx = list(sorted(idx))
    return idx


def indexes_of_year(year, indexes, ds):
    for idx in indexes:
        print("idx", idx)
        date_nums = ds.variables["date_time"][idx]
        date_units = ds.variables["date_time"].units
        date = netCDF4.num2date(date_nums, date_units)
        if date.year == year:
            print("date.year", type(date.year))
            return idx


@blueprint.route(
    "/api/get_profiles", methods=["GET", "POST"]
)  # rename to profile as it is not timeseries
@cross_origin()
def get_profiles():
    """ Return profile for selected points"""

    # read inputs
    req = request.get_json()
    timeframe = req["timeframe"]
    print("timeframe", timeframe)
    dataset = request.values.get("dataset")
    ds = get_ds(dataset=dataset)
    if ds is None:
        return jsonify({"error": "data not loaded"})

    geom = shapely.geometry.asShape(req["geojson"]["geometry"])
    print("geom", geom)
    # Create tree from dataset
    tree, index_by_id = tree_from_dataset(ds)

    # List with indexes for the specified geom
    indexes = query_tree(tree, index_by_id, geom)
    max_n = 300
    if len(indexes) > max_n:
        # if we have more than 300 stationss this function takes over 5s
        # let's just return a random sample of 1000 points
        sample = np.random.choice(indexes, max_n, replace=False)
        # sort and rename to idx
        indexes = list(sorted(sample))
    print("indexes", indexes)
    # take only the indexes of the specified timeframe
    indexes = [indexes_of_year(x, indexes, ds) for x in timeframe]
    print("indexes", indexes)
    # get the variable that has the cdi_ids
    cdi_id_var = get_cdi_id_var(ds=ds)

    # create a list with the var that contain the temperature, salinity and depth values
    var_names = [
        name
        for name, var in ds.variables.items()
        if (name.startswith("var") and not "_" in name)
    ]

    # prepare the output
    # TODO take a look at these hardcoded names. Either be an input in the function or something more generic
    titles = [
        "Water temperature",
        "Water body salinity",
        "Depth",
        "cdi_id",
        "lat",
        "lon",
    ]
    output = []
    output.append(titles)

    for idx in indexes:
        date_nums = ds.variables["date_time"][idx]

    for idx in indexes:
        # Get cdi_id of specified idx
        cdi_id = netCDF4.chartostring(ds.variables[cdi_id_var][idx])

        lon = ds.variables["longitude"][idx].item(0)
        lat = ds.variables["latitude"][idx].item(0)
        np.array2string(cdi_id)

        idx_variables = {}
        for var_name in var_names:
            var = ds.variables[var_name]
            try:
                idx_variables[var.long_name] = var[idx]
            except AttributeError:
                print("failed to index {} with index {}".format(var, idx))
        cdi_id_array = np.empty(shape=idx_variables["Depth"].shape, dtype="<U28")
        cdi_id_array.fill(str(cdi_id))

        c = np.array(
            list(
                zip(
                    idx_variables["ITS-90 water temperature"],
                    idx_variables["Water body salinity"],
                    idx_variables["Depth"],
                )
            )
        )

        df = pd.DataFrame(data=c)
        df = df.dropna(how="all")
        # create a list with lists of the values
        ls = df.values.tolist()

        # pass through all the lists of the list and append with the
        # corresponding cdi_id
        # every list: temperature, salinity, depth, cdi_id
        for item in ls:
            item.extend((str(cdi_id), round(lat, 4), round(lon, 4)))
            # item.append(str(cdi_id))
            output.append(item)

    response = {"data": output}

    # , allow_nan=False
    return simplejson.dumps(response, ignore_nan=True)


@login_manager.user_loader
def load_user(user_id):
    """user management"""
    return User.get(user_id)


def create_app():
    """Create an app."""

    app = Flask(__name__.split(".")[0])
    # TODO: get this from docker secret /run/secret
    app.secret_key = os.urandom(16)
    app.config["PREFERRED_URL_SCHEME"] = "https"

    # add user sessions
    login_manager.init_app(app)

    # add urls
    app.register_blueprint(blueprint)

    # add CORS to everything under /api/
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    class JsonCustomEncoder(flask.json.JSONEncoder):
        """encode numpy objects"""

        def default(self, obj):
            if isinstance(obj, (np.ndarray, np.number)):
                return obj.tolist()
            elif isinstance(obj, (complex, np.complex)):
                return [obj.real, obj.imag]
            elif isinstance(obj, set):
                return list(obj)
            elif isinstance(obj, bytes):  # pragma: py3
                return obj.decode()
            return json.JSONEncoder.default(self, obj)

    app.json_encoder = JsonCustomEncoder
    return app
