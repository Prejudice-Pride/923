// SGS服务器连接和数据管理模块 - 仅加载参考文件中的地形和影像
// 基于参考文件 sgs-basic-3.html 的配置，只保留 Earthdata 地形和云南影像

// SGS_SERVER 已在 HTML 文件中定义

// 全局状态
let connected = false;

// 状态管理函数
function setStatus(msg) {
  console.log('[SGS]', msg);
  // 更新状态栏显示
  const statusEl = document.querySelector('#bottombar .status-value');
  if (statusEl) {
    statusEl.textContent = msg;
  }
}

async function connectSGS() {
  if (connected) return;
  setStatus('正在连接 SGS 服务器…');
  await SGSProvider.connect(window.SGS_SERVER);
  connected = true;
  setStatus('✅ 已连接 SGS');
  // 调整加载顺序：先加载地形，再加载云南影像确保云南在最上层
  // 1. 先加载地形（基础图层）
  await loadTerrainEarthdata();
  // 2. 再加载云南影像（覆盖在地形之上）
  await loadYunnanImagery();
}

async function loadYunnanImagery() {
  setStatus('加载云南影像 (398046)…');
  await SGSProvider.loadLayers("398046", _ResourceType.ID_OR_ALIAS, _LayerType.IMAGERY);

  // 优化的影像透明处理函数 - 支持多种无数据颜色
  const applyEnhancedTransparency = (layerIndex = -1) => {
    const layers = viewer.scene.imageryLayers;
    if (layers.length === 0) return false;

    // 获取目标图层 - 默认为最新添加的图层
    let targetLayer;
    if (layerIndex >= 0 && layerIndex < layers.length) {
      targetLayer = layers.get(layerIndex);
    } else {
      targetLayer = layers.get(layers.length - 1);
    }

    if (!targetLayer) return false;

    // 应用云南影像专用的透明设置
    try {
      // 只处理纯黑色无数据区域 (RGB: 0,0,0)
      // 使用非常小的阈值，避免影响正常的深色区域
      targetLayer.colorToAlpha = Cesium.Color.BLACK;
      targetLayer.colorToAlphaThreshold = 0.004; // 使用稍大的值，但仍然很小

      // 透明处理已应用
      return true;
    } catch (error) {
      console.warn('[透明处理] 设置失败:', error);
      return false;
    }
  };

  // 立即尝试应用透明处理
  let success = applyEnhancedTransparency();

  // 如果首次失败，延迟重试（处理异步加载）
  if (!success) {
    const retryTransparency = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
        success = applyEnhancedTransparency();
        if (success) {
          // 重试成功
          break;
        }
      }
      if (!success) {
        console.warn('[透明处理] 所有重试均失败');
      }
    };
    retryTransparency();
  }

  // 监听新图层添加事件，自动应用透明处理
  const onLayerAdded = viewer.imageryLayers.layerAdded;
  if (onLayerAdded && onLayerAdded.addEventListener) {
    const layerAddedHandler = (_layer, index) => {
      // 为新添加的图层应用透明处理
      setTimeout(() => applyEnhancedTransparency(index), 100);
    };

    // 添加事件监听器
    const removeHandler = onLayerAdded.addEventListener(layerAddedHandler);

    // 10秒后自动移除监听器，避免内存泄漏
    setTimeout(() => {
      if (removeHandler) {
        removeHandler();
      }
    }, 10000);
  }

  // 平滑飞行到云南区域（从地球整体到云南上方）
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(102.7129, 25.0389, 80000),
    orientation: { heading: 0.0, pitch: Cesium.Math.toRadians(-45), roll: 0.0 },
    duration: 3.0  // 3秒飞行时间
  });

  setStatus('✅ 云南影像加载完成（已设置透明处理）');
}

async function loadTerrainEarthdata() {
  setStatus('加载 Earthdata 地形 (398041)…');
  // 先整体加载（RasterComplex），通常会加入影像图层
  await SGSProvider.loadLayers("398041");

  // 不对 Earthdata 图层进行透明处理，保持原有颜色

  // 等待地形提供者可能的自动切换
  await new Promise(r => setTimeout(r, 2500));

  // 如仍无地形，尝试显式加载 ELEVATION
  let terrainType = viewer.scene.globe.terrainProvider.constructor.name;
  if (terrainType === 'EllipsoidTerrainProvider') {
    setStatus('未检测到地形，尝试显式加载 ELEVATION…');
    await SGSProvider.loadLayers("398041", _ResourceType.ID_OR_ALIAS, _LayerType.ELEVATION);
    await new Promise(r => setTimeout(r, 2000));
    terrainType = viewer.scene.globe.terrainProvider.constructor.name;
  }


  if (viewer.scene.globe.terrainProvider.constructor.name !== 'EllipsoidTerrainProvider') {
    // 保存默认地形夸张值
    if (!window.originalTerrainExaggeration) {
      window.originalTerrainExaggeration = 3.0;
    }
    // 默认显示地形(夸张值3.0)
    viewer.scene.globe.terrainExaggeration = 3.0;
    viewer.scene.globe.enableLighting = false; // 关闭光照效果，避免白天黑夜阴影
    setStatus('✅ Earthdata 地形加载完成(夸张值3.0)');

    // 按照参考文件流程：最后进行PNG解码切换
    forcePngDecode();
  } else {
    setStatus('⚠️ Earthdata 仅加载了影像，未检测到地形（可能该资源不含高程或无权限）');
  }
}


// 强制将 SGSTerrainProvider 切换为 PNG 解码（用于 MPT 解码异常时的快速验证）
function forcePngDecode() {
  const tp = viewer?.scene?.globe?.terrainProvider;
  if (!tp || tp.constructor?.name !== 'SGSTerrainProvider') {
    setStatus('当前地形不是 SGSTerrainProvider');
    return;
  }
  // 切换格式与模板
  if (tp._format !== 'png') {
    tp._isMPT = false;
    tp._format = 'png';
    if (typeof tp._urlTemplate === 'string') {
      tp._urlTemplate = tp._urlTemplate.replace('Format=image/mpt', 'Format=image/png');
    }
    // 清空请求缓存，促使新请求按 PNG 走
    tp._requestsCache = {};
    tp._requestsCacheKeys = [];
    setStatus('已切换为 PNG 解码并清空缓存');
  } else {
    setStatus('已在使用 PNG 解码');
  }
}


// 通用透明处理工具函数
function applyImageryTransparency(layerIndex, options = {}) {
  const {
    color = Cesium.Color.BLACK,          // 要设为透明的颜色
    threshold = 0.00001,                 // 颜色阈值
    alpha = undefined,                   // 整体透明度 (0-1)
    logInfo = true                       // 是否输出日志
  } = options;

  const layers = viewer.scene.imageryLayers;
  if (layers.length === 0) {
    if (logInfo) console.warn('[透明处理] 没有可用的影像图层');
    return false;
  }

  // 获取目标图层
  let targetLayer;
  if (typeof layerIndex === 'number' && layerIndex >= 0 && layerIndex < layers.length) {
    targetLayer = layers.get(layerIndex);
  } else if (layerIndex === 'top' || layerIndex === undefined) {
    targetLayer = layers.get(layers.length - 1);
  } else if (layerIndex === 'yunnan') {
    // 查找云南影像图层（通常是第二个图层）
    targetLayer = layers.length > 1 ? layers.get(1) : layers.get(layers.length - 1);
  } else if (layerIndex === 'earthdata') {
    // 查找 Earthdata 图层（通常是最后添加的）
    for (let i = layers.length - 1; i >= 1; i--) {
      targetLayer = layers.get(i);
      if (targetLayer) break;
    }
  }

  if (!targetLayer) {
    if (logInfo) console.warn('[透明处理] 无法找到目标图层');
    return false;
  }

  try {
    // 设置颜色透明
    targetLayer.colorToAlpha = color;
    targetLayer.colorToAlphaThreshold = threshold;

    // 设置整体透明度
    if (alpha !== undefined && alpha >= 0 && alpha <= 1) {
      targetLayer.alpha = alpha;
    }

    if (logInfo) {
      const colorName = color === Cesium.Color.BLACK ? '黑色' :
                       color === Cesium.Color.WHITE ? '白色' :
                       '自定义颜色';
      console.log(`[透明处理] 图层 ${layers.indexOf(targetLayer)} 设置 ${colorName} 透明，阈值: ${threshold}`);
      if (alpha !== undefined) {
        console.log(`[透明处理] 图层 ${layers.indexOf(targetLayer)} 整体透明度: ${Math.round(alpha * 100)}%`);
      }
    }

    return true;
  } catch (error) {
    if (logInfo) console.warn('[透明处理] 设置失败:', error);
    return false;
  }
}

// 预设的透明处理方案
const transparencyPresets = {
  // 黑色无数据透明（最常用）
  blackNoData: (layerIndex) => applyImageryTransparency(layerIndex, {
    color: Cesium.Color.BLACK,
    threshold: 0.00001
  }),

  // 白色背景透明
  whiteBackground: (layerIndex) => applyImageryTransparency(layerIndex, {
    color: Cesium.Color.WHITE,
    threshold: 0.00001
  }),

  // 近黑色透明（包含深灰色）
  nearBlack: (layerIndex) => applyImageryTransparency(layerIndex, {
    color: Cesium.Color.BLACK,
    threshold: 0.1  // 更大的阈值包含近黑色
  }),

  // 半透明效果
  semiTransparent: (layerIndex, alphaValue = 0.7) => applyImageryTransparency(layerIndex, {
    color: Cesium.Color.BLACK,
    threshold: 0.00001,
    alpha: alphaValue
  }),

  // 云南影像专用预设
  yunnanOptimized: () => {
    return applyImageryTransparency('yunnan', {
      color: Cesium.Color.BLACK,
      threshold: 0.00001
    });
  },

  // Earthdata 影像专用预设
  earthdataOptimized: () => {
    return applyImageryTransparency('earthdata', {
      color: Cesium.Color.BLACK,
      threshold: 0.00001
    });
  }
};

// 视图切换器实例
let viewSwitcher = null;

// 初始化ViewSwitcher
async function initViewSwitcher() {
  if (!window.ViewSwitcher) {
    console.warn('[SGS] ViewSwitcher 类未加载');
    return;
  }

  try {
    viewSwitcher = new ViewSwitcher();

    await viewSwitcher.initialize({
      surface: document.getElementById('cesiumContainer'),
      underground: document.getElementById('undergroundContainer')
    });

    // 设置 Cesium viewer 引用（用于恢复渲染）
    if (window.viewer) {
      viewSwitcher.setCesiumViewer(window.viewer);
    }

    console.log('[SGS] ✅ ViewSwitcher 初始化完成');
  } catch (error) {
    console.error('[SGS] ❌ ViewSwitcher 初始化失败:', error);
  }
}

// 切换到地上视图
function switchToSurface() {
  if (viewSwitcher) {
    viewSwitcher.showSurface();
  } else {
    console.warn('[SGS] ViewSwitcher 未初始化');
  }
}

// 切换到地下视图
// moduleType: 'volume' (简单体渲染) 或 '4d' (完整4D功能)
async function switchToUnderground(datasetId = 'chuandian', moduleType = 'volume') {
  if (viewSwitcher) {
    await viewSwitcher.showUnderground(datasetId, moduleType);
  } else {
    console.warn('[SGS] ViewSwitcher 未初始化');
  }
}

// 导出函数供其他模块使用
window.SGSManager = {
  connectSGS,
  loadYunnanImagery,
  loadTerrainEarthdata,
  forcePngDecode,
  setStatus,
  applyImageryTransparency,
  transparencyPresets,
  initViewSwitcher,
  switchToSurface,
  switchToUnderground,
  get connected() { return connected; },
  get SGS_SERVER() { return window.SGS_SERVER || "http://124.17.4.220:24088/SG"; },
  get viewSwitcher() { return viewSwitcher; }
};