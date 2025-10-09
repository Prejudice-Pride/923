// 行政界线管理器
// 统一管理国界、省界、市界图层的显示，支持基于相机高度的自动控制

class AdministrativeBoundaryManager {
  constructor(viewer) {
    this.viewer = viewer;

    // 图层实例
    this.countryLayer = null;
    this.provinceLayer = null;
    this.cityLayer = null;

    // 控制状态
    this.enabled = false;
    this.autoMode = true; // 自动模式：根据相机高度显示
    this.manualOverrides = {
      country: null,   // null=自动, true=强制显示, false=强制隐藏
      province: null,
      city: null
    };

    // 相机高度阈值配置 (米)
    this.heightThresholds = {
      country: {
        minHeight: 5000000,  // 5000km以上显示国界
        maxHeight: 50000000  // 50000km以下显示
      },
      province: {
        minHeight: 1000000,  // 1000km以上显示省界
        maxHeight: 10000000  // 10000km以下显示
      },
      city: {
        minHeight: 100000,   // 100km以上显示市界
        maxHeight: 2000000   // 2000km以下显示
      }
    };

    // 当前状态
    this.currentHeight = 0;
    this.lastUpdateTime = 0;
    this.updateThrottle = 500; // 更新节流，500ms

    // 加载状态
    this.loadingStates = {
      country: false,
      province: false,
      city: false
    };

    // 可见状态
    this.visibilityStates = {
      country: false,
      province: false,
      city: false
    };
  }

  /**
   * 初始化管理器
   */
  async initialize() {
    try {
      console.log('🔧 初始化行政界线管理器...');

      // 创建图层实例
      this.countryLayer = new CountryBoundaryLayer(this.viewer);
      this.provinceLayer = new ProvinceBoundaryLayer(this.viewer);
      this.cityLayer = new CityBoundaryLayer(this.viewer);

      // 初始化图层
      await Promise.all([
        this.countryLayer.initialize(),
        this.provinceLayer.initialize(),
        this.cityLayer.initialize()
      ]);

      // 绑定相机变化事件
      this.bindCameraEvents();

      console.log('✅ 行政界线管理器初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 行政界线管理器初始化失败:', error);
      return false;
    }
  }

  /**
   * 启用行政界线显示
   */
  async enable() {
    if (this.enabled) return;

    try {
      console.log('📡 启用行政界线显示...');

      // 加载所有图层数据
      await this.loadAllLayers();

      this.enabled = true;

      // 立即更新显示状态
      this.updateLayerVisibility();

      console.log('✅ 行政界线显示已启用');
    } catch (error) {
      console.error('❌ 启用行政界线显示失败:', error);
    }
  }

  /**
   * 禁用行政界线显示
   */
  disable() {
    if (!this.enabled) return;

    console.log('🚫 禁用行政界线显示...');

    // 隐藏所有图层
    if (this.countryLayer) this.countryLayer.setVisible(false);
    if (this.provinceLayer) this.provinceLayer.setVisible(false);
    if (this.cityLayer) this.cityLayer.setVisible(false);

    this.enabled = false;
    this.visibilityStates = { country: false, province: false, city: false };

    console.log('✅ 行政界线显示已禁用');
  }

  /**
   * 切换启用状态
   */
  async toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      await this.enable();
    }
  }

  /**
   * 加载所有图层数据
   */
  async loadAllLayers() {
    const loadPromises = [];

    // 国界图层
    if (!this.loadingStates.country) {
      this.loadingStates.country = true;
      loadPromises.push(
        this.countryLayer.loadData()
          .then(() => console.log('✅ 国界数据加载完成'))
          .catch(err => console.error('❌ 国界数据加载失败:', err))
      );
    }

    // 省界图层
    if (!this.loadingStates.province) {
      this.loadingStates.province = true;
      loadPromises.push(
        this.provinceLayer.loadData()
          .then(() => console.log('✅ 省界数据加载完成'))
          .catch(err => console.error('❌ 省界数据加载失败:', err))
      );
    }

    // 市界图层
    if (!this.loadingStates.city) {
      this.loadingStates.city = true;
      loadPromises.push(
        this.cityLayer.loadData()
          .then(() => console.log('✅ 市界数据加载完成'))
          .catch(err => console.error('❌ 市界数据加载失败:', err))
      );
    }

    await Promise.all(loadPromises);
  }

  /**
   * 绑定相机变化事件
   */
  bindCameraEvents() {
    // 监听相机移动结束事件
    this.viewer.camera.moveEnd.addEventListener(() => {
      this.onCameraChanged();
    });

    // 监听相机移动事件（节流）
    this.viewer.camera.changed.addEventListener(() => {
      const now = Date.now();
      if (now - this.lastUpdateTime > this.updateThrottle) {
        this.onCameraChanged();
        this.lastUpdateTime = now;
      }
    });
  }

  /**
   * 相机变化处理
   */
  onCameraChanged() {
    if (!this.enabled || !this.autoMode) return;

    // 计算相机高度
    const height = this.calculateCameraHeight();
    this.currentHeight = height;

    // 更新图层可见性
    this.updateLayerVisibility();
  }

  /**
   * 计算相机高度
   */
  calculateCameraHeight() {
    const camera = this.viewer.camera;
    const cartographic = camera.positionCartographic;
    return cartographic.height;
  }

  /**
   * 更新图层可见性
   */
  updateLayerVisibility() {
    if (!this.enabled) return;

    const height = this.currentHeight;
    const newVisibility = this.calculateLayerVisibility(height);

    // 更新国界显示
    if (newVisibility.country !== this.visibilityStates.country) {
      this.visibilityStates.country = newVisibility.country;
      if (this.countryLayer) {
        this.countryLayer.setVisible(newVisibility.country);
      }
    }

    // 更新省界显示
    if (newVisibility.province !== this.visibilityStates.province) {
      this.visibilityStates.province = newVisibility.province;
      if (this.provinceLayer) {
        this.provinceLayer.setVisible(newVisibility.province);
      }
    }

    // 更新市界显示
    if (newVisibility.city !== this.visibilityStates.city) {
      this.visibilityStates.city = newVisibility.city;
      if (this.cityLayer) {
        this.cityLayer.setVisible(newVisibility.city);
      }
    }

    // 输出调试信息
    this.logVisibilityChange(height, newVisibility);
  }

  /**
   * 计算图层可见性
   */
  calculateLayerVisibility(height) {
    const visibility = {
      country: false,
      province: false,
      city: false
    };

    // 检查手动覆盖
    if (this.manualOverrides.country !== null) {
      visibility.country = this.manualOverrides.country;
    } else {
      // 自动判断国界显示
      const countryThreshold = this.heightThresholds.country;
      visibility.country = height >= countryThreshold.minHeight && height <= countryThreshold.maxHeight;
    }

    if (this.manualOverrides.province !== null) {
      visibility.province = this.manualOverrides.province;
    } else {
      // 自动判断省界显示
      const provinceThreshold = this.heightThresholds.province;
      visibility.province = height >= provinceThreshold.minHeight && height <= provinceThreshold.maxHeight;
    }

    if (this.manualOverrides.city !== null) {
      visibility.city = this.manualOverrides.city;
    } else {
      // 自动判断市界显示
      const cityThreshold = this.heightThresholds.city;
      visibility.city = height >= cityThreshold.minHeight && height <= cityThreshold.maxHeight;
    }

    return visibility;
  }

  /**
   * 设置自动模式
   */
  setAutoMode(enabled) {
    this.autoMode = enabled;
    if (enabled) {
      // 清除手动覆盖
      this.manualOverrides = { country: null, province: null, city: null };
      // 立即更新显示
      this.updateLayerVisibility();
    }
    console.log(`🤖 自动模式${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 手动控制图层显示
   */
  setLayerVisibility(layerType, visible) {
    if (!['country', 'province', 'city'].includes(layerType)) {
      console.warn('❌ 无效的图层类型:', layerType);
      return;
    }

    // 设置手动覆盖
    this.manualOverrides[layerType] = visible;

    // 立即更新显示
    this.updateLayerVisibility();

    console.log(`👆 手动${visible ? '显示' : '隐藏'}${layerType}图层`);
  }

  /**
   * 切换图层显示
   */
  toggleLayerVisibility(layerType) {
    const currentVisible = this.visibilityStates[layerType];
    this.setLayerVisibility(layerType, !currentVisible);
  }

  /**
   * 配置高度阈值
   */
  configureHeightThresholds(config) {
    if (config.country) {
      Object.assign(this.heightThresholds.country, config.country);
    }
    if (config.province) {
      Object.assign(this.heightThresholds.province, config.province);
    }
    if (config.city) {
      Object.assign(this.heightThresholds.city, config.city);
    }

    // 立即更新显示
    if (this.enabled && this.autoMode) {
      this.updateLayerVisibility();
    }

    console.log('⚙️ 高度阈值配置已更新');
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      autoMode: this.autoMode,
      currentHeight: this.currentHeight,
      heightFormatted: this.formatHeight(this.currentHeight),
      visibilityStates: { ...this.visibilityStates },
      manualOverrides: { ...this.manualOverrides },
      heightThresholds: { ...this.heightThresholds },
      loadingStates: { ...this.loadingStates }
    };
  }

  /**
   * 格式化高度显示
   */
  formatHeight(height) {
    if (height > 1000000) {
      return `${(height / 1000000).toFixed(1)}M km`;
    } else if (height > 1000) {
      return `${(height / 1000).toFixed(1)} km`;
    } else {
      return `${height.toFixed(0)} m`;
    }
  }

  /**
   * 记录可见性变化
   */
  logVisibilityChange(height, visibility) {
    const heightStr = this.formatHeight(height);
    const visibleLayers = [];

    if (visibility.country) visibleLayers.push('国界');
    if (visibility.province) visibleLayers.push('省界');
    if (visibility.city) visibleLayers.push('市界');

    if (visibleLayers.length > 0) {
      console.log(`👁️ 高度${heightStr}: 显示 ${visibleLayers.join(', ')}`);
    } else {
      console.log(`👁️ 高度${heightStr}: 隐藏所有行政界线`);
    }
  }

  /**
   * 缩放到特定图层
   */
  zoomToLayer(layerType) {
    const layer = this.getLayer(layerType);
    if (layer && layer.zoomToLayer) {
      layer.zoomToLayer();
    }
  }

  /**
   * 获取指定图层实例
   */
  getLayer(layerType) {
    switch (layerType) {
      case 'country': return this.countryLayer;
      case 'province': return this.provinceLayer;
      case 'city': return this.cityLayer;
      default: return null;
    }
  }

  /**
   * 获取图层统计信息
   */
  getLayerStats() {
    const stats = {};

    if (this.countryLayer) {
      stats.country = this.countryLayer.getLayerInfo();
    }
    if (this.provinceLayer) {
      stats.province = this.provinceLayer.getLayerInfo();
    }
    if (this.cityLayer) {
      stats.city = this.cityLayer.getLayerInfo();
    }

    return stats;
  }

  /**
   * 销毁管理器
   */
  destroy() {
    console.log('🗑️ 销毁行政界线管理器...');

    // 销毁图层
    if (this.countryLayer) {
      this.countryLayer.destroy();
      this.countryLayer = null;
    }
    if (this.provinceLayer) {
      this.provinceLayer.destroy();
      this.provinceLayer = null;
    }
    if (this.cityLayer) {
      this.cityLayer.destroy();
      this.cityLayer = null;
    }

    // 重置状态
    this.enabled = false;
    this.autoMode = true;
    this.manualOverrides = { country: null, province: null, city: null };
    this.visibilityStates = { country: false, province: false, city: false };
    this.loadingStates = { country: false, province: false, city: false };

    console.log('✅ 行政界线管理器已销毁');
  }
}

// 导出到全局
window.AdministrativeBoundaryManager = AdministrativeBoundaryManager;