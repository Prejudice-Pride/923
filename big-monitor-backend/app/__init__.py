from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from .config import Config

db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    ma.init_app(app)

    # 注册路由
    from .routes.dzml_new_routes import dzml_new_bp
    app.register_blueprint(dzml_new_bp, url_prefix="/dzml_new")
    
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(rule)

    return app
