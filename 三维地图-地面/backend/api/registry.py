"""
API模块注册器 - 自动发现和注册后端API模块
支持动态加载api/modules/目录下的所有模块
"""
import os
import importlib
from pathlib import Path
from typing import Dict, List


class APIModuleRegistry:
    """API模块注册器"""

    def __init__(self):
        self.modules: Dict[str, dict] = {}

    def discover_modules(self) -> List[str]:
        """
        自动发现api/modules/目录下的所有模块

        Returns:
            发现的模块名称列表
        """
        modules_dir = Path(__file__).parent / "modules"

        if not modules_dir.exists():
            print(f"[Registry] 模块目录不存在: {modules_dir}")
            return []

        discovered = []

        for module_dir in modules_dir.iterdir():
            if not module_dir.is_dir():
                continue

            # 检查是否有routes.py文件
            routes_file = module_dir / "routes.py"
            if not routes_file.exists():
                continue

            module_name = module_dir.name
            self.modules[module_name] = {
                "path": str(module_dir),
                "routes_file": str(routes_file)
            }
            discovered.append(module_name)

        print(f"[Registry] 发现 {len(discovered)} 个API模块: {discovered}")
        return discovered

    def register_all(self, app):
        """
        注册所有发现的模块到FastAPI应用

        Args:
            app: FastAPI应用实例
        """
        for module_name, info in self.modules.items():
            try:
                # 动态导入模块的routes
                routes_module = importlib.import_module(f"api.modules.{module_name}.routes")

                # 注册router
                if hasattr(routes_module, 'router'):
                    app.include_router(routes_module.router)
                    print(f"[Registry] ✅ 已注册模块: {module_name}")
                else:
                    print(f"[Registry] ⚠️  模块 {module_name} 没有router对象")

            except Exception as e:
                print(f"[Registry] ❌ 注册模块 {module_name} 失败: {e}")

    def get_module_info(self, module_name: str) -> dict:
        """获取模块信息"""
        return self.modules.get(module_name, {})

    def list_modules(self) -> List[str]:
        """列出所有已注册的模块"""
        return list(self.modules.keys())
