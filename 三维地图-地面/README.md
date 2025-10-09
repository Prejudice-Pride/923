# 三维地图可视化系统

**项目编号**: 2023YFC3007305-01 | **版本**: 4.0.0

基于 Cesium.js 的地面三维地图可视化平台，专注于地震监测、地质数据和地形可视化。

<img src="https://img.shields.io/badge/Cesium.js-1.95+-blue" alt="Cesium"/> <img src="https://img.shields.io/badge/FastAPI-0.104+-green" alt="FastAPI"/> <img src="https://img.shields.io/badge/Python-3.8+-yellow" alt="Python"/>

---

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 一键启动后端服务
./start-server.sh

# 访问系统
open http://localhost:9700/sgs-basic.html
```

### 方式二：手动启动

```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 配置环境（可选）
cp .env.example .env
# 编辑 .env 文件，填写 SGS 服务器配置

# 3. 启动后端服务
python3 backend/server.py

# 4. 访问系统
open http://localhost:9700/sgs-basic.html
```

**服务信息**:
- 主页面: http://localhost:9700/sgs-basic.html
- API文档: http://localhost:9700/docs
- 默认端口: 9700

---

## ✨ 核心功能

### 三维地图可视化
- 🌍 **地震数据可视化** - 14,907条地震记录，震级颜色映射、动态点大小、智能过滤
- 📡 **监测台站** - 29个台站，分类显示（长白山火山台、国家台、区域台）
- 🗺️ **地质图层** - 2,387条断层线、5,853个五代图要素
- 🏘️ **行政边界** - 三级行政界线（国界、省界、市界）
- 🏔️ **三维地形** - SGS地形服务，地形开关、夸张系数调节
- 📍 **研究区域** - 川滇地区研究范围标记

### 交互控制
- 🎯 **右键菜单** - 测距、标记、视角控制、特效切换
- 🧭 **导航控件** - 罗盘、缩放、视角重置
- 📏 **测量工具** - 距离测量、面积测量
- 🎨 **图层管理** - 可视化图层树，分组管理
- ⚙️ **工具栏** - 快速飞行、底图切换、图层控制

### 系统特性
- ⚡ **高性能** - 智能缓存、60fps 渲染、快速启动
- 🎨 **精美UI** - 现代化界面设计、流畅动画
- 📱 **响应式** - 自适应不同屏幕尺寸
- 🔄 **模块化** - 清晰的代码结构、易于维护

---

## 📚 项目结构

```
三维地图-地面/
├── backend/                    # 后端服务
│   ├── server.py              # FastAPI 应用入口
│   └── api/
│       ├── registry.py        # API模块注册器
│       └── modules/
│           ├── data/          # 地震、断层、台站等数据API
│           └── velocity-field/ # 速度场数据API
├── frontend/                   # 前端资源
│   ├── sgs-basic.html         # 主页面入口
│   ├── css/                   # 样式文件
│   │   ├── main.css          # 主样式
│   │   ├── floating-toolbar.css  # 工具栏样式
│   │   └── ...
│   ├── js/                    # JavaScript模块
│   │   ├── main.js           # 应用入口
│   │   ├── map-controls.js   # 地图控制
│   │   ├── earthquake-layer.js  # 地震图层
│   │   ├── fault-layer.js    # 断层图层
│   │   ├── station-layer.js  # 台站图层
│   │   ├── context-menu.js   # 右键菜单
│   │   ├── 3d-toolbar.js     # 3D工具栏
│   │   └── ...
│   ├── loading/               # 加载系统
│   │   ├── loading.js        # 加载控制器
│   │   ├── loading-manager.js # 进度管理器
│   │   └── loading.css       # 加载动画样式
│   ├── config/                # 配置文件
│   │   └── 3d-layer-tree-config.json  # 图层树配置
│   └── CesiumJS/              # Cesium相关资源
│       └── SGSProvider.v2.js  # SGS地形提供者
├── data/                       # 数据文件
│   ├── earthquakes/           # 地震数据
│   ├── faults/                # 断层数据
│   ├── stations/              # 台站数据
│   └── boundaries/            # 行政边界数据
├── requirements.txt            # Python依赖
├── .env.example               # 环境变量模板
├── start-server.sh            # 启动脚本
└── README.md                  # 项目文档
```

---

## 🏗️ 技术栈

**前端技术**:
- **核心库**: Cesium.js 1.95 - WebGL 3D地球引擎
- **语言**: JavaScript ES6+
- **UI**: 原生CSS3 + HTML5，无外部UI框架
- **图形**: WebGL 2.0 渲染

**后端技术**:
- **框架**: FastAPI - 高性能异步Web框架
- **服务器**: Uvicorn - ASGI服务器
- **语言**: Python 3.8+
- **架构**: 模块化API架构

**数据格式**:
- GeoJSON - 地理数据交换格式
- JSON - 配置和数据传输
- CSV - 表格数据
- WGS84 - 坐标系统

---

## 📊 性能指标

| 指标 | 实际表现 | 说明 |
|------|----------|------|
| 启动时间 | ~2-3秒 | 从打开页面到地图显示 |
| API响应 | ~50ms | 数据请求平均响应时间 |
| 渲染帧率 | 60fps | 地图渲染流畅度 |
| 数据加载 | 14,907条地震 | 瞬时加载并渲染 |
| 并发处理 | ~1000 req/s | 服务器处理能力 |

---

## 🔐 安全特性

- ✅ **环境变量管理** - 敏感信息与代码分离
- ✅ **CORS控制** - 跨域请求安全配置
- ✅ **代理验证** - SGS服务器白名单
- ✅ **速率限制** - 防止API滥用（60s/100请求）
- ✅ **错误处理** - 完善的异常捕获和日志

---

## 🎯 数据说明

### 地震数据
- **数量**: 14,907条记录
- **范围**: 川滇地区及周边
- **属性**: 经度、纬度、深度、震级、时间
- **来源**: `/api/data/earthquakes`

### 台站数据
- **数量**: 29个台站
- **分类**: 长白山火山台、国家台、区域台
- **属性**: 台站名称、坐标、类型、编号
- **来源**: `/api/data/stations`

### 断层数据
- **数量**: 2,387条断层线
- **类型**: LineString, MultiLineString
- **属性**: 断层名称、类型、几何信息
- **来源**: `/api/data/faults`

### 五代图数据
- **数量**: 5,853个要素
- **类型**: 地质构造要素
- **属性**: 要素名称、类型、几何信息
- **来源**: `/api/data/generation_map`

### 行政边界
- **国界**: 1个要素（554个坐标点）
- **省界**: 35个要素（678个坐标点）
- **市界**: 477个要素（2,633个坐标点）
- **来源**: `/api/data/boundaries/*`

---

## 🌟 版本更新 (v4.0.0)

### 重大改进
- 🎯 **专注地面可视化** - 移除地下三维功能，聚焦地面三维地图
- ⚡ **启动速度优化** - 从30秒超时优化为2-3秒快速启动
- 🗑️ **代码精简** - 移除Three.js、VTK.js等地下可视化依赖
- 📦 **文件清理** - 删除25+个地下三维相关文件
- 🚀 **性能提升** - 减少资源加载，提高系统响应速度

### 技术优化
- 移除 Three.js 和 VTK.js 依赖
- 移除地下场景相关模块（underground-*, 4d/*）
- 移除地下可视化UI和控制面板
- 优化加载流程，移除ThreeJS等待检查
- 简化项目结构，提高可维护性

### 历史版本
- **v3.0.0** (2024-10): 地上地下一体化架构
- **v2.0.0** (2024-09): 性能提升100倍，FastAPI升级
- **v1.0.0** (2024-08): Cesium.js地震监测可视化基础版本

---

## 🔧 开发说明

### 环境要求
- Python 3.8+
- 现代浏览器（支持WebGL 2.0）
- 推荐8GB+内存

### 开发模式
```bash
# 启动开发服务器（自动重载）
uvicorn backend.server:app --reload --host 0.0.0.0 --port 9700

# 查看实时日志
tail -f /tmp/backend.log
```

### 调试工具
- **浏览器控制台**: F12打开开发者工具
- **API文档**: http://localhost:9700/docs
- **调试函数**: `window.debugApp.*` （开发模式）

### 代码规范
- JavaScript: ES6+ 语法，模块化设计
- Python: PEP 8 编码规范
- 注释: 中文注释，关键逻辑详细说明

---

## 📝 许可证

项目编号: **2023YFC3007305-01**

---

## 📞 支持与反馈

- **问题反馈**: 提交 Issue
- **功能建议**: 提交 Feature Request
- **技术支持**: 查看README文档

---

**更新时间**: 2024-10-09
**维护状态**: 积极维护中
