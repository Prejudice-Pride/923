from flask import Blueprint, jsonify, request
from app import db
from app.models.instrument import Instrument
from app.schemas.instrument_schemas import InstrumentSchema

instrument_bp = Blueprint("instrument", __name__)
instrument_schema = InstrumentSchema(many=True)


# 测试路径 http://127.0.0.1:5000/instrument/all
@instrument_bp.route("/all", methods=["GET"])
def list_instruments():
    """获取全部仪器信息"""
    try:
        all_data = Instrument.query.all()
        data = instrument_schema.dump(all_data)
        return jsonify({"data": data, "total": len(data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
# 测试路径示例：
# http://127.0.0.1:5000/instrument/page?page=1&size=10
@instrument_bp.route("/page", methods=["GET"])
def get_instruments_paginated():
    """
    分页获取仪器信息
    示例：
        GET /instrument/page?page=1&size=10
    """
    try:
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 10))

        query = Instrument.query
        total = query.count()
        paged_data = query.offset((page - 1) * size).limit(size).all()
        data = instrument_schema.dump(paged_data)

        return jsonify({
            "page": page,
            "size": size,
            "total": total,
            "pages": (total + size - 1) // size,
            "count": len(data),
            "data": data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500