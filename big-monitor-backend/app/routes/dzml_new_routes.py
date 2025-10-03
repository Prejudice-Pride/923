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

# 分页展示全国地震信息
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

# 聚合展示全国地震信息
@dzml_new_bp.route("/aggregated", methods=["GET"])
def aggregated_earthquakes():
    try:
        all_data = DzmlNew.query.all()  # ORM 对象列表

        grouped = {}
        for record in all_data:
            province = extract_province(record.DiMing)
            if province not in grouped:
                grouped[province] = {
                    "count": 0,
                    "max_magnitude": None,
                    "latest_time": None,
                    "examples": [],
                }

            grouped[province]["count"] += 1

            # 最大震级
            mc_val = float(record.mc) if record.mc is not None else None
            if mc_val is not None:
                if grouped[province]["max_magnitude"] is None or mc_val > grouped[province]["max_magnitude"]:
                    grouped[province]["max_magnitude"] = mc_val

            # 最新时间
            if record.RiQi:
                if grouped[province]["latest_time"] is None or record.RiQi > grouped[province]["latest_time"]:
                    grouped[province]["latest_time"] = record.RiQi

            # 示例数据（最多 3 条）
            if len(grouped[province]["examples"]) < 3:
                grouped[province]["examples"].append(
                    {
                        "diming": record.DiMing,
                        "magnitude": mc_val,
                        "time": record.RiQi.strftime("%Y-%m-%d %H:%M:%S") if record.RiQi else None,
                    }
                )

        results = []
        for province, stats in grouped.items():
            entry = {
                "province": province,
                "count": stats["count"],
                "max_magnitude": stats["max_magnitude"],
                "latest_time": stats["latest_time"].strftime("%Y-%m-%d %H:%M:%S")
                if stats["latest_time"] else None,
                "examples": stats["examples"],
            }

            if province in PROVINCE_CAPITALS:
                entry["capital"] = province
                entry["coord"] = PROVINCE_CAPITALS[province]
            else:
                entry["capital"] = None
                
                entry["coord"] = None

            results.append(entry)

        return jsonify({"data": results, "total_provinces": len(results)})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# 省份到省会坐标（GCJ-02，适配高德地图）
PROVINCE_CAPITALS = {
    "北京": [116.4074, 39.9042],
    "天津": [117.2000, 39.1333],
    "上海": [121.4737, 31.2304],
    "重庆": [106.5516, 29.5630],
    "四川": [104.0668, 30.5728],
    "广东": [113.2644, 23.1291],
    "新疆": [87.6168, 43.8256],
    "云南": [102.8332, 24.8801],
    "西藏": [91.1175, 29.6473],
    "陕西": [108.9402, 34.3416],
    "甘肃": [103.8343, 36.0611],
    "青海": [101.7778, 36.6173],
    "宁夏": [106.2325, 38.4864],
    "内蒙古": [111.7656, 40.8174],
    "广西": [108.3275, 22.8150],
    "贵州": [106.7074, 26.5982],
    "湖南": [112.9389, 28.2278],
    "湖北": [114.3054, 30.5931],
    "河南": [113.6654, 34.7570],
    "山东": [117.1201, 36.6512],
    "山西": [112.5624, 37.8735],
    "河北": [114.5149, 38.0428],
    "安徽": [117.2830, 31.8612],
    "江苏": [118.7969, 32.0603],
    "浙江": [120.1551, 30.2741],
    "福建": [119.2965, 26.0745],
    "江西": [115.9100, 28.6742],
    "辽宁": [123.4291, 41.7968],
    "吉林": [125.3245, 43.8868],
    "黑龙江": [126.6425, 45.7560],
    "海南": [110.3486, 20.0186],
    "香港": [114.1694, 22.3193],
    "澳门": [113.5491, 22.1987],
    "台湾": [121.5091, 25.0443],
}


# 解析省份
def extract_province(diming: str) -> str:
    if not diming:
        return "未知"
    for province in PROVINCE_CAPITALS.keys():
        if province in diming:
            return province
    return "未知"
