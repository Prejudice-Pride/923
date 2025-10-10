#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
三维地图系统 - 模块化后端服务器
整合模块化架构（4d、volume、data）+ SGS代理功能
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import hashlib
from dotenv import load_dotenv
import base64

# 导入模块注册器
from api.registry import APIModuleRegistry

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(
    title="三维地图可视化系统",
    description="基于Cesium.js的三维地图可视化平台（模块化架构）",
    version="2.0.0",
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 项目路径配置
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# 代理服务器白名单
PROXY_WHITELIST = [
    '124.17.4.220',  # Skyline SGS 服务器
]


# ========== 工具类（从app.py复制） ==========

class RateLimiter:
    """滑动窗口速率限制器"""

    def __init__(self, max_requests=100, time_window=60):
        self.max_requests = max_requests
        self.time_window = timedelta(seconds=time_window)
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, ip_address):
        with self.lock:
            now = datetime.now()
            cutoff_time = now - self.time_window

            # 清理过期记录
            self.requests[ip_address] = [
                timestamp for timestamp in self.requests[ip_address]
                if timestamp > cutoff_time
            ]

            # 检查限制
            if len(self.requests[ip_address]) >= self.max_requests:
                return False

            self.requests[ip_address].append(now)
            return True


class DataCache:
    """文件数据缓存，使用MD5校验"""

    def __init__(self):
        self.cache = {}
        self.file_hashes = {}
        self.lock = threading.Lock()

    def _get_file_hash(self, file_path):
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()

    def get_cached_data(self, file_path, data_type='json'):
        with self.lock:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"文件未找到: {file_path}")

            current_hash = self._get_file_hash(file_path)

            if file_path in self.cache and self.file_hashes.get(file_path) == current_hash:
                print(f"💾 缓存命中: {file_path}")
                return self.cache[file_path]

            print(f"📂 加载文件: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                if data_type == 'json':
                    import json
                    data = json.load(f)
                else:
                    data = f.read()

            self.cache[file_path] = data
            self.file_hashes[file_path] = current_hash
            return data

    def clear_cache(self, file_path=None):
        with self.lock:
            if file_path:
                self.cache.pop(file_path, None)
                self.file_hashes.pop(file_path, None)
            else:
                self.cache.clear()
                self.file_hashes.clear()


# 创建全局实例
rate_limiter = RateLimiter(max_requests=100, time_window=60)
data_cache = DataCache()


# ========== 工具函数 ==========

def get_auth_headers():
    """从环境变量获取SGS认证信息"""
    username = os.getenv('SGS_USERNAME', 'new')
    password = os.getenv('SGS_PASSWORD', 'new@123')
    token = os.getenv('SGS_ACCESS_TOKEN', '3578f6cc171b4eae86300eabe27f1686')

    auth_string = f"{username}:{password}"
    auth_base64 = base64.b64encode(auth_string.encode()).decode()

    return {
        'Authorization': f'Basic {auth_base64}',
        'X-Access-Token': token
    }


def get_client_ip(request: Request):
    """获取客户端IP地址"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host


# ========== 中间件 ==========

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """速率限制中间件"""
    client_ip = get_client_ip(request)

    # 对代理请求进行速率限制
    if request.url.path.startswith("/sgs-proxy/"):
        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "请求过于频繁，请稍后再试"}
            )

    response = await call_next(request)
    return response


# ========== 注册API模块 ==========

print("=" * 60)
print("🔧 正在注册API模块...")

registry = APIModuleRegistry()
discovered_modules = registry.discover_modules()

if discovered_modules:
    registry.register_all(app)
    print(f"✅ 成功注册 {len(discovered_modules)} 个模块: {discovered_modules}")
else:
    print("⚠️  未发现任何API模块")

print("=" * 60)


# ========== 核心路由 ==========

@app.get("/")
async def read_root():
    """重定向到主页"""
    return FileResponse(FRONTEND_DIR / "sgs-basic.html")


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "server": "FastAPI (Modular)",
        "modules": registry.list_modules(),
        "skyline_target": os.getenv('SGS_SERVER_URL', 'http://124.17.4.220:24088/SG'),
        "proxy_endpoint": "/sgs-proxy/"
    }


@app.api_route("/sgs-proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def sgs_proxy(path: str, request: Request):
    """通用 Skyline SGS 代理：转发 method、headers、body，返回原始响应内容和合适的 content-type"""
    try:
        client_ip = get_client_ip(request)

        # 构建目标URL
        query_string = str(request.url.query)
        sgs_server = os.getenv('SGS_SERVER_URL', 'http://124.17.4.220:24088/SG')
        sgs_server = sgs_server.rstrip('/')
        if sgs_server.lower().endswith('/sg'):
            target_base = sgs_server
        else:
            target_base = sgs_server + '/SG'

        target_url = f"{target_base}/{path}"
        if query_string:
            target_url += f"?{query_string}"

        print(f"🔁 代理目标: {target_url} (来自 {client_ip})")

        # 白名单验证
        from urllib.parse import urlparse
        parsed_target = urlparse(target_url)
        target_host = parsed_target.hostname

        if target_host not in PROXY_WHITELIST:
            raise HTTPException(
                status_code=403,
                detail=f"不允许代理到主机: {target_host}"
            )

        # 转发请求头（移除 Host，保留其他）
        forward_headers = {k: v for k, v in request.headers.items() if k.lower() != 'host'}

        # 读取请求 body
        body = await request.body()

        # 使用 requests 转发原始方法
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers=forward_headers,
            data=body if body else None,
            timeout=15,
            stream=True
        )

        # 准备返回头（过滤掉不适合直传的头）
        response_headers = {}
        for hk, hv in resp.headers.items():
            if hk.lower() in ('content-encoding', 'transfer-encoding', 'content-length', 'connection'):
                continue
            response_headers[hk] = hv

        content = resp.content

        return Response(content=content, status_code=resp.status_code, headers=response_headers, media_type=resp.headers.get('content-type'))

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"代理错误: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")


# ========== 挂载静态文件 ==========

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")


# ========== 启动服务器 ==========

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv('SERVER_PORT', 9700))
    host = os.getenv('SERVER_HOST', '0.0.0.0')

    print("")
    print("🚀 启动三维地图后端服务器（模块化架构）...")
    print(f"🌐 服务器地址: http://{host}:{port}")
    print(f"📄 网页地址: http://localhost:{port}/sgs-basic.html")
    print(f"📚 API文档: http://localhost:{port}/docs")
    print(f"🔗 代理地址: http://localhost:{port}/sgs-proxy/")
    print(f"📡 已注册模块: {registry.list_modules()}")
    print("=" * 60)

    uvicorn.run(app, host=host, port=port)
