// 五代图数据图层模块
// 使用Cesium官方GeoJsonDataSource加载显示五代图线数据

class GenerationLayer {
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.isVisible = false;
    this.apiUrl = '/api/data/generation-map';

    // 五代图样式配置
    this.generationStyle = {
      strokeWidth: 4, // 与断层线保持一致的线宽
      strokeColor: Cesium.Color.BLUE.withAlpha(0.8),
      clampToGround: false,
      heightOffset: 25, // 离地面25米
      // 抗锯齿设置
      outline: true,
      outlineWidth: 1.0,
      outlineColor: Cesium.Color.BLACK.withAlpha(0.3)
    };

    // 五代图颜色映射 - 统一使用纯蓝色
    this.colorMapping = {
      'PreQ': Cesium.Color.BLUE.withAlpha(0.8), // 前第四纪 - 纯蓝色
      'Qp12': Cesium.Color.BLUE.withAlpha(0.8), // 早-中更新世 - 纯蓝色
      'Qp3': Cesium.Color.BLUE.withAlpha(0.8), // 晚更新世 - 纯蓝色
      'Qh': Cesium.Color.BLUE.withAlpha(0.8), // 全新世 - 纯蓝色
      'default': Cesium.Color.BLUE.withAlpha(0.8) // 默认 - 纯蓝色
    };
  }

  /**
   * 初始化五代图图层
   */
  async initialize() {
    try {
      console.log('🔧 初始化五代图图层...');

      // 创建GeoJsonDataSource
      this.dataSource = new Cesium.GeoJsonDataSource('generation-map');

      // 添加到场景
      await this.viewer.dataSources.add(this.dataSource);

      // 启用地形深度测试
      this.viewer.scene.globe.depthTestAgainstTerrain = true;

      // 初始化鼠标悬停事件
      this.initializeHoverEvents();

      console.log('✅ 五代图图层初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 五代图图层初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载五代图数据
   */
  async loadData() {
    try {
      console.log('📡 正在加载五代图数据...');

      // 从API获取GeoJSON数据
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojsonData = await response.json();
      console.log(`📊 获取到 ${geojsonData.features.length} 个五代图要素`);

      // 统计几何类型（仅用于日志）
      const geometryTypes = {};
      geojsonData.features.forEach(feature => {
        const type = feature.geometry ? feature.geometry.type : 'null';
        geometryTypes[type] = (geometryTypes[type] || 0) + 1;
      });
      console.log('📊 五代图几何类型统计:', geometryTypes);

      // 预先设置为隐藏状态，防止加载时闪现
      this.dataSource.show = false;

      // 直接加载原始数据，保持断开的线条不变
      await this.dataSource.load(geojsonData);

      // 应用样式
      this.applyStyle();

      // 确保隐藏状态
      this.setVisible(false);

      console.log('✅ 五代图数据加载成功');
      return true;
    } catch (error) {
      console.error('❌ 五代图数据加载失败:', error);
      return false;
    }
  }

  /**
   * 应用五代图样式
   */
  applyStyle() {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;

    entities.forEach((entity, index) => {
      if (entity.polyline) {
        // 根据活动时代属性决定颜色
        const generation = this.getGenerationFromProperties(entity.properties);
        const lineColor = this.colorMapping[generation] || this.colorMapping['default'];

        // 设置线样式
        entity.polyline.width = this.generationStyle.strokeWidth;
        entity.polyline.material = lineColor;
        entity.polyline.clampToGround = this.generationStyle.clampToGround;

        // 抗锯齿设置
        if (this.generationStyle.outline) {
          entity.polyline.outline = this.generationStyle.outline;
          entity.polyline.outlineWidth = this.generationStyle.outlineWidth;
          entity.polyline.outlineColor = this.generationStyle.outlineColor;
        }

        // 线条连续性和平滑度优化
        entity.polyline.granularity = Cesium.Math.RADIANS_PER_DEGREE;
        entity.polyline.followSurface = false;
        entity.polyline.arcType = Cesium.ArcType.NONE;

        // 设置高度偏移，离地面25米
        if (!this.generationStyle.clampToGround) {
          entity.polyline.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
          const positions = entity.polyline.positions.getValue();
          const elevatedPositions = positions.map(position => {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            return Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              cartographic.latitude,
              this.generationStyle.heightOffset
            );
          });
          entity.polyline.positions = elevatedPositions;
        }

        // 启用地形遮挡效果 - 保持高度偏移但启用深度测试
        // 移除disableDepthTestDistance以启用地形遮挡
      }
    });

    console.log(`🎨 已应用五代图样式到 ${entities.length} 个要素`);
  }



  /**
   * 从属性中获取活动时代信息
   */
  getGenerationFromProperties(properties) {
    // 尝试从不同可能的属性字段获取活动时代信息
    if (properties && properties.getValue) {
      // 常见的活动时代字段名
      const possibleFields = ['活动时代', 'newage', 'Age', 'PERIOD', 'TYPE', 'CLASS'];

      for (const field of possibleFields) {
        try {
          const value = properties.getValue(Cesium.JulianDate.now(), field);
          if (value !== undefined && value !== null && value !== '') {
            return String(value);
          }
        } catch (e) {
          // 忽略属性访问错误，继续尝试下一个字段
          continue;
        }
      }
    }

    // 如果没有找到属性，返回默认值
    return 'default';
  }

  /**
   * 设置图层可见性
   */
  setVisible(visible) {
    if (!this.dataSource) return;

    this.dataSource.show = visible;
    this.isVisible = visible;

    console.log(`👁️ 五代图图层${visible ? '显示' : '隐藏'}`);
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
   * 设置透明度
   */
  setOpacity(opacity) {
    if (!this.dataSource) return;

    const normalizedOpacity = Math.max(0, Math.min(1, opacity));

    // 更新所有要素的透明度
    const entities = this.dataSource.entities.values;
    entities.forEach(entity => {
      if (entity.polyline && entity.polyline.material) {
        const currentColor = entity.polyline.material.getValue();
        if (currentColor && currentColor.withAlpha) {
          entity.polyline.material = currentColor.withAlpha(normalizedOpacity);
        }
      }
    });

    console.log(`🎨 五代图透明度设置为: ${opacity}`);
  }

  /**
   * 设置样式
   */
  setStyle(styleOptions) {
    if (styleOptions.opacity !== undefined) {
      this.setOpacity(styleOptions.opacity);
    }
    if (styleOptions.strokeWidth !== undefined) {
      this.generationStyle.strokeWidth = styleOptions.strokeWidth;
    }
    if (styleOptions.strokeColor !== undefined) {
      this.generationStyle.strokeColor = styleOptions.strokeColor;
    }
    if (styleOptions.clampToGround !== undefined) {
      this.generationStyle.clampToGround = styleOptions.clampToGround;
    }
    if (styleOptions.heightOffset !== undefined) {
      this.generationStyle.heightOffset = styleOptions.heightOffset;
    }

    // 重新应用样式
    this.applyStyle();
  }

  /**
   * 设置颜色映射
   */
  setColorMapping(colorMap) {
    this.colorMapping = { ...this.colorMapping, ...colorMap };
    this.applyStyle();
    console.log('🎨 五代图颜色映射已更新');
  }

  /**
   * 缩放到图层范围
   */
  zoomToLayer() {
    if (!this.dataSource || !this.isVisible) return;

    try {
      this.viewer.flyTo(this.dataSource);
      console.log('🎯 已缩放到五代图图层范围');
    } catch (error) {
      console.error('❌ 缩放到五代图图层失败:', error);
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
    const featureCount = entities.length;

    // 统计不同代次的数量
    const generationStats = {};
    entities.forEach(entity => {
      const generation = this.getGenerationFromProperties(entity.properties);
      generationStats[generation] = (generationStats[generation] || 0) + 1;
    });

    return {
      loaded: true,
      visible: this.isVisible,
      featureCount: featureCount,
      generationStats: generationStats,
      dataSource: 'API: /api/generation-map',
      style: this.generationStyle,
      colorMapping: this.colorMapping
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
    this.infoWindow.className = 'cesium-generation-info-window';
    this.infoWindow.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 10000;
      display: none;
      max-width: 350px;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      border: 2px solid rgba(69, 170, 242, 0.6);
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
      hover: #fff;
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

    if (pick && pick.id && pick.id.polyline && this.isGenerationEntity(pick.id)) {
      this.showInfoWindow(pick.id, event);
      // 高亮选中的线条
      this.highlightEntity(pick.id);
    } else {
      this.hideInfoWindow();
      this.clearHighlight();
    }
  }

  /**
   * 检查是否为五代图实体
   */
  isGenerationEntity(entity) {
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
    entity.polyline.width = this.generationStyle.strokeWidth + 3;
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
      return '<div><strong>五代图断层</strong><br/>无详细信息</div>';
    }

    const now = Cesium.JulianDate.now();

    // 获取主要属性
    const name = this.getPropertyValue(properties, ['Name', 'FaultName', '名称'], now) || '未命名断层';
    const age = this.getPropertyValue(properties, ['活动时代', 'newage', 'Age'], now) || '未知';
    const exposure = this.getPropertyValue(properties, ['出露情况', 'exposure'], now) || '未知';
    const nature = this.getPropertyValue(properties, ['断层性质', 'FaultType'], now) || '未知';
    const strike = this.getPropertyValue(properties, ['断层走向', 'Strike'], now) || '未知';
    const dip = this.getPropertyValue(properties, ['断层倾向', 'DipDir'], now) || '未知';
    const dipAngle = this.getPropertyValue(properties, ['断层倾角', 'DipAngle'], now) || '未知';
    const length = this.getPropertyValue(properties, ['断层长度', 'FaultLengt'], now) || '未知';
    const reliability = this.getPropertyValue(properties, ['可靠性等级', 'reliability'], now) || '未知';

    // 构建HTML内容
    let content = `<div><strong>🗺️ 五代图断层</strong><br/>`;

    if (name && name !== '未命名断层') {
      content += `<strong>名称:</strong> ${name}<br/>`;
    }

    content += `<strong>活动时代:</strong> ${this.getAgeDescription(age)}<br/>`;

    if (exposure && exposure !== '未知') {
      content += `<strong>出露情况:</strong> ${exposure}<br/>`;
    }

    if (nature && nature !== '未知') {
      content += `<strong>断层性质:</strong> ${nature}<br/>`;
    }

    if (strike && strike !== '未知' && strike !== '0') {
      content += `<strong>走向:</strong> ${strike}<br/>`;
    }

    if (dip && dip !== '未知' && dip !== '0') {
      content += `<strong>倾向:</strong> ${dip}<br/>`;
    }

    if (dipAngle && dipAngle !== '未知' && dipAngle !== '0') {
      content += `<strong>倾角:</strong> ${dipAngle}°<br/>`;
    }

    if (length && length !== '未知' && length !== '0' && length !== '0.0') {
      content += `<strong>长度:</strong> ${length}km<br/>`;
    }

    if (reliability && reliability !== '未知') {
      content += `<strong>可靠性:</strong> ${reliability}<br/>`;
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
   * 获取活动时代描述
   */
  getAgeDescription(age) {
    const ageMap = {
      'PreQ': '前第四纪',
      'Qp12': '早-中更新世',
      'Qp3': '晚更新世',
      'Qh': '全新世'
    };
    return ageMap[age] || age || '未知';
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
    console.log('🗑️ 五代图图层已销毁');
  }
}

// 导出到全局
window.GenerationLayer = GenerationLayer;