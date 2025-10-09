"""
速度场可视化 - API路由
从4D项目迁移而来,提供完整的地下速度场数据集访问接口
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
import json
import h5py
import numpy as np
from datetime import datetime
import os

# 创建路由器,使用标准的/api前缀
router = APIRouter(prefix="/api", tags=["velocity-field"])

# 数据目录配置
DATASETS_DIR = Path(__file__).parent.parent.parent.parent.parent / "data" / "datasets"

# 日志配置
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'

# ============================================================================
# 日志工具函数
# ============================================================================

def log_debug(msg):
    """调试日志 - 仅在DEBUG=true时输出"""
    if DEBUG:
        print(f"[DEBUG] {datetime.now().strftime('%H:%M:%S')} {msg}")

def log_info(msg):
    """信息日志 - 始终输出"""
    print(f"[INFO]  {datetime.now().strftime('%H:%M:%S')} {msg}")

def log_error(msg):
    """错误日志 - 始终输出"""
    print(f"[ERROR] {datetime.now().strftime('%H:%M:%S')} {msg}")

# ============================================================================
# 工具函数
# ============================================================================

def get_dataset_path(dataset_name: str) -> Path:
    """获取数据集路径"""
    dataset_path = DATASETS_DIR / dataset_name
    if not dataset_path.exists():
        raise HTTPException(status_code=404, detail=f"数据集不存在: {dataset_name}")
    return dataset_path


def load_dataset_config(dataset_name: str) -> dict:
    """加载数据集配置"""
    config_path = get_dataset_path(dataset_name) / "dataset_config.json"
    if not config_path.exists():
        raise HTTPException(status_code=404, detail=f"配置文件不存在: {dataset_name}")
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ============================================================================
# 数据集管理API
# ============================================================================

@router.get("/datasets")
async def list_datasets():
    """获取所有数据集列表"""
    try:
        index_path = DATASETS_DIR / "datasets_index.json"
        if not index_path.exists():
            return {
                'success': True,
                'data': {'datasets': [], 'count': 0}
            }

        with open(index_path, 'r', encoding='utf-8') as f:
            index = json.load(f)

        return {
            'success': True,
            'data': index
        }
    except Exception as e:
        log_error(f"获取数据集列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/config")
async def get_dataset_config(dataset_name: str):
    """获取数据集配置信息"""
    try:
        config = load_dataset_config(dataset_name)
        return {
            'success': True,
            'data': config
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取数据集配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/ui-config")
async def get_ui_config(dataset_name: str):
    """获取数据集的UI配置文件"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        ui_config_path = dataset_path / "ui-config.json"

        if not ui_config_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f'UI配置文件不存在: {dataset_name}/ui-config.json'
            )

        with open(ui_config_path, 'r', encoding='utf-8') as f:
            ui_config = json.load(f)

        return ui_config

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取UI配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 速度场数据API
# ============================================================================

@router.get("/datasets/{dataset_name}/velocity/metadata")
async def get_velocity_metadata(dataset_name: str):
    """获取速度场元数据（网格信息、数据范围等）"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        h5_path = dataset_path / "velocity_model.h5"

        if not h5_path.exists():
            raise HTTPException(status_code=404, detail="速度场数据文件不存在")

        with h5py.File(h5_path, 'r') as f:
            metadata = {
                'grid': {
                    'longitude': f['grid/lon'][:].tolist(),
                    'latitude': f['grid/lat'][:].tolist(),
                    'depth': f['grid/depth'][:].tolist(),
                    'shape': {
                        'lon': len(f['grid/lon']),
                        'lat': len(f['grid/lat']),
                        'depth': len(f['grid/depth'])
                    }
                },
                'properties': ['vp', 'vs', 'vp_vs_ratio'],
                'statistics': {}
            }

            # 读取统计信息
            if 'statistics' in f:
                for prop in ['vp', 'vs', 'vp_vs_ratio']:
                    metadata['statistics'][prop] = {
                        'min': float(f[f'statistics/{prop}_min'][()]),
                        'max': float(f[f'statistics/{prop}_max'][()]),
                        'mean': float(f[f'statistics/{prop}_mean'][()])
                    }

        return {
            'success': True,
            'data': metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取速度场元数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/velocity/data")
async def get_velocity_data(
    dataset_name: str,
    property: str = Query(default='vp', description="属性名称: vp, vs, vp_vs_ratio")
):
    """获取速度场数据（体数据）"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        h5_path = dataset_path / "velocity_model.h5"

        if not h5_path.exists():
            raise HTTPException(status_code=404, detail="速度场数据文件不存在")

        with h5py.File(h5_path, 'r') as f:
            # 读取数据
            data = f[f'properties/{property}'][:]

            # 转换为列表（用于JSON序列化）
            # 数据形状: (depth, lat, lon)
            response = {
                'property': property,
                'shape': list(data.shape),
                'data': data.flatten().tolist(),  # 展平为1D数组
                'data_type': 'float32'
            }

        return {
            'success': True,
            'data': response
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取速度场数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/velocity/slice")
async def get_velocity_slice(
    dataset_name: str,
    property: str = Query(default='vp', description="属性名称: vp, vs, vp_vs_ratio"),
    axis: str = Query(default='depth', description="切片轴: depth, lat, lon"),
    index: int = Query(default=0, description="切片索引")
):
    """获取速度场切片（用于2D可视化或优化传输）"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        h5_path = dataset_path / "velocity_model.h5"

        if not h5_path.exists():
            raise HTTPException(status_code=404, detail="速度场数据文件不存在")

        with h5py.File(h5_path, 'r') as f:
            data = f[f'properties/{property}'][:]

            # 根据轴选择切片
            if axis == 'depth':
                slice_data = data[index, :, :]
            elif axis == 'lat':
                slice_data = data[:, index, :]
            elif axis == 'lon':
                slice_data = data[:, :, index]
            else:
                raise HTTPException(status_code=400, detail=f"无效的轴: {axis}")

            response = {
                'property': property,
                'axis': axis,
                'index': index,
                'shape': list(slice_data.shape),
                'data': slice_data.flatten().tolist()
            }

        return {
            'success': True,
            'data': response
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取速度场切片失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 地震数据API
# ============================================================================

@router.get("/datasets/{dataset_name}/earthquakes")
async def get_earthquakes(
    dataset_name: str,
    min_mag: float = Query(default=2.0, description="最小震级"),
    max_mag: float = Query(default=10.0, description="最大震级"),
    start_time: str = Query(default=None, description="开始时间"),
    end_time: str = Query(default=None, description="结束时间"),
    limit: int = Query(default=50000, description="返回数量限制")
):
    """获取地震目录数据"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        json_path = dataset_path / "earthquakes_filtered.json"

        if not json_path.exists():
            raise HTTPException(status_code=404, detail="地震数据文件不存在")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        earthquakes = data['earthquakes']

        # 筛选
        filtered = []
        for eq in earthquakes:
            if eq['magnitude'] < min_mag or eq['magnitude'] > max_mag:
                continue
            if start_time and eq['time'] < start_time:
                continue
            if end_time and eq['time'] > end_time:
                continue
            filtered.append(eq)
            if len(filtered) >= limit:
                break

        return {
            'success': True,
            'data': {
                'metadata': data['metadata'],
                'earthquakes': filtered,
                'total_returned': len(filtered)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取地震数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 断层数据API
# ============================================================================

@router.get("/datasets/{dataset_name}/faults")
async def get_faults(dataset_name: str):
    """获取断层数据"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        json_path = dataset_path / "faults_clipped.json"

        if not json_path.exists():
            raise HTTPException(status_code=404, detail="断层数据文件不存在")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return {
            'success': True,
            'data': data
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取断层数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 震源机制解API
# ============================================================================

@router.get("/datasets/{dataset_name}/focal-mechanisms")
async def get_focal_mechanisms(
    dataset_name: str,
    min_mag: float = Query(default=4.0, description="最小震级"),
    limit: int = Query(default=2000, description="返回数量限制")
):
    """获取震源机制解数据"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        json_path = dataset_path / "focal_mechanisms.json"

        if not json_path.exists():
            raise HTTPException(status_code=404, detail="震源机制解文件不存在")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        mechanisms = data['mechanisms']

        # 筛选
        filtered = [m for m in mechanisms if m['magnitude'] >= min_mag][:limit]

        return {
            'success': True,
            'data': {
                'metadata': data['metadata'],
                'mechanisms': filtered,
                'total_returned': len(filtered)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取震源机制解失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 地形数据API
# ============================================================================

@router.get("/datasets/{dataset_name}/terrain/config")
async def get_terrain_config(dataset_name: str):
    """获取地形配置信息"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        config_path = dataset_path / "terrain" / "terrain_config.json"

        if not config_path.exists():
            raise HTTPException(status_code=404, detail="地形配置文件不存在")

        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        return {
            'success': True,
            'data': config
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取地形配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/terrain/dem")
async def get_terrain_dem(dataset_name: str):
    """获取地形DEM数据（二进制文件）"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        dem_path = dataset_path / "terrain" / "dem" / "terrain.bin"

        if not dem_path.exists():
            raise HTTPException(status_code=404, detail="DEM数据文件不存在")

        return FileResponse(
            path=str(dem_path),
            media_type='application/octet-stream',
            filename='terrain.bin'
        )

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取DEM数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_name}/terrain/texture")
async def get_terrain_texture(dataset_name: str):
    """获取地形纹理图像"""
    try:
        dataset_path = get_dataset_path(dataset_name)
        texture_path = dataset_path / "terrain" / "image" / "terrain_texture.png"

        if not texture_path.exists():
            raise HTTPException(status_code=404, detail="地形纹理文件不存在")

        return FileResponse(
            path=str(texture_path),
            media_type='image/png',
            filename='terrain_texture.png'
        )

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取地形纹理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 地表图层API (城市、台站、断裂线、边界)
# ============================================================================

@router.get("/datasets/{dataset_name}/layers/{layer_name}")
async def get_surface_layer(dataset_name: str, layer_name: str):
    """获取地表图层数据 (GeoJSON格式)

    支持的图层:
    - cities: 城市点位数据
    - stations: 台站数据
    - fault_lines: 断裂线数据
    - boundary_national: 国界数据
    - boundary_province: 省界数据
    - boundary_city: 市界数据
    """
    try:
        dataset_path = get_dataset_path(dataset_name)
        layers_dir = dataset_path / "layers"

        # 允许的图层文件
        allowed_layers = {
            'cities': 'cities.json',
            'stations': 'stations.json',
            'fault_lines': 'fault_lines.json',
            'boundary_national': 'boundary_national.json',
            'boundary_province': 'boundary_province.json',
            'boundary_city': 'boundary_city.json'
        }

        if layer_name not in allowed_layers:
            raise HTTPException(
                status_code=400,
                detail=f'未知图层类型: {layer_name}'
            )

        layer_file = layers_dir / allowed_layers[layer_name]

        # Debug: 打印实际读取的文件路径和features数量
        log_debug(f"📄 读取图层文件: {layer_file.name}")
        log_debug(f"   绝对路径: {layer_file.absolute()}")
        log_debug(f"   文件大小: {layer_file.stat().st_size if layer_file.exists() else 'N/A'} bytes")

        if not layer_file.exists():
            log_error(f"图层文件不存在: {layer_file.name}")
            raise HTTPException(
                status_code=404,
                detail=f'图层文件不存在: {layer_file.name}'
            )

        # 读取并返回GeoJSON数据
        with open(layer_file, 'r', encoding='utf-8') as f:
            layer_data = json.load(f)
            features = layer_data.get('features', [])
            log_debug(f"   特征数量: {len(features)}")
            if features:
                geom = features[0]['geometry']
                log_debug(f"   📐 读取后几何类型: {geom['type']}")
                log_debug(f"   📐 坐标数量: {len(geom['coordinates'])}")

        return {
            'success': True,
            'data': layer_data
        }

    except HTTPException:
        raise
    except Exception as e:
        log_error(f"获取图层数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 健康检查
# ============================================================================

@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        'success': True,
        'status': 'healthy',
        'message': '速度场可视化模块运行正常'
    }
