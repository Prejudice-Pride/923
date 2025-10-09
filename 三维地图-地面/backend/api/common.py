"""
通用数据集API
提供数据集列表、元信息等通用接口
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from typing import List, Dict, Any

router = APIRouter(
    prefix="/api/datasets",
    tags=["Datasets"]
)

# 数据集根目录
DATASETS_ROOT = Path(__file__).parent.parent / "datasets"


@router.get("/")
async def list_datasets() -> Dict[str, Any]:
    """
    获取所有可用数据集列表

    Returns:
        数据集列表
    """
    datasets = []

    if not DATASETS_ROOT.exists():
        return {"status": "success", "datasets": []}

    for dataset_dir in DATASETS_ROOT.iterdir():
        if not dataset_dir.is_dir():
            continue

        meta_file = dataset_dir / "meta.json"
        if not meta_file.exists():
            continue

        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                datasets.append(meta)
        except Exception as e:
            print(f"读取数据集元信息失败 {dataset_dir.name}: {e}")

    return {
        "status": "success",
        "datasets": datasets,
        "count": len(datasets)
    }


@router.get("/{dataset_id}/meta")
async def get_dataset_meta(dataset_id: str) -> Dict[str, Any]:
    """
    获取指定数据集的元信息

    Args:
        dataset_id: 数据集ID

    Returns:
        数据集元信息
    """
    meta_file = DATASETS_ROOT / dataset_id / "meta.json"

    if not meta_file.exists():
        raise HTTPException(status_code=404, detail=f"数据集不存在: {dataset_id}")

    try:
        with open(meta_file, 'r', encoding='utf-8') as f:
            meta = json.load(f)
            return {
                "status": "success",
                "data": meta
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/structure")
async def get_dataset_structure(dataset_id: str) -> Dict[str, Any]:
    """
    获取数据集目录结构

    Args:
        dataset_id: 数据集ID

    Returns:
        目录结构信息
    """
    dataset_dir = DATASETS_ROOT / dataset_id

    if not dataset_dir.exists():
        raise HTTPException(status_code=404, detail=f"数据集不存在: {dataset_id}")

    structure = {
        "surface": {},
        "underground": {}
    }

    # 扫描surface目录
    surface_dir = dataset_dir / "surface"
    if surface_dir.exists():
        structure["surface"] = {
            "exists": True,
            "files": [f.name for f in surface_dir.iterdir() if f.is_file()]
        }

    # 扫描underground目录
    underground_dir = dataset_dir / "underground"
    if underground_dir.exists():
        structure["underground"] = {
            "exists": True,
            "files": [f.name for f in underground_dir.iterdir() if f.is_file()]
        }

    return {
        "status": "success",
        "data": structure
    }
