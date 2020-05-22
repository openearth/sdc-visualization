#!/bin/bash

tippecanoe -zg --no-tile-compression --drop-densest-as-needed  -l profiles -o merged.mbtiles *.json
mb-util --image_format=pbf  merged.mbtiles  merged
