from flask import Blueprint, jsonify, request
from app import db
from app.models.dzml_new import DzmlNew
from app.schemas.dzml_new_schemas import DzmlNewSchema

dzml_new_bp = Blueprint("dzml_new", __name__)
dzml_new_schema = DzmlNewSchema(many=True)

@dzml_new_bp.route("/all", methods=["GET"])
def list_earthquakes():
    try:
        all_data = DzmlNew.query.all()
        data = dzml_new_schema.dump(all_data)
        return jsonify({"data": data, "total": len(data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dzml_new_bp.route("/page", methods=["GET"])
def list_earthquakes_paginated():
    try:
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 10))

        query = DzmlNew.query
        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()

        data = dzml_new_schema.dump(items)
        return jsonify({"data": data, "total": total, "page": page, "size": size})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
