# -*- coding: utf-8 -*-
import os
import glob
import pathlib
import tarfile
from io import BytesIO
import base64

import numpy as np
import pandas as pd
import netCDF4 as nc
import geojson

import matplotlib.pyplot as plt
import matplotlib
from matplotlib.animation import FFMpegWriter


class ODV:
    def __init__(self, filenames):
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
            if (path.endswith(('.txt', '.csv'))):
                data = self.read_txt(self.path)
            elif (path.endswith(('.nc'))):
                data = self.read_nc(self.path)
            self.grids.extend(data['grids'])
            self.trajectories.extend(data['trajectories'])
            self.profiles.extend(data['profiles'])

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
        return {
            "profiles": data
        }

    def read_nc(self):
        """read some variables and return an open file handle"""
        data = nc.Dataset(self.path)
        lat = data['lat'][:]
        lon = data['lon'][:]
        time = data['time'][:]
        return {
            "grd": {
                "lat": lat,
                "lon": lon,
                "time": time,
                "nc_file": data
            }
        }

    def animation(self, lat, lon, sub, time):
        metadata = dict(
            title='Movie Test',
            artist='Matplotlib',
            comment='Movie support!'
        )
        writer = FFMpegWriter(fps=15, metadata=metadata)
        folder = 'temp'
        files = glob.glob(folder +"/*.png")
        files.sort(key=os.path.getmtime)
        images = []
        plt.ioff()
        image = BytesIO()
        lat_min = lat.min()
        lat_max = lat.max()
        lon_min = lon.min()
        lon_max = lon.max()
        fig = plt.figure()
        ax = fig.gca()
        ax = fig.add_subplot(111)
        ax.set_axis_off()
        plot, = plt.pcolormesh(lon, lat, sub[0, :, :])
        fig.subplots_adjust(top = 1, bottom = 0, right = 1, left = 0,  hspace = 0, wspace = 0)
        ax.margins(0,0)
        ax.set_xlim(lon_min, lon_max)
        ax.set_ylim(lat_min, lat_max)
        ax.xaxis.set_major_locator(matplotlib.ticker.NullLocator())
        ax.yaxis.set_major_locator(matplotlib.ticker.NullLocator())
        with writer.saving(fig, "writer_test.mp4", 100):
            for t in range(len(time)):
                plot.set_data = lon, lat, sub[t, :, :]
                writer.grab_frame()

    def mapbox_image_layer(self, lat, lon, sub):
        assert (np.shape(lat) == np.shape(lon) & np.shape(lat) == np.shape(sub)), "Shape of lat, lon and sub should be equal"
        lon_min, lon_max, lat_min, lat_max, image, canvas = self.createImage(lat, lon, 0)
        plt.savefig(image, format='png', transparent=True, pad_inches=0, dpi=200)
        im = str(base64.b64encode(image.getvalue()))
        return {
            'id': 'imagelayer',
            'type': 'raster',
            'source': {
                "type": "image",
                "url": "data:image/png;base64," + im,
                "coordinates": [
                                [lon_min, lat_max],
                                [lon_max, lat_max],
                                [lon_max, lat_min],
                                [lon_min, lat_min]
                              ]
            }
        }
    def create_image(self, lat, lon, sub, t):
        plt.ioff()
        image = BytesIO()
        lat_min = lat.min()
        lat_max = lat.max()
        lon_min = lon.min()
        lon_max = lon.max()
        fig = plt.figure()
        ax = fig.gca()
        ax = fig.add_subplot(111)
        ax.set_axis_off()
        plt.pcolormesh(lon, lat, sub[t, :, :])
        fig.subplots_adjust(top = 1, bottom = 0, right = 1, left = 0,  hspace = 0, wspace = 0)
        ax.margins(0,0)
        ax.set_xlim(lon_min, lon_max)
        ax.set_ylim(lat_min, lat_max)
        ax.xaxis.set_major_locator(matplotlib.ticker.NullLocator())
        ax.yaxis.set_major_locator(matplotlib.ticker.NullLocator())
#        fig.canvas.draw ( )
#
#        # Get the RGBA buffer from the figure
#        w,h = fig.canvas.get_width_height()
#        buf = np.fromstring( fig.canvas.print_to_buffer(), dtype=np.uint8 )
#        buf.shape = ( w, h,4 )
#
#        # canvas.tostring_argb give pixmap in ARGB mode. Roll the ALPHA channel to have it in RGBA mode
#        buf = np.roll ( buf, 3, axis = 2 )
        print(fig.canvas.print_to_buffer())
        return lon_min, lon_max, lat_min, lat_max, image, fig.canvas.print_to_buffer()

    def time_series(self, data, subname):
        assert (subname in data.columns.values), "Subname incorrect, use one of: " + data.columns.values
        sub = data[subname]
        time = pd.to_datetime(data['time'], format='%Y-%m-%dT%H:%M:%S')
        TOOLS = 'pan, wheel_zoom, box_zoom, reset, save, box_select, lasso_select'

        left = figure(plot_width=300, plot_height=300, tools=TOOLS, title=subname, x_axis_type='datetime')
        left.circle(time, sub, line_width=2)

        p2 = gridplot([left], title='Data plots', toolbar_location='above',
               plot_width=400, plot_height=300);

        script, div = components(p2)
        show(p2)
        return script, div

    def cruise_geojson(self, data):
        cruises = data.Cruise.unique()

        data = data.fillna('None')
        featcol = []

        for cruise in cruises[:5]:
            cruise_data = data.loc[data['Cruise'] == cruise]
            geo = cruise_data[['Longitude [degrees_east]', 'Latitude [degrees_north]']].values.tolist()
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
        FC = FeatureCollection(featcol)
        return FC

if __name__ == '__main__':
    tgzfile = ODV('SDN_Elba_SpreadSheet_2.tgz')
    ncfile = ODV(r'C:/Users/vries_cy/sdc-visualization/sdc_visualization/Water_body_Salinity_eb.4Danl.nc')
    print(ncfile.filename)
    lat, lon, sub, time = ncfile.readODVfile('Salinity')
    importdata = tgzfile.readODVfile()
    ncfile.animation(lat, lon, sub, time)
    tgzfile.timeSeries(importdata, 'salinity')
