from flask import Flask, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    ma.init_app(app)

    # 启用 CORS
    from flask_cors import CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # 注册蓝图
    from .routes.dzml_new_routes import dzml_new_bp
    app.register_blueprint(dzml_new_bp, url_prefix="/dzml_new")
    
    from .routes.instrument_routes import instrument_bp
    app.register_blueprint(instrument_bp, url_prefix="/instrument")

    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(rule)

    return app

