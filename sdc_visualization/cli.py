"""Console script for sdc_visualization."""
import sys
import logging
import pathlib

import click

from sdc_visualization.server import create_app
from sdc_visualization.conversion import odvnc2features


logging.basicConfig(level=logging.INFO)

@click.group()
def cli():
    pass

@cli.command()
def main(args=None):
    """Console script for sdc_visualization."""
    click.echo("Replace this message by putting your code into "
               "sdc_visualization.cli.main")
    click.echo("See click documentation at http://click.pocoo.org/")
    return 0

@cli.command()
@click.argument('path')
def nc2geojson(path):
    click.echo("converting to geojson")
    odvnc2features(pathlib.Path(path))
    return

@cli.command()
@click.option('--debug', default=False, help='Use debug mode.', is_flag=True)
def serve(debug, args=None):
    """Serve sea-data cloud visualisations"""
    app = create_app()
    if debug:
        kwargs = dict(debug=True, use_reloader=False)
    else:
        kwargs ={"host": "0.0.0.0"}
    # threading gave some issues with netCDF, test with app/global context and multiple requests before enabling threading
    # add gunicorn for performance
    app.run(threaded=False, **kwargs)


if __name__ == "__main__":
    sys.exit(main())  # pragma: no cover
