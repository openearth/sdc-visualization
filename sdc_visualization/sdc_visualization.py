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

from bokeh.models import HoverTool, TapTool, CustomJS, ColumnDataSource
from bokeh.plotting import figure, show

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
            if (path.suffix in ('.txt', '.csv')):
                data = self.read_txt(path)
            elif (path.suffix in ('.tar', '.tgz')):
                self.read_tar(path)
                data = self.read_txt(path.with_suffix('.txt'))
            elif (path.suffix in ('.nc')):
                data = self.read_nc(path)
            self.grids.append(data['grids'])
            self.trajectories.append(data['trajectories'])
            self.profiles.append(data['profiles'])
                
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
            "grids": [],
            "trajectories": [],
            "profiles": data
        }

    def read_nc(self, path):
        """read some variables and return an open file handle"""
        data = nc.Dataset(path)
        lat = data['lat'][:]
        lon = data['lon'][:]
        time = data['time'][:]
        return {
            "grids": {
                "lat": lat,
                "lon": lon,
                "time": time,
                "nc_file": data
            },
            "trajectories": [],
            "profiles": []
        }

    def read_tar(self, path):
        """Read tar file and open text file """
        tar = tarfile.open(path, "r:gz")
        tar.extractall()
            
    def animation(self, index, subname, time):
        writer = FFMpegWriter(fps=15)
        assert (self.grids[index] != []), "No grids defined"
        assert (subname in self.grids[index]['nc_file'].variables.keys()), "Substance name not defined, choose from: " + str(self.grids[index]['nc_file'].variables.keys())
        lat = self.grids[index]['lat'][:]
        lon = self.grids[index]['lon'][:]
        sub = self.grids[index]['nc_file'][subname][time, 0, :, :]

        lon_min, lon_max, lat_min, lat_max, image, fig = self.create_image(lat, lon, sub)
        with writer.saving(fig, "writer_test.mp4", 100):
            for t in range(len(time)):
                fig.set_data = lon, lat, sub[t, :, :]
                writer.grab_frame()
        

    def mapbox_image_layer(self, index, subname, time=0):
        assert (self.grids[index] != []), "No grids defined"
        assert (subname in self.grids[index]['nc_file'].variables.keys()), "Substance name not defined, choose from: " + str(self.grids[index]['nc_file'].variables.keys())
        lat = self.grids[index]['lat'][:]
        lon = self.grids[index]['lon'][:]
        sub = self.grids[index]['nc_file'][subname][time, 0, :, :]

        lon_min, lon_max, lat_min, lat_max, image, fig = self.create_image(lat, lon, sub)
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
            
    def create_image(self, lat, lon, sub):
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
        plt.pcolormesh(lon, lat, sub)
        fig.subplots_adjust(top = 1, bottom = 0, right = 1, left = 0,  hspace = 0, wspace = 0)
        ax.margins(0,0)
        ax.set_xlim(lon_min, lon_max)
        ax.set_ylim(lat_min, lat_max)
        ax.xaxis.set_major_locator(matplotlib.ticker.NullLocator())
        ax.yaxis.set_major_locator(matplotlib.ticker.NullLocator())
        return lon_min, lon_max, lat_min, lat_max, image, fig
#    def timeSeries(self, data, subname):
#        assert (subname in data.columns.values), "Subname incorrect, use one of: " + data.columns.values
#        sub = data[subname]
#        time = pd.to_datetime(data['time'], format='%Y-%m-%dT%H:%M:%S')
#        TOOLS = 'pan, wheel_zoom, box_zoom, reset, save, box_select, lasso_select'
#        
#        left = figure(plot_width=300, plot_height=300, tools=TOOLS, title=subname, x_axis_type='datetime')
#        left.circle(time, sub, line_width=2)
#    
#        p2 = gridplot([left], title='Data plots', toolbar_location='above',
#               plot_width=400, plot_height=300);
#        
#        script, div = components(p2)
#        show(p2)
#        return script, div
    def timeseries_plot(self, index, subname):
        print(self.profiles[index])
        data = pd.DataFrame(self.profiles[index])
        print(data.head())
        assert (subname in data.columns.values), "Subname incorrect, use one of: " + str(data.columns.values)
        sub = self.profiles[index][subname]
        time = pd.to_datetime(self.profiles[index]['yyyy-mm-ddThh:mm:ss.sss'], format='%Y-%m-%dT%H:%M:%S')
        TOOLS = 'pan, wheel_zoom, box_zoom, reset, save, box_select, lasso_select'

        p = figure(plot_width=300, plot_height=300, tools=TOOLS, title=subname, x_axis_type='datetime')
        p.line(time, sub, line_width=2)

        script, div = components(p)
        show(p)
        return script, div
    
    def profiles_plot(self, index, subname): 
        assert (subname in self.profiles[index].columns.values), "Subname incorrect, use one of: " + self.profiles[index].columns.values
        sub = self.profiles[index][subname]
        time = pd.to_datetime(self.profiles[index]['yyyy-mm-ddThh:mm:ss.sss'], format='%Y-%m-%dT%H:%M:%S')
        TOOLS = 'pan, wheel_zoom, box_zoom, reset, save, box_select, lasso_select'

        p = figure(plot_width=300, plot_height=300, tools=TOOLS, title=subname, x_axis_type='datetime')
        p.line(time, sub, line_width=2)

        script, div = components(p)
        show(p)
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
        FC = geojson.FeatureCollection(featcol)
        return FC

if __name__ == '__main__':
    ODVobj = ODV(['SDN_Elba_SpreadSheet_2.tgz', r'C:/Users/vries_cy/sdc-visualization/sdc_visualization/Water_body_Salinity_eb.4Danl.nc'])
    image_layer = ODVobj.mapbox_image_layer(1, 'Salinity', 0)
    ODVobj.timeseries_plot(0, 'Water body salinity [per mille]')
    ODVobj.animation(1, 'Salinity', 0)
    
