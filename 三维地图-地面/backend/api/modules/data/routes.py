"""
三维地图数据API路由
提供断层、五代图、地震、台站、行政界线等数据
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
import csv

router = APIRouter(prefix="/api/data", tags=["data"])

# 数据目录 - 指向项目根目录的data/common文件夹
DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data" / "common"

@router.get("/fault-lines")
async def get_fault_lines():
    """获取断层线数据"""
    file_path = DATA_DIR / "fault_lines.geojson"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/generation-map")
async def get_generation_map():
    """获取五代图数据"""
    file_path = DATA_DIR / "generation_map.geojson"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/earthquakes")
async def get_earthquakes():
    """获取地震事件数据（转换为GeoJSON格式）"""
    file_path = DATA_DIR / "eqim.json"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 转换RECORDS格式为GeoJSON
        features = []
        for record in data.get('RECORDS', []):
            try:
                lon = float(record.get('Longitude', 0))
                lat = float(record.get('Latitude', 0))

                # 跳过无效坐标
                if lon == 0 and lat == 0:
                    continue

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": {
                        "id": record.get('Id'),
                        "source": record.get('Source'),
                        "datetime": record.get('Datetime'),
                        "epicenter": record.get('Epicenter'),
                        "depth": float(record.get('Depth', 0)),
                        "magnitude": float(record.get('Magnitude', 0)),
                        "eqType": record.get('EqType')
                    }
                }
                features.append(feature)
            except (ValueError, TypeError):
                continue

        geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        # 返回符合前端期望的格式
        return {
            "status": "success",
            "total": len(features),
            "data": geojson
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/stations")
async def get_stations():
    """获取台站数据（CSV转GeoJSON）"""
    csv_path = DATA_DIR / "stations.csv"

    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {csv_path}")

    try:
        features = []

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 提取经纬度（支持多种列名格式）
                lon = float(row.get('lon', row.get('longitude', row.get('long', 0))))
                lat = float(row.get('lat', row.get('latitude', 0)))

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": row
                }
                features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/country-boundary")
async def get_country_boundary():
    """获取国界数据"""
    file_path = DATA_DIR / "中国-国界.geojson"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/province-boundary")
async def get_province_boundary():
    """获取省界数据"""
    file_path = DATA_DIR / "中国-省界.geojson"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")

@router.get("/city-boundary")
async def get_city_boundary():
    """获取市界数据"""
    file_path = DATA_DIR / "中国-市界.geojson"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"数据文件不存在: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据加载失败: {str(e)}")
