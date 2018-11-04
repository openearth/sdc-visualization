"""Create a visualization server."""

from flask import Blueprint, Flask, jsonify, current_app
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
