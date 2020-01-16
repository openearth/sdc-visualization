import datetime
import logging

import geojson
import netCDF4
import numpy as np
import tqdm

logger = logging.getLogger(__name__)

def antimeridian_cut(lon):
    """longitudes > 180 -> -360"""
    return np.mod(np.array(lon) + 180, 360) - 180


def odvnc2features(path):
    """convert odv file to features per year"""
    ds = netCDF4.Dataset(path)
    # slicing in time!
    features = []

    dates = netCDF4.num2date(ds.variables['date_time'][:], ds.variables['date_time'].units)

    t_min = dates[dates != None].min()
    t_max = dates[dates != None].max()

    for year in tqdm.tqdm(range(t_min.year, t_max.year + 1)):
        logger.debug('creating features for %s through %s', t_min, t_max)

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
        if not is_in_date.any():
            # no data, skipping
            continue
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

        # find LOCAL_CDI_ID
        for name,  var in ds.variables.items():
            if var.long_name == 'LOCAL_CDI_ID':
                break
        else:
            logger.warning('LOCAL_CDI_ID not found, generating 0 based numerical indices')
            n_stations = len(ds.dimensions['N_STATIONS'])
            var = np.arange(n_stations).astype('S10')

        cdi_id = var[is_in_date]
        if cdi_id.dtype == 'S1':
            cdi_id = netCDF4.chartostring(cdi_id)

        coordinates = np.c_[
            antimeridian_cut(lon),
            lat
        ].tolist()


        for i, (coordinate, cdi_id_i) in enumerate(zip(coordinates, cdi_id)):
            geometry = geojson.Point(coordinate)
            feature = geojson.Feature(
                id=i,
                geometry=geometry,
                properties={
                    "cdi_id": cdi_id_i,
                    "year": year,
                    "dataset": path.name
                }
            )
            features.append(feature)

    collection = geojson.FeatureCollection(features=features)
    new_path = path.with_name(path.stem).with_suffix('.json')
    with new_path.open('w') as f:
        geojson.dump(collection, f)
