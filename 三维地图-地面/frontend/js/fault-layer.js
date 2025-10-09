// 断层数据图层模块
// 使用Cesium官方GeoJsonDataSource加载显示断层线数据

class FaultLayer {
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.isVisible = false;
    this.apiUrl = '/api/data/fault-lines';

    // 断层样式配置
    this.faultStyle = {
      strokeWidth: 4,
      strokeColor: Cesium.Color.RED.withAlpha(0.8),
      clampToGround: false,
      heightOffset: 25 // 离地面25米
    };
  }

  /**
   * 初始化断层图层
   */
  async initialize() {
    try {
      console.log('🔧 初始化断层图层...');

      // 创建GeoJsonDataSource
      this.dataSource = new Cesium.GeoJsonDataSource('fault-lines');

      // 添加到场景
      await this.viewer.dataSources.add(this.dataSource);

      // 启用地形深度测试
      this.viewer.scene.globe.depthTestAgainstTerrain = true;

      // 初始化鼠标悬停事件
      this.initializeHoverEvents();

      console.log('✅ 断层图层初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 断层图层初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载断层数据
   */
  async loadData() {
    try {
      console.log('📡 正在加载断层数据...');

      // 从API获取GeoJSON数据
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojsonData = await response.json();
      console.log(`📊 获取到 ${geojsonData.features.length} 条断层数据`);

      // 统计几何类型（仅用于日志）
      const geometryTypes = {};
      geojsonData.features.forEach(feature => {
        const type = feature.geometry ? feature.geometry.type : 'null';
        geometryTypes[type] = (geometryTypes[type] || 0) + 1;
      });
      console.log('📊 断层几何类型统计:', geometryTypes);

      // 预先设置为隐藏状态，防止加载时闪现
      this.dataSource.show = false;

      // 直接加载原始数据，保持断开的线条不变
      await this.dataSource.load(geojsonData);

      // 应用样式
      this.applyStyle();

      // 确保隐藏状态
      this.setVisible(false);

      console.log('✅ 断层数据加载成功');
      return true;
    } catch (error) {
      console.error('❌ 断层数据加载失败:', error);
      return false;
    }
  }

  /**
   * 应用断层样式
   */
  applyStyle() {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;

    entities.forEach(entity => {
      if (entity.polyline) {
        entity.polyline.width = this.faultStyle.strokeWidth;
        entity.polyline.material = this.faultStyle.strokeColor;
        entity.polyline.clampToGround = this.faultStyle.clampToGround;

        // 设置高度偏移，离地面25米
        if (!this.faultStyle.clampToGround) {
          entity.polyline.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
          // 创建带高度偏移的坐标
          const positions = entity.polyline.positions.getValue();
          const elevatedPositions = positions.map(position => {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            return Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              cartographic.latitude,
              this.faultStyle.heightOffset
            );
          });
          entity.polyline.positions = elevatedPositions;
        }

        // 启用地形遮挡效果 - 保持高度偏移但启用深度测试
        // 移除disableDepthTestDistance以启用地形遮挡
      }
    });

    console.log(`🎨 已应用断层样式到 ${entities.length} 个要素`);
  }

  /**
   * 设置图层可见性
   */
  setVisible(visible) {
    if (!this.dataSource) return;

    this.dataSource.show = visible;
    this.isVisible = visible;

    console.log(`👁️ 断层图层${visible ? '显示' : '隐藏'}`);
  }

  /**
   * 切换图层可见性
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
   * 设置样式
   */
  setStyle(styleOptions) {
    if (styleOptions.strokeWidth !== undefined) {
      this.faultStyle.strokeWidth = styleOptions.strokeWidth;
    }
    if (styleOptions.strokeColor !== undefined) {
      this.faultStyle.strokeColor = styleOptions.strokeColor;
    }
    if (styleOptions.clampToGround !== undefined) {
      this.faultStyle.clampToGround = styleOptions.clampToGround;
    }
    if (styleOptions.heightOffset !== undefined) {
      this.faultStyle.heightOffset = styleOptions.heightOffset;
    }

    // 重新应用样式
    this.applyStyle();
  }

  /**
   * 缩放到断层范围
   */
  zoomToLayer() {
    if (!this.dataSource || !this.isVisible) return;

    try {
      this.viewer.flyTo(this.dataSource);
      console.log('🎯 已缩放到断层图层范围');
    } catch (error) {
      console.error('❌ 缩放到断层图层失败:', error);
    }
  }

  /**
   * 获取图层统计信息
   */
  getLayerInfo() {
    if (!this.dataSource) {
      return { loaded: false };
    }

    const entities = this.dataSource.entities.values;
    const faultCount = entities.length;

    return {
      loaded: true,
      visible: this.isVisible,
      faultCount: faultCount,
      dataSource: 'API: /api/fault-lines',
      style: this.faultStyle
    };
  }

  /**
   * 初始化鼠标点击事件
   */
  initializeHoverEvents() {
    // 创建信息窗
    this.createInfoWindow();

    // 绑定鼠标点击事件
    this.viewer.cesiumWidget.container.addEventListener('click', this.handleMouseClick.bind(this), false);
  }

  /**
   * 创建信息窗
   */
  createInfoWindow() {
    this.infoWindow = document.createElement('div');
    this.infoWindow.className = 'cesium-fault-info-window';
    this.infoWindow.style.cssText = `
      position: absolute;
      background: rgba(139, 0, 0, 0.95);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 10001;
      display: none;
      max-width: 350px;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border: 2px solid rgba(255, 0, 0, 0.6);
      backdrop-filter: blur(5px);
    `;

    // 创建关闭按钮
    this.closeButton = document.createElement('div');
    this.closeButton.innerHTML = '×';
    this.closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      color: #ccc;
    `;
    this.closeButton.onclick = () => this.hideInfoWindow();
    this.infoWindow.appendChild(this.closeButton);

    document.body.appendChild(this.infoWindow);
  }

  /**
   * 处理鼠标点击事件
   */
  handleMouseClick(event) {
    if (!this.isVisible || !this.dataSource) {
      return;
    }

    const pick = this.viewer.scene.pick(new Cesium.Cartesian2(event.clientX, event.clientY));

    if (pick && pick.id && pick.id.polyline && this.isFaultEntity(pick.id)) {
      this.showInfoWindow(pick.id, event);
      // 高亮选中的线条
      this.highlightEntity(pick.id);
    } else {
      this.hideInfoWindow();
      this.clearHighlight();
    }
  }

  /**
   * 检查是否为断层实体
   */
  isFaultEntity(entity) {
    return this.dataSource.entities.contains(entity);
  }

  /**
   * 显示信息窗
   */
  showInfoWindow(entity, event) {
    const properties = entity.properties;
    const content = this.generateInfoWindowContent(properties);

    this.infoWindow.innerHTML = content;

    // 重新添加关闭按钮
    this.closeButton = document.createElement('div');
    this.closeButton.innerHTML = '×';
    this.closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      color: #ccc;
    `;
    this.closeButton.onclick = () => this.hideInfoWindow();
    this.infoWindow.appendChild(this.closeButton);

    this.infoWindow.style.display = 'block';

    // 计算位置，避免超出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const infoWidth = 350;
    const infoHeight = 200;

    let left = event.clientX + 10;
    let top = event.clientY - 10;

    if (left + infoWidth > windowWidth) {
      left = event.clientX - infoWidth - 10;
    }
    if (top + infoHeight > windowHeight) {
      top = event.clientY - infoHeight - 10;
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
    this.originalMaterial = entity.polyline.material;
    this.originalWidth = entity.polyline.width;
    this.highlightedEntity = entity;

    // 设置高亮样式
    entity.polyline.material = Cesium.Color.YELLOW.withAlpha(0.9);
    entity.polyline.width = this.faultStyle.strokeWidth + 3;
  }

  /**
   * 清除高亮
   */
  clearHighlight() {
    if (this.highlightedEntity && this.originalMaterial) {
      this.highlightedEntity.polyline.material = this.originalMaterial;
      this.highlightedEntity.polyline.width = this.originalWidth;
      this.highlightedEntity = null;
      this.originalMaterial = null;
      this.originalWidth = null;
    }
  }

  /**
   * 生成信息窗内容
   */
  generateInfoWindowContent(properties) {
    if (!properties || !properties.getValue) {
      return '<div><strong>断层线</strong><br/>无详细信息</div>';
    }

    const now = Cesium.JulianDate.now();

    // 获取主要属性
    const name = this.getPropertyValue(properties, ['Name', 'FaultName', '名称'], now) || '未命名断层';
    const length = this.getPropertyValue(properties, ['FaultLengt', '断层长度', 'Length'], now) || '未知';
    const strike = this.getPropertyValue(properties, ['Strike', '断层走向'], now) || '未知';
    const dipDir = this.getPropertyValue(properties, ['DipDir', '断层倾向'], now) || '未知';
    const dipAngle = this.getPropertyValue(properties, ['DipAngle', '断层倾角'], now) || '未知';
    const faultClass = this.getPropertyValue(properties, ['FaultClass', '断层等级'], now) || '未知';
    const topDepth = this.getPropertyValue(properties, ['TopDepth', '顶部深度'], now) || '未知';
    const width = this.getPropertyValue(properties, ['Width', '宽度'], now) || '未知';

    // 构建HTML内容
    let content = `<div><strong>🔴 断层线</strong><br/>`;

    if (name && name !== '未命名断层') {
      content += `<strong>名称:</strong> ${name}<br/>`;
    }

    if (length && length !== '未知' && length !== '0' && length !== '0.0') {
      content += `<strong>长度:</strong> ${length}km<br/>`;
    }

    if (strike && strike !== '未知' && strike !== '0') {
      content += `<strong>走向:</strong> ${strike}°<br/>`;
    }

    if (dipDir && dipDir !== '未知' && dipDir !== '0') {
      content += `<strong>倾向:</strong> ${dipDir}°<br/>`;
    }

    if (dipAngle && dipAngle !== '未知' && dipAngle !== '0') {
      content += `<strong>倾角:</strong> ${dipAngle}°<br/>`;
    }

    if (faultClass && faultClass !== '未知' && faultClass !== '0') {
      content += `<strong>等级:</strong> ${this.getFaultClassDescription(faultClass)}<br/>`;
    }

    if (topDepth && topDepth !== '未知' && topDepth !== '0') {
      content += `<strong>顶深:</strong> ${topDepth}km<br/>`;
    }

    if (width && width !== '未知' && width !== '0') {
      content += `<strong>宽度:</strong> ${width}km<br/>`;
    }

    content += `</div>`;

    return content;
  }

  /**
   * 获取属性值的辅助方法
   */
  getPropertyValue(properties, fieldNames, time) {
    for (const field of fieldNames) {
      try {
        const value = properties.getValue(time, field);
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      } catch (e) {
        // 继续尝试下一个字段
      }
    }
    return null;
  }

  /**
   * 获取断层等级描述
   */
  getFaultClassDescription(faultClass) {
    const classMap = {
      '0': '一般断层',
      '1': '重要断层',
      '2': '主要断层',
      '3': '次要断层'
    };
    return classMap[faultClass] || `等级${faultClass}`;
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
    console.log('🗑️ 断层图层已销毁');
  }
}

// 导出到全局
window.FaultLayer = FaultLayer;