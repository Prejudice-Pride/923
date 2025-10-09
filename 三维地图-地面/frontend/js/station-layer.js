// 台站数据图层模块
// 显示监测台站分布，使用不同图标区分地震监测和火山监测台站

class StationLayer {
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.isVisible = false;
    this.apiUrl = '/api/data/stations';
  }

  /**
   * 初始化台站图层
   */
  async initialize() {
    try {
      console.log('🔧 初始化台站图层...');

      // 创建数据源
      this.dataSource = new Cesium.CustomDataSource('stations');
      await this.viewer.dataSources.add(this.dataSource);

      // 初始化鼠标点击事件
      this.initializeClickEvents();

      console.log('✅ 台站图层初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 台站图层初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载台站数据
   */
  async loadStations() {
    try {
      console.log('📡 正在加载台站数据...');

      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 获取到 ${data.features.length} 个台站`);

      // 清除之前的数据
      this.dataSource.entities.removeAll();

      // 添加台站点
      data.features.forEach((feature, index) => {
        this.addStationPoint(feature, index);
      });

      console.log(`✅ 台站数据加载成功，共 ${data.features.length} 个台站`);
      return data.features.length;

    } catch (error) {
      console.error('❌ 台站数据加载失败:', error);
      throw error;
    }
  }

  /**
   * 添加台站点
   */
  addStationPoint(feature, index) {
    const coords = feature.geometry.coordinates;
    const props = feature.properties;

    // 验证坐标有效性
    const lon = coords[0];
    const lat = coords[1];

    if (!isFinite(lon) || !isFinite(lat) ||
        lon < -180 || lon > 180 ||
        lat < -90 || lat > 90 ||
        (lon === 0 && lat === 0)) {
      return; // 静默跳过无效坐标的台站
    }

    // 根据台站类型选择不同的图标和颜色
    const stationStyle = this.getStationStyle(props.类型);

    const entity = this.dataSource.entities.add({
      id: `station_${index}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0), // 贴地显示
      point: {
        pixelSize: stationStyle.size,
        color: stationStyle.color,
        outlineColor: stationStyle.outlineColor,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 官方推荐：贴地显示
        scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 100000, 0.8)
        // 官方建议：不设置disableDepthTestDistance，使用默认深度测试
      },
      label: {
        text: props.台站名称,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 50000, 0.5),
        show: false // 默认不显示标签
      },
      properties: {
        stationType: props.类型,
        stationName: props.台站名称,
        network: props.net,
        code: props.sta,
        title: props.title,
        description: props.description
      }
    });
  }

  /**
   * 根据台站类型获取样式
   */
  getStationStyle(type) {
    const styles = {
      '长白山火山': {
        size: 12,
        color: Cesium.Color.ORANGE,
        outlineColor: Cesium.Color.DARKORANGE
      },
      '国家台': {
        size: 12,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.BLUE
      },
      '区域台': {
        size: 12,
        color: Cesium.Color.LIGHTGREEN,
        outlineColor: Cesium.Color.GREEN
      },
      'default': {
        size: 12,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.GOLD
      }
    };

    return styles[type] || styles['default'];
  }

  /**
   * 设置可见性
   */
  setVisible(visible) {
    if (this.dataSource) {
      this.dataSource.show = visible;
      this.isVisible = visible;
      console.log(`📡 台站图层${visible ? '显示' : '隐藏'}`);
    }
  }

  /**
   * 获取可见性状态
   */
  getVisible() {
    return this.isVisible;
  }

  /**
   * 切换可见性
   */
  toggleVisible() {
    this.setVisible(!this.isVisible);
  }

  /**
   * 显示图层（统一接口）
   */
  show() {
    this.setVisible(true);
  }

  /**
   * 隐藏图层（统一接口）
   */
  hide() {
    this.setVisible(false);
  }

  /**
   * 显示/隐藏台站标签
   */
  setLabelsVisible(visible) {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;
    entities.forEach(entity => {
      if (entity.label) {
        entity.label.show = visible;
      }
    });

    console.log(`🏷️ 台站标签${visible ? '显示' : '隐藏'}`);
  }

  /**
   * 根据类型过滤台站
   */
  filterByType(types = []) {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;
    entities.forEach(entity => {
      if (entity.properties && entity.properties.stationType) {
        const stationType = entity.properties.stationType.getValue();
        entity.show = types.length === 0 || types.includes(stationType);
      }
    });

    console.log(`🔍 台站类型过滤: ${types.length === 0 ? '全部' : types.join(', ')}`);
  }

  /**
   * 缩放到台站范围
   */
  zoomToStations() {
    if (this.dataSource && this.dataSource.entities.values.length > 0) {
      this.viewer.flyTo(this.dataSource);
      console.log('🎯 已缩放到台站范围');
    }
  }


  /**
   * 获取台站统计信息
   */
  getStationStats() {
    if (!this.dataSource) {
      return { total: 0, byType: {} };
    }

    const entities = this.dataSource.entities.values;
    const stats = { total: entities.length, byType: {} };

    entities.forEach(entity => {
      if (entity.properties && entity.properties.stationType) {
        const type = entity.properties.stationType.getValue();
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
    });

    return stats;
  }


  /**
   * 清除所有台站数据
   */
  clear() {
    if (this.dataSource) {
      this.dataSource.entities.removeAll();
      console.log('🧹 台站数据已清除');
    }
  }

  /**
   * 初始化鼠标点击事件
   */
  initializeClickEvents() {
    // 创建信息窗
    this.createInfoWindow();

    // 绑定鼠标点击事件
    this.viewer.cesiumWidget.container.addEventListener('click', this.handleMouseClick.bind(this), false);

    // 监听相机移动事件，移动时关闭弹窗
    this.viewer.camera.moveStart.addEventListener(() => {
      this.hideInfoWindow();
      this.clearHighlight();
    });
  }

  /**
   * 创建信息窗
   */
  createInfoWindow() {
    this.infoWindow = document.createElement('div');
    this.infoWindow.className = 'cesium-station-info-window';
    this.infoWindow.style.cssText = `
      position: absolute;
      background: rgba(38, 44, 58, 0.98);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
      font-size: 14px;
      z-index: 10001;
      display: none;
      min-width: 260px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(93, 173, 226, 0.4);
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(this.infoWindow);
  }

  /**
   * 处理鼠标点击事件
   */
  handleMouseClick(event) {
    if (!this.isVisible || !this.dataSource) {
      return;
    }

    // 阻止事件冒泡，防止双击缩放
    event.stopPropagation();

    const pick = this.viewer.scene.pick(new Cesium.Cartesian2(event.clientX, event.clientY));

    if (pick && pick.id && pick.id.point && this.isStationEntity(pick.id)) {
      this.showInfoWindow(pick.id, event);
      // 高亮选中的点
      this.highlightEntity(pick.id);
    } else {
      this.hideInfoWindow();
      this.clearHighlight();
    }
  }

  /**
   * 检查是否为台站实体
   */
  isStationEntity(entity) {
    return this.dataSource.entities.contains(entity);
  }

  /**
   * 显示信息窗
   */
  showInfoWindow(entity, event) {
    const properties = entity.properties;
    const content = this.generateInfoWindowContent(entity);

    this.infoWindow.innerHTML = content;
    this.infoWindow.style.display = 'block';

    // 计算位置，避免超出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const infoWidth = 280;
    const infoHeight = 220;

    let left = event.clientX + 15;
    let top = event.clientY - 10;

    if (left + infoWidth > windowWidth) {
      left = event.clientX - infoWidth - 15;
    }
    if (top + infoHeight > windowHeight) {
      top = event.clientY - infoHeight - 10;
    }

    // 确保不会超出上边界
    if (top < 10) {
      top = 10;
    }
    if (left < 10) {
      left = 10;
    }

    this.infoWindow.style.left = left + 'px';
    this.infoWindow.style.top = top + 'px';
  }

  /**
   * 隐藏信息窗
   */
  hideInfoWindow() {
    if (this.infoWindow) {
      this.infoWindow.style.display = 'none';
    }
    this.clearHighlight();
  }

  /**
   * 高亮选中实体
   */
  highlightEntity(entity) {
    // 清除之前的高亮
    this.clearHighlight();

    // 保存原始样式
    this.originalColor = entity.point.color;
    this.originalSize = entity.point.pixelSize;
    this.highlightedEntity = entity;

    // 设置高亮样式
    entity.point.color = Cesium.Color.YELLOW.withAlpha(0.9);
    entity.point.pixelSize = entity.point.pixelSize.getValue() + 4;
  }

  /**
   * 清除高亮
   */
  clearHighlight() {
    if (this.highlightedEntity && this.originalColor) {
      this.highlightedEntity.point.color = this.originalColor;
      this.highlightedEntity.point.pixelSize = this.originalSize;
      this.highlightedEntity = null;
      this.originalColor = null;
      this.originalSize = null;
    }
  }

  /**
   * 生成信息窗内容（简洁风格）
   */
  generateInfoWindowContent(entity) {
    if (!entity || !entity.properties) {
      return `<div style="font-size: 14px; color: #9aa0a6;">无详细信息</div>`;
    }

    const properties = entity.properties;
    const now = Cesium.JulianDate.now();

    // 获取台站属性
    const stationName = this.getPropertyValue(properties, 'stationName', now) || '未知台站';
    const stationType = this.getPropertyValue(properties, 'stationType', now) || '未知类型';
    const network = this.getPropertyValue(properties, 'network', now) || '';
    const code = this.getPropertyValue(properties, 'code', now) || '';

    // 从position中提取经纬度
    let longitude = '', latitude = '';
    if (entity.position) {
      try {
        const cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
        longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(3);
        latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(3);
      } catch (e) {
        console.warn('提取台站经纬度失败:', e);
      }
    }

    // 根据类型选择颜色
    let typeColor = '#5dade2';
    if (stationType.includes('火山')) {
      typeColor = '#ff7043';
    } else if (stationType.includes('国家台')) {
      typeColor = '#4ecdc4';
    } else if (stationType.includes('区域台')) {
      typeColor = '#81c995';
    }

    // 构建台站编号 (NET-STA格式)
    const stationCode = (network && code) ? `${network}-${code}` : (code || '');

    // 构建HTML内容 - 简洁风格
    let content = `
      <!-- 标题 -->
      <div style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 18px; font-weight: 500; color: #5dade2;">台站信息</div>
      </div>

      <!-- 信息列表 - 左右布局，无图标 -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">名称:</span>
          <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${stationName}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">类型:</span>
          <span style="color: #ffffff; font-size: 14px;">${stationType}</span>
        </div>
    `;

    // 台站编号 (NET-STA格式)
    if (stationCode) {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">编号:</span>
          <span style="color: #5dade2; font-size: 14px; font-weight: 500;">${stationCode}</span>
        </div>
      `;
    }

    // 经纬度
    if (longitude && latitude) {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">经度:</span>
          <span style="color: #5dade2; font-size: 14px;">${longitude}°</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">纬度:</span>
          <span style="color: #5dade2; font-size: 14px;">${latitude}°</span>
        </div>
      `;
    }

    content += `
      </div>
    `;

    return content;
  }

  /**
   * 获取属性值的辅助方法
   */
  getPropertyValue(properties, fieldName, time) {
    try {
      // 尝试多种方式获取属性值
      let value;

      // 方式1: 直接访问带下划线的属性
      const underscoreField = `_${fieldName}`;
      if (properties[underscoreField]) {
        value = properties[underscoreField].getValue ? properties[underscoreField].getValue(time) : properties[underscoreField];
      }

      // 方式2: 直接访问不带下划线的属性
      if (!value && properties[fieldName]) {
        value = properties[fieldName].getValue ? properties[fieldName].getValue(time) : properties[fieldName];
      }

      // 方式3: 使用getValue方法
      if (!value && properties.getValue) {
        value = properties.getValue(time, fieldName);
      }

      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    } catch (e) {
      console.warn(`获取属性 ${fieldName} 失败:`, e);
    }
    return null;
  }

  /**
   * 销毁图层
   */
  destroy() {
    // 移除点击事件监听器
    if (this.viewer && this.viewer.cesiumWidget) {
      this.viewer.cesiumWidget.container.removeEventListener('click', this.handleMouseClick.bind(this), false);
    }

    // 隐藏并移除信息窗
    this.hideInfoWindow();
    if (this.infoWindow && this.infoWindow.parentNode) {
      this.infoWindow.parentNode.removeChild(this.infoWindow);
      this.infoWindow = null;
    }

    // 清除高亮
    this.clearHighlight();

    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
      this.dataSource = null;
    }
    this.isVisible = false;
    console.log('🗑️ 台站图层已销毁');
  }
}

// 导出到全局
window.StationLayer = StationLayer;