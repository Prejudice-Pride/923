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

from flask import Blueprint, jsonify, request
from app import db
from app.models.dzml_new import DzmlNew
from app.schemas.dzml_new_schemas import DzmlNewSchema

dzml_new_bp = Blueprint("dzml_new", __name__)
dzml_new_schema = DzmlNewSchema(many=True)


@dzml_new_bp.route("/all", methods=["GET"])
def list_earthquakes():
    """返回所有地震信息"""
    try:
        all_data = DzmlNew.query.all()
        data = dzml_new_schema.dump(all_data)
        return jsonify({"data": data, "total": len(data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 测试路径 http://127.0.0.1:5000/dzml_new/province?name=辽宁省
@dzml_new_bp.route("/province", methods=["GET"])
def get_earthquakes_by_province():
    """
    按省份（根据地名字段 DiMing 自动匹配）查询地震信息
    示例：
        GET dzml_new/province?name=辽宁省
        GET dzml_new/province?name=辽宁
    """
    try:
        province_name = request.args.get("name", "").strip()
        if not province_name:
            return jsonify({"error": "缺少参数 name（省份名称）"}), 400

        # 读取数据库全部地震数据
        all_data = DzmlNew.query.all()

        # 按照地名字段 DiMing 匹配所属省份
        filtered = []
        for record in all_data:
            province = extract_province(record.DiMing)
            if province_name.replace("省", "").replace("市", "") in province:
                filtered.append(record)

        # 序列化
        data = dzml_new_schema.dump(filtered)
        return jsonify({
            "province": province_name,
            "count": len(data),
            "data": data
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ----------------------------
# 辅助函数和省份字典（与聚合代码共用）
# ----------------------------

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


def extract_province(diming: str) -> str:
    """根据地名字符串解析出所属省份"""
    if not diming:
        return "未知"
    for province in PROVINCE_CAPITALS.keys():
        if province in diming:
            return province
    return "未知"

# 测试路径示例：
# http://127.0.0.1:5000/dzml_new/province/page?name=辽宁&page=1&size=10

@dzml_new_bp.route("/province/page", methods=["GET"])
def get_earthquakes_by_province_paginated():
    """
    按省份分页查询地震信息（根据 DiMing 自动匹配省份）
    示例：
        GET /dzml_new/province/page?name=辽宁&page=1&size=10
    """
    try:
        # 获取查询参数
        province_name = request.args.get("name", "").strip()
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 10))

        if not province_name:
            return jsonify({"error": "缺少参数 name（省份名称）"}), 400

        # ------------------------
        # Step 1: 读取全部数据（后续可优化为数据库模糊匹配）
        # ------------------------
        all_data = DzmlNew.query.all()

        # Step 2: 过滤出匹配指定省份的数据
        filtered = []
        for record in all_data:
            province = extract_province(record.DiMing)
            if province_name.replace("省", "").replace("市", "") in province:
                filtered.append(record)

        # ------------------------
        # Step 3: 手动分页
        # ------------------------
        total = len(filtered)
        start = (page - 1) * size
        end = start + size
        paged_data = filtered[start:end]

        # Step 4: 序列化
        data = dzml_new_schema.dump(paged_data)

        # Step 5: 返回分页结果
        return jsonify({
            "province": province_name,
            "page": page,
            "size": size,
            "total": total,
            "pages": (total + size - 1) // size,  # 计算总页数
            "count": len(data),
            "data": data
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
