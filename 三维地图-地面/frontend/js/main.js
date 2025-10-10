// 三维地图主入口文件
// 重构后的模块化架构，整合各功能模块

// 全局变量
let viewer;

// 实际的应用初始化函数
async function initializeApplication() {
  try {
    // 1. 初始化Cesium viewer
    if (window.loadingController?.loadingManager) {
      window.loadingController.loadingManager.updateTask('cesium', 80, '初始化 Cesium 场景...');
    }
    viewer = window.MapControls.initViewer();
    window.viewer = viewer; // 全局引用

    // 设置工具栏的viewer引用
    if (window.simpleToolbar) {
      window.simpleToolbar.setViewer(viewer);
    }

    // 1.1 初始化 Cesium Widget 导航控件（罗盘）
    if (typeof Cesium.CesiumWidgetMixin !== 'undefined') {
      try {
        viewer.extend(Cesium.CesiumWidgetMixin);
        viewer.compass.enabled = true;
        viewer.zoomController.enabled = false; // 使用自定义缩放按钮
        console.log('✅ Cesium Widget 罗盘已初始化');
      } catch (e) {
        console.warn('⚠️ Cesium Widget 初始化失败:', e);
      }
    }

    // 1.2 初始化自定义导航控件（按钮组）
    if (typeof CustomNavigation !== 'undefined') {
      try {
        CustomNavigation.init(viewer);
        console.log('✅ 自定义导航控件已初始化');
      } catch (e) {
        console.warn('⚠️ 自定义导航控件初始化失败:', e);
      }
    }

    if (window.loadingController?.loadingManager) {
      window.loadingController.loadingManager.completeTask('cesium');
    }

    // 2. 设置鼠标位置追踪
    window.MapControls.setupMousePos();

    // 3. 初始化按钮状态
    window.MapControls.initButtonStates();

    // 4. 启动更新循环
    window.MapControls.startUpdateLoop();

    // 5. 初始化UI控制
    window.UIControls.initUIControls();


    // 7. 连接SGS服务器并加载数据（与加载进度同步）
    if (window.loadingController?.loadingManager) {
      window.loadingController.loadingManager.updateTask('sgs', 50, '连接 SGS 服务器...');
    }
    await window.SGSManager.connectSGS();
    if (window.loadingController?.loadingManager) {
      window.loadingController.loadingManager.completeTask('sgs');
      window.loadingController.loadingManager.completeTask('terrain');
      window.loadingController.loadingManager.completeTask('imagery');
      window.loadingController.loadingManager.completeTask('scene', '场景初始化完成');
    }

    // 8. 初始化新的图层模块
    try {
      // 初始化断层图层
      if (window.FaultLayer) {
        window.faultLayer = new FaultLayer(viewer);
        await window.faultLayer.initialize();
        await window.faultLayer.loadData();
        console.log('✅ 断层图层已初始化');
      }

      // 初始化五代图图层
      if (window.GenerationLayer) {
        window.generationLayer = new GenerationLayer(viewer);
        await window.generationLayer.initialize();
        await window.generationLayer.loadData();
        console.log('✅ 五代图图层已初始化');
      }

      // 初始化行政界线管理器
      if (window.AdministrativeBoundaryManager) {
        window.administrativeBoundaryManager = new AdministrativeBoundaryManager(viewer);
        await window.administrativeBoundaryManager.initialize();
        console.log('✅ 行政界线管理器已初始化');
      }

      // 初始化台站图层
      if (window.StationLayer) {
        window.stationLayer = new StationLayer(viewer);
        await window.stationLayer.initialize();
        await window.stationLayer.loadStations();
        window.stationLayer.hide(); // 默认隐藏
        console.log('✅ 台站图层已初始化');
      }

      // 初始化地震图层
      if (window.EarthquakeLayer) {
        window.earthquakeLayer = new EarthquakeLayer(viewer);
        await window.earthquakeLayer.initialize();
        await window.earthquakeLayer.loadEarthquakes();
        window.earthquakeLayer.hide(); // 默认隐藏
        console.log('✅ 地震图层已初始化');
      }

      // 获取行政界线图层实例并加载数据
      if (window.administrativeBoundaryManager) {
        await window.administrativeBoundaryManager.loadAllLayers();
        window.countryBoundary = window.administrativeBoundaryManager.countryLayer;
        window.provinceBoundary = window.administrativeBoundaryManager.provinceLayer;
        window.cityBoundary = window.administrativeBoundaryManager.cityLayer;
        // 默认隐藏所有行政界线
        if (window.countryBoundary) window.countryBoundary.hide();
        if (window.provinceBoundary) window.provinceBoundary.hide();
        if (window.cityBoundary) window.cityBoundary.hide();
      }

      // 初始化研究区域图层（川滇地区）
      if (window.ResearchAreaLayer) {
        window.chuandianArea = new ResearchAreaLayer(viewer, {
          id: 'chuandian-area',
          name: '川滇地区',
          bounds: {
            minLon: 97.0,
            maxLon: 108.0,
            minLat: 21.0,
            maxLat: 34.0
          },
          datasetPath: '/data/datasets/velocity-field-chuandian'
        });
        window.chuandianArea.show(); // 默认显示（配置中defaultChecked: true）
        console.log('✅ 川滇地区研究区域已初始化');
      }

      // 初始化图层树管理器
      if (window.LayerTreeManager) {
        const layerInstances = {
          faultLayer: window.faultLayer,
          generationLayer: window.generationLayer,
          earthquakeLayer: window.earthquakeLayer,
          stationLayer: window.stationLayer,
          countryBoundary: window.countryBoundary,
          provinceBoundary: window.provinceBoundary,
          cityBoundary: window.cityBoundary,
          chuandianArea: window.chuandianArea
        };

        window.layerTreeManager = new LayerTreeManager(viewer, layerInstances);
        await window.layerTreeManager.initialize();
        console.log('✅ 图层树管理器已初始化');
      }
    } catch (error) {
      console.error('❌ 新图层初始化失败:', error);
    }

    // 9. 初始化右键菜单
    try {
      if (window.ContextMenu) {
        window.contextMenu = new ContextMenu(viewer);
        console.log('✅ 右键菜单已初始化');
      } else {
        console.error('❌ ContextMenu 类未找到');
      }
    } catch (error) {
      console.error('❌ 右键菜单初始化失败:', error);
    }


    // 11. 初始化距离比例尺
    try {
      if (window.DistanceLegend) {
        window.distanceLegend = new DistanceLegend(viewer);
        console.log('✅ 距离比例尺已初始化');
      }
    } catch (error) {
      console.error('❌ 距离比例尺初始化失败:', error);
    }

    // 三维地图应用已就绪
    console.log('🎉 三维地图应用完全初始化完成');

  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    try {
      const statusEl = document.getElementById('loadingStatus');
      if (statusEl) {
        statusEl.textContent = '应用初始化失败: ' + (error && (error.message || error.toString()));
      }
    } catch (e) {
      // ignore
    }

    const errMsg = (error && (error.stack || error.message || String(error))) || 'Unknown error';
    alert('应用初始化失败，请刷新页面重试。\n\n错误信息:\n' + errMsg);
  }
}

// 监听加载完成事件
document.addEventListener('loadingComplete', initializeApplication);

// 禁用自动初始化，完全由加载动画系统控制
// document.addEventListener('DOMContentLoaded', function() {
//   // 等待2秒，给加载动画充分时间启动
//   setTimeout(() => {
//     if (!window.loadingController || !window.loadingController.isInitialized) {
//       console.log('⚡ 加载动画系统未启动，直接初始化应用...');
//       initializeApplication();
//     }
//   }, 2000);
// });

// 窗口大小调整处理
window.addEventListener('resize', function() {
  // 处理Cesium viewer大小调整
  if (viewer && !viewer.isDestroyed()) {
    viewer.canvas.style.width = '100%';
    viewer.canvas.style.height = '100%';
    viewer.resize();
  }

});

// 全局错误处理
window.addEventListener('error', function(event) {
  console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise拒绝:', event.reason);
  event.preventDefault();
});

// 开发工具函数（仅在开发环境使用）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // 开发模式下的调试函数
  window.debugApp = {
    viewer: () => window.viewer,
    sgs: () => window.SGSManager,
    controls: () => window.MapControls,
    ui: () => window.UIControls,
    measure: () => window.MeasureTools,

    // 快速测试函数
    testSGS: async () => {
      console.log('测试SGS连接...');
      const result = await window.SGSManager.connectSGS();
      console.log('SGS连接结果:', result);
      return result;
    },

    testMeasure: () => {
      console.log('测试距离测量...');
      window.MeasureTools.startMeasure('distance');
    },

    flyToXian: () => {
      console.log('飞行到西安...');
      window.MapControls.flyToPosition(108.94, 34.34, 12000);
    },

    // 测试透明处理功能
    testTransparency: () => {
      console.log('🔍 测试影像透明处理功能...');
      const sgs = window.SGSManager;

      if (!sgs) {
        console.error('❌ SGSManager 未初始化');
        return;
      }

      // 显示当前图层信息
      const layers = viewer.scene.imageryLayers;
      console.log(`📊 当前图层数量: ${layers.length}`);

      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        console.log(`📋 图层 ${i}: colorToAlpha=${layer.colorToAlpha ? '已设置' : '未设置'}, alpha=${layer.alpha}`);
      }

      // 测试不同的透明处理方案
      console.log('🧪 测试预设透明方案...');

      // 1. 云南影像黑色透明
      if (sgs.transparencyPresets.yunnanOptimized()) {
        console.log('✅ 云南影像黑色透明处理成功');
      } else {
        console.log('❌ 云南影像透明处理失败');
      }

      // 2. Earthdata 影像透明
      if (sgs.transparencyPresets.earthdataOptimized()) {
        console.log('✅ Earthdata 影像透明处理成功');
      } else {
        console.log('❌ Earthdata 影像透明处理失败');
      }

      // 3. 手动测试白色透明（如果有白色边框）
      setTimeout(() => {
        console.log('🧪 测试白色背景透明...');
        if (sgs.transparencyPresets.whiteBackground('top')) {
          console.log('✅ 白色背景透明处理已应用');
        }
      }, 2000);

      console.log('💡 提示: 观察地图上的影像是否已移除黑色边框/背景');
      console.log('💡 可用命令: window.debugApp.testTransparency() 重新测试');
    },

    // 手动调整透明度
    adjustTransparency: (layerIndex, alpha) => {
      console.log(`🎛️ 调整图层 ${layerIndex} 透明度为 ${alpha}...`);
      const result = window.SGSManager.applyImageryTransparency(layerIndex, { alpha });
      if (result) {
        console.log('✅ 透明度调整成功');
      } else {
        console.log('❌ 透明度调整失败');
      }
    },

    // 重置所有透明设置
    resetTransparency: () => {
      console.log('🔄 重置所有图层透明设置...');
      const layers = viewer.scene.imageryLayers;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        layer.colorToAlpha = undefined;
        layer.colorToAlphaThreshold = 0.004;
        layer.alpha = 1.0;
      }
      console.log('✅ 所有图层透明设置已重置');
    },

    // 修复地球颜色
    fixEarthColors: () => {
      console.log('🎨 修复地球颜色...');
      const layers = viewer.scene.imageryLayers;

      // 重置所有图层的透明设置
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        layer.colorToAlpha = undefined;
        layer.colorToAlphaThreshold = 0.004;
        layer.alpha = 1.0;
      }

      // 只对云南图层（通常是索引1）应用保守的黑色透明
      if (layers.length > 1) {
        const yunnanLayer = layers.get(1);
        yunnanLayer.colorToAlpha = Cesium.Color.BLACK;
        yunnanLayer.colorToAlphaThreshold = 0.01; // 使用更保守的阈值
        console.log('✅ 已为云南图层设置保守的透明处理');
      }

      // 检查图层顺序
      console.log('📋 当前图层信息:');
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        console.log(`  图层 ${i}: alpha=${layer.alpha}, colorToAlpha=${layer.colorToAlpha ? '已设置' : '未设置'}`);
      }

      console.log('✅ 地球颜色修复完成');
    },

    // 切换到默认基础图层
    useDefaultImagery: () => {
      console.log('🌍 切换到默认基础影像...');
      const layers = viewer.scene.imageryLayers;

      // 移除除第一个图层外的所有图层
      while (layers.length > 1) {
        layers.remove(layers.get(layers.length - 1));
      }

      console.log('✅ 已切换到默认影像，如需要可重新加载云南影像');
    },

    // 修复海洋颜色和云南图层显示
    fixOceanColors: () => {
      console.log('🌊 修复海洋颜色和图层顺序...');

      // 关闭所有可能影响颜色的效果
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.dynamicAtmosphereLighting = false;

      // 使用更亮的海洋颜色
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#4682B4'); // 钢蓝色

      // 增强大气效果让海洋更蓝
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.atmosphereLightIntensity = 20.0; // 增加大气光强度

      const layers = viewer.scene.imageryLayers;
      console.log(`📊 当前图层数量: ${layers.length}`);

      // 找到云南图层并移动到最顶层
      let yunnanLayerIndex = -1;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        // 重置颜色属性
        layer.colorToAlpha = undefined;
        layer.colorToAlphaThreshold = 0.004;
        layer.alpha = 1.0;
        layer.brightness = 1.0;
        layer.contrast = 1.0;
        layer.saturation = 1.0;
        layer.gamma = 1.0;
        layer.hue = 0.0;

        // 检查是否为云南图层
        if (layer.rectangle) {
          const bounds = {
            west: Cesium.Math.toDegrees(layer.rectangle.west),
            south: Cesium.Math.toDegrees(layer.rectangle.south),
            east: Cesium.Math.toDegrees(layer.rectangle.east),
            north: Cesium.Math.toDegrees(layer.rectangle.north)
          };
          // 云南地区范围检测
          if (bounds.west > 95 && bounds.east < 110 && bounds.south > 20 && bounds.north < 30) {
            yunnanLayerIndex = i;
            console.log(`🎯 找到云南图层，索引: ${i}，范围:`, bounds);
          }
        }
      }

      // 如果找到云南图层且不在最顶层，则移动到顶层
      if (yunnanLayerIndex >= 0 && yunnanLayerIndex < layers.length - 1) {
        const yunnanLayer = layers.get(yunnanLayerIndex);
        layers.remove(yunnanLayer, false); // 移除但不销毁
        layers.add(yunnanLayer); // 重新添加到顶层
        console.log('📌 云南图层已移动到顶层');

        // 设置云南图层的黑色透明
        yunnanLayer.colorToAlpha = Cesium.Color.BLACK;
        yunnanLayer.colorToAlphaThreshold = 0.01;
        console.log('✅ 已为云南图层设置黑色透明');
      } else if (yunnanLayerIndex >= 0) {
        // 如果已在顶层，直接设置透明
        const yunnanLayer = layers.get(yunnanLayerIndex);
        yunnanLayer.colorToAlpha = Cesium.Color.BLACK;
        yunnanLayer.colorToAlphaThreshold = 0.01;
        console.log('✅ 云南图层已在顶层，设置黑色透明');
      } else {
        console.log('⚠️ 未找到云南图层');
      }

      console.log('✅ 海洋颜色和图层顺序修复完成');
    },

    // 强制显示云南影像
    showYunnanImagery: () => {
      console.log('🗺️ 强制显示云南影像...');
      const layers = viewer.scene.imageryLayers;

      // 查找并提升云南图层
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i);
        if (layer.rectangle) {
          const bounds = {
            west: Cesium.Math.toDegrees(layer.rectangle.west),
            south: Cesium.Math.toDegrees(layer.rectangle.south),
            east: Cesium.Math.toDegrees(layer.rectangle.east),
            north: Cesium.Math.toDegrees(layer.rectangle.north)
          };

          // 云南地区检测
          if (bounds.west > 95 && bounds.east < 110 && bounds.south > 20 && bounds.north < 30) {
            // 移动到最顶层
            layers.remove(layer, false);
            layers.add(layer);

            // 设置透明和增强显示
            layer.colorToAlpha = Cesium.Color.BLACK;
            layer.colorToAlphaThreshold = 0.01;
            layer.alpha = 1.0;
            layer.brightness = 1.1; // 稍微增亮

            console.log('✅ 云南影像已提升到顶层');

            // 飞行到云南
            viewer.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(102.7129, 25.0389, 80000),
              orientation: { heading: 0.0, pitch: Cesium.Math.toRadians(-90), roll: 0.0 }
            });

            return;
          }
        }
      }

      console.log('⚠️ 未找到云南图层');
    },

  };

  // 开发模式已启用
}

// 三维地图应用 v1.0 - 已就绪

// 导出应用实例供外部使用
window.MapApp = {
  get viewer() { return viewer; },
  modules: {
    SGSManager: () => window.SGSManager,
    MapControls: () => window.MapControls,
    UIControls: () => window.UIControls,
    MeasureTools: () => window.MeasureTools
  },
  version: '1.0.0',
  initialized: true
};