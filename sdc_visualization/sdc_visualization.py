# -*- coding: utf-8 -*-
import pathlib
import tarfile
import io
import base64

import pandas as pd
import numpy as np
import netCDF4
import geojson
from datetime import datetime

import matplotlib.pyplot as plt
import matplotlib
from matplotlib.animation import FFMpegWriter

import bokeh.plotting
import bokeh.embed


class ODV:
    def __init__(self, filenames, timeInterval=[], depthInterval=[],  valueInterval=[]):
        """Read and visualize ODV format files.
           As optional arguments, insert time, depth and value intervals,
           to better and faster slice your data.
        """
        if type(filenames) is not list:
            filenames = [filenames]

        self.paths = [
            pathlib.Path(filename)
            for filename
            in filenames
            ]

        # Following the CF convention date types as described here:
        # https://www.nodc.noaa.gov/data/formats/netcdf/v2.0/decision_tree_high_res.pdf
        self.grids = []
        self.trajectories = []
        self.profiles = []

        for path in self.paths:
            if (path.suffix in ('.txt', '.csv')):
                data = self.read_txt(path)
            elif (path.suffix in ('.tar', '.tgz')):
                self.extract_tar(path)
                data = self.read_txt(path.with_suffix('.txt'))
            elif (path.suffix in ('.nc')):
                data = self.read_nc(path, timeInterval, depthInterval,valueInterval)
            self.grids.append(data['grids'])
            self.trajectories.append(data['trajectories'])
            self.profiles.append(data['profiles'])

    def load_dataset(self, filename):
        path = pathlib.Path(filename).expanduser()
        ds = netCDF4.Dataset(path)
        return ds

    def read_txt(self, path):
        """unpack an ODV tar file"""
        data = pd.read_csv(
            path,
            # TODO, lookup formal format description.
            skiprows=71,
            comment='//<',
            sep=r'\t',
            engine='python'
        )

        trajects = self.create_trajectories(data)

        return {
            "grids": [],
            "trajectories": trajects,
            "profiles": data
        }

    def create_trajectories(self, data):
        cruises = data.Cruise.unique()

        data = data.fillna('None')
        featcol = []

        for cruise in cruises[:5]:
            cruise_data = data.loc[data['Cruise'] == cruise]
            geo = cruise_data[
                ['Longitude [degrees_east]', 'Latitude [degrees_north]']
            ].values.tolist()
            feat = {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': geo
                },
                'properties': {
                    'name': cruise,
                    'time': cruise_data['yyyy-mm-ddThh:mm:ss.sss'].values.tolist(),
                    'depth': cruise_data['Depth [m]'].values.tolist(),
                    'temp': cruise_data['ITS-90 water temperature [degrees C]'].values.tolist(),
                    'salinity': cruise_data['Water body salinity [per mille]'].values.tolist()
                }
            }
            featcol.append(feat)
        features = geojson.FeatureCollection(featcol)
        return features

    def read_nc_all(self, path):
        """read some variables and return the full netCDF as an open file handle"""
        data = netCDF4.Dataset(path)
        if 'lat' in netCDF4.Dataset(path).variables:
            lat = data['lat'][:]
        elif 'latitude' in netCDF4.Dataset(path).variables:
            lat = data['latitude'][:]
        if 'lon' in netCDF4.Dataset(path).variables:
            lon = data['lon'][:]
        elif 'longitude' in netCDF4.Dataset(path).variables:
            lon = data['longitude'][:]
        if 'time' in netCDF4.Dataset(path).variables:
            t = data['time'][:]
        elif 'date_time' in netCDF4.Dataset(path).variables:
            chnc = int(1e5)
            t = np.empty(len(data['date_time'][:]),dtype=type(datetime.now()))
            if len(data['date_time'][:]) > chnc: # big
                # split nans and notnans makes it much faster
                dtf = np.where( data['date_time'][:].mask==False )
                dtt = np.where( data['date_time'][:].mask==True )
                t[dtf] = netCDF4.num2date( data['date_time'][dtf], data['date_time'].units)
                t[dtt] = netCDF4.num2date( data['date_time'][dtt], data['date_time'].units)

                # itt = 0
                #t = np.array((),dtype='int')
                #for itt in range(0, int(len(data['date_time'][:]) / chnc)):
                    #tt = nc.num2date(data['date_time'][0+chnc*itt:chnc+chnc*itt], data['date_time'].units)
                    #t = np.concatenate([t,tt])
            else:
                t = data['date_time'][:]

        return {
            "grids": {
                "lat": lat,
                "lon": lon,
                "time": t,
                "nc_file": data
            },
            "trajectories": [],
            "profiles": []

        }

    def read_nc_slice(self, path, timeInterval, depthInterval, valueInterval):
        """read some variables and return an open file handle,
           based on data selection.
        """
        data = netCDF4.Dataset(path)

        # TODO: slicing in time!
        if 'time' in netCDF4.Dataset(path).variables:
            t = data['time'][:]
        elif 'date_time' in netCDF4.Dataset(path).variables:
            chnc = int(1e5)
            t0 = netCDF4.date2num ( datetime.strptime(timeInterval[0],'%Y-%m-%d') , data['date_time'].units)
            t1 = netCDF4.date2num ( datetime.strptime(timeInterval[1],'%Y-%m-%d') , data['date_time'].units)
            isInDate = np.logical_and(data.variables['date_time'][:] > t0, data.variables['date_time'][:] < t1).data
            t = np.empty(len(data.variables['date_time'][isInDate]),dtype=type(datetime.now()))
            if len(data['date_time'][isInDate]) > chnc: # big
                # split nans and notnans makes it much faster
                dtf = np.where( data['date_time'][isInDate].mask==False )
                dtt = np.where( data['date_time'][isInDate].mask==True )
                t[dtf] = netCDF4.num2date( data['date_time'][isInDate][dtf], data['date_time'].units)
                t[dtt] = netCDF4.num2date( data['date_time'][isInDate][dtt], data['date_time'].units)

            else:
                t = data['date_time'][isInDate]

        # TODO: slicing through Depth... Hard with this sort of unstructured netcdf.
        if data['var1'].long_name == "Depth":
            depth = None
        else:
            depth = None

        if 'lat' in netCDF4.Dataset(path).variables:
            lat = data['lat'][isInDate]
        elif 'latitude' in netCDF4.Dataset(path).variables:
            lat = data['latitude'][isInDate]
        if 'lon' in netCDF4.Dataset(path).variables:
            lon = data['lon'][isInDate]
        elif 'longitude' in netCDF4.Dataset(path).variables:
            lon = data['longitude'][isInDate]

        return {
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

    def read_nc(self, path, timeInterval, depthInterval, valueInterval):
        if timeInterval == depthInterval == valueInterval == []:
            data = self.read_nc_all(path)
        else:
            data = self.read_nc_slice(path, timeInterval, depthInterval, valueInterval)
        return data

    def extract_tar(self, path):
        """extract tar file"""
        with tarfile.open(path, "r:gz") as tar:
            tar.extractall(path=path.parent)

    def animate(self, index, substance, time_idx):
        """create an mp4 movie for the substance for all time_idxteps (t)"""
        writer = FFMpegWriter(fps=15)
        assert (self.grids[index] != []), "No grids defined"
        substances = self.grids[index]['nc_file'].variables.keys()
        assert substance in substances, "Substance name not in: " + str(substances)

        lat = self.grids[index]['lat'][:]
        lon = self.grids[index]['lon'][:]
        # read variable substance from the file and get the array for depth_idx == 0
        substance_arr = self.grids[index]['nc_file'].variables[substance][time_idx, 0, :, :]
        img_info = self.create_image(lat, lon, substance_arr[0])

        with writer.saving(img_info['fig'], "%s.mp4" % (substance, ), 100):
            for idx in range(len(time_idx)):
                img_info['pcolor'].set_array(substance_arr[idx, :-1, :-1].ravel())
                writer.grab_frame()

    def mapbox_geojson_layer(self, index):
        assert (self.trajectories[index] != []), "No trajectories defined!"
        return {
            'id': 'Trajectories',
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': self.trajectories[index]
            },
            'paint': {
                'line-color': 'red',
                'line-width': 2
            }
        }

    def mapbox_image_layer(self, index, substance, t=0):
        assert (self.grids[index] != []), "No grids defined"
        substances = self.grids[index]['nc_file'].variables.keys()
        assert substance in substances, "Substance name not in: " + str(substances)

        lat = self.grids[index]['lat'][:]
        lon = self.grids[index]['lon'][:]
        sub = self.grids[index]['nc_file'][substance][t, 0, :, :]

        img_info = self.create_image(lat, lon, sub)
        stream = io.BytesIO()
        img_info['fig'].savefig(
            stream,
            format='png',
            transparent=True,
            pad_inches=0,
            dpi=200
        )
        encoded = str(base64.b64encode(stream.getvalue()))
        return {
            'id': 'imagelayer',
            'type': 'raster',
            'source': {
                "type": "image",
                "url": "data:image/png;base64," + encoded,
                "coordinates": img_info['bbox']
            }
        }

    def create_image(self, lat, lon, arr):
        lat_min = lat.min()
        lat_max = lat.max()
        lon_min = lon.min()
        lon_max = lon.max()
        fig, ax = plt.subplots()
        ax.set_axis_off()
        pcolor = ax.pcolormesh(lon, lat, arr)
        fig.subplots_adjust(
            top=1,
            bottom=0,
            right=1,
            left=0,
            hspace=0,
            wspace=0
        )
        ax.margins(0, 0)
        ax.set_xlim(lon_min, lon_max)
        ax.set_ylim(lat_min, lat_max)
        ax.xaxis.set_major_locator(matplotlib.ticker.NullLocator())
        ax.yaxis.set_major_locator(matplotlib.ticker.NullLocator())
        img_info = dict(
            bbox=[
                [lon_min, lat_max],
                [lon_max, lat_max],
                [lon_max, lat_min],
                [lon_min, lat_min]
            ],
            pcolor=pcolor,
            ax=ax,
            fig=fig
        )
        return img_info

    def timeseries_plot(self, index, substance):
        data = pd.DataFrame(self.profiles[index])
        substances = data.columns.values
        assert (substance in substances), "Substance incorrect, use one of: " + str(substances)
        sub = self.profiles[index][substance]
        time = pd.to_datetime(
            self.profiles[index]['yyyy-mm-ddThh:mm:ss.sss'],
            format='%Y-%m-%dT%H:%M:%S'
        )
        tools = 'pan, wheel_zoom, box_zoom, reset, save, box_select, lasso_select'

        p = bokeh.plotting.figure(
            plot_width=300,
            plot_height=300,
            tools=tools,
            title=substance,
            x_axis_type='datetime'
        )
        p.line(time, sub, line_width=2)
        script, div = bokeh.embed.components(p)
        bokeh.plotting.show(p)
        return script, div


def load_dataset(filename):
    path = pathlib.Path(filename).expanduser()
    ds = netCDF4.Dataset(path)
    return ds

    def read_nc_slice(self, path, timeInterval, depthInterval, valueInterval):
        """read some variables and return an open file handle,
           based on data selection.
        """
        data = netCDF4.Dataset(path)

        # TODO: slicing in time!
        if 'time' in netCDF4.Dataset(path).variables:
            t = data['time'][:]
        elif 'date_time' in netCDF4.Dataset(path).variables:
            chnc = int(1e5)
            t0 = netCDF4.date2num ( datetime.strptime(timeInterval[0],'%Y-%m-%d') , data['date_time'].units)
            t1 = netCDF4.date2num ( datetime.strptime(timeInterval[1],'%Y-%m-%d') , data['date_time'].units)
            isInDate = np.logical_and(data.variables['date_time'][:] > t0, data.variables['date_time'][:] < t1).data
            t = np.empty(len(data.variables['date_time'][isInDate]),dtype=type(datetime.now()))
            if len(data['date_time'][isInDate]) > chnc: # big
                # split nans and notnans makes it much faster
                dtf = np.where( data['date_time'][isInDate].mask==False )
                dtt = np.where( data['date_time'][isInDate].mask==True )
                t[dtf] = netCDF4.num2date( data['date_time'][isInDate][dtf], data['date_time'].units)
                t[dtt] = netCDF4.num2date( data['date_time'][isInDate][dtt], data['date_time'].units)

            else:
                t = data['date_time'][isInDate]

        # TODO: slicing through Depth... Hard with this sort of unstructured netcdf.
        if data['var1'].long_name == "Depth":
            depth = None
        else:
            depth = None

        if 'lat' in netCDF4.Dataset(path).variables:
            lat = data['lat'][isInDate]
        elif 'latitude' in netCDF4.Dataset(path).variables:
            lat = data['latitude'][isInDate]
        if 'lon' in netCDF4.Dataset(path).variables:
            lon = data['lon'][isInDate]
        elif 'longitude' in netCDF4.Dataset(path).variables:
            lon = data['longitude'][isInDate]

        return {
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
