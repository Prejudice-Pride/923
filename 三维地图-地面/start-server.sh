#!/bin/bash

cd "$(dirname "$0")"

echo "======================================"
echo "三维地图可视化系统"
echo "项目编号: 2023YFC3007305-01"
echo "版本: v4.0.0"
echo "======================================"
echo ""
echo "🚀 启动后端服务器..."
echo ""
echo "📍 服务信息:"
echo "   - API服务: http://localhost:9700"
echo "   - 主页面: http://localhost:9700/sgs-basic.html"
echo "   - API文档: http://localhost:9700/docs"
echo ""
echo "⏱️  启动完成后，请在浏览器中访问:"
echo "   👉 http://localhost:9700/sgs-basic.html"
echo ""
echo "💡 提示: 按 Ctrl+C 停止服务器"
echo "======================================"
echo ""

python3 backend/server.py
