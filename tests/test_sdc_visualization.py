#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for `sdc_visualization` package."""

import pytest

from click.testing import CliRunner

import sdc_visualization
from sdc_visualization import cli


@pytest.fixture
def odv():
    """Sample dataset."""
    odv = sdc_visualization.ODV([
        'data/SDN_Elba_SpreadSheet_2.tgz',
        'data/Water_body_Salinity_eb.4Danl.nc'
    ])
    return odv


def test_animate(odv):
    """Test if we can create an animation"""
    odv.animate(1, 'Salinity', [0])


def test_mapbox_image(odv):
    """Test if we can create a mapbox layer """
    image_layer = odv.mapbox_image_layer(1, 'Salinity', 0)
    assert image_layer is not None


def test_geojson_layer(odv):
    """test if we can create a geojson layer"""
    geojson_layer = odv.mapbox_geojson_layer(0)
    assert geojson_layer is not None


def test_timeseries_plot(odv):
    """test if we can create a timeseries plot"""
    plot = odv.timeseries_plot(0, 'Water body salinity [per mille]')
    assert plot is not None


def test_command_line_interface():
    """Test the CLI."""
    runner = CliRunner()
    result = runner.invoke(cli.main)
    assert result.exit_code == 0
    assert 'sdc_visualization.cli.main' in result.output
    help_result = runner.invoke(cli.main, ['--help'])
    assert help_result.exit_code == 0
    assert '--help  Show this message and exit.' in help_result.output
