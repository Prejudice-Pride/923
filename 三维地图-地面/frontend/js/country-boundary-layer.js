// 国界数据图层模块
// 使用Cesium官方GeoJsonDataSource加载显示国界线数据

class CountryBoundaryLayer {
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.isVisible = false;
    this.apiUrl = '/api/data/country-boundary';

    // 国界样式配置
    this.boundaryStyle = {
      strokeWidth: 4, // 增加线宽
      strokeColor: Cesium.Color.GOLD.withAlpha(0.9),
      clampToGround: false, // 禁用地面贴合以避免几何错误
      heightOffset: 50, // 离地面50米，比断层和五代图更高
      // 抗锯齿设置
      outline: true,
      outlineWidth: 1.0,
      outlineColor: Cesium.Color.BLACK.withAlpha(0.3)
    };

    // 显示高度控制
    this.displayHeights = {
      minHeight: 5000000,   // 5000km以上显示
      maxHeight: 50000000,  // 50000km以下显示
      optimalHeight: 10000000 // 最佳显示高度 10000km
    };
  }

  /**
   * 初始化国界图层
   */
  async initialize() {
    try {
      console.log('🔧 初始化国界图层...');

      // 创建GeoJsonDataSource
      this.dataSource = new Cesium.GeoJsonDataSource('country-boundary');

      // 添加到场景
      await this.viewer.dataSources.add(this.dataSource);

      // 启用地形深度测试
      this.viewer.scene.globe.depthTestAgainstTerrain = true;

      // 初始化鼠标点击事件
      this.initializeClickEvents();

      console.log('✅ 国界图层初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 国界图层初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载国界数据
   */
  async loadData() {
    try {
      console.log('📡 正在加载国界数据...');

      // 从API获取GeoJSON数据
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojsonData = await response.json();
      console.log(`📊 获取到 ${geojsonData.features.length} 个国界要素`);

      // 加载到DataSource
      await this.dataSource.load(geojsonData);

      // 应用样式
      this.applyStyle();

      // 默认隐藏
      this.setVisible(false);

      console.log('✅ 国界数据加载成功');
      return true;
    } catch (error) {
      console.error('❌ 国界数据加载失败:', error);
      return false;
    }
  }

  /**
   * 应用国界样式
   */
  applyStyle() {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;

    entities.forEach(entity => {
      // 处理多边形数据，提取边界线
      if (entity.polygon) {
        // 从多边形数据创建边界线
        this.createBoundaryLinesFromPolygon(entity);
      } else if (entity.polyline) {
        // 原有的线条处理逻辑
        this.applyPolylineStyle(entity);
      }
    });

    console.log(`🎨 已应用国界样式到 ${entities.length} 个要素`);
  }

  /**
   * 从多边形创建边界线
   */
  createBoundaryLinesFromPolygon(entity) {
    if (!entity.polygon || !entity.polygon.hierarchy) return;

    const hierarchy = entity.polygon.hierarchy.getValue();

    // 处理外边界
    if (hierarchy.positions && hierarchy.positions.length > 0) {
      // 创建边界线实体
      const boundaryEntity = this.dataSource.entities.add({
        polyline: {
          positions: [...hierarchy.positions, hierarchy.positions[0]], // 闭合边界线
          width: this.boundaryStyle.strokeWidth,
          material: this.boundaryStyle.strokeColor,
          // 抗锯齿设置
          outline: this.boundaryStyle.outline,
          outlineWidth: this.boundaryStyle.outlineWidth,
          outlineColor: this.boundaryStyle.outlineColor,
          // 线条连续性和平滑度优化
          granularity: Cesium.Math.RADIANS_PER_DEGREE,
          followSurface: false,
          arcType: Cesium.ArcType.NONE,
          // 启用地形遮挡效果
        },
        properties: entity.properties // 保持原有属性用于信息窗口
      });
    }

    // 处理内边界（孔洞）
    if (hierarchy.holes && hierarchy.holes.length > 0) {
      hierarchy.holes.forEach(hole => {
        if (hole.positions && hole.positions.length > 0) {
          const holeEntity = this.dataSource.entities.add({
            polyline: {
              positions: [...hole.positions, hole.positions[0]], // 闭合孔洞边界
              width: this.boundaryStyle.strokeWidth,
              material: this.boundaryStyle.strokeColor,
              // 抗锯齿设置
              outline: this.boundaryStyle.outline,
              outlineWidth: this.boundaryStyle.outlineWidth,
              outlineColor: this.boundaryStyle.outlineColor,
              // 线条连续性和平滑度优化
              granularity: Cesium.Math.RADIANS_PER_DEGREE,
              followSurface: false,
              arcType: Cesium.ArcType.NONE,
              // 启用地形遮挡效果
            },
            properties: entity.properties
          });
        }
      });
    }

    // 隐藏原多边形实体
    entity.polygon.show = false;
  }

  /**
   * 应用线条样式
   */
  applyPolylineStyle(entity) {
    // 设置线样式
    entity.polyline.width = this.boundaryStyle.strokeWidth;
    entity.polyline.material = this.boundaryStyle.strokeColor;
    entity.polyline.clampToGround = this.boundaryStyle.clampToGround;

    // 抗锯齿设置
    if (this.boundaryStyle.outline) {
      entity.polyline.outline = this.boundaryStyle.outline;
      entity.polyline.outlineWidth = this.boundaryStyle.outlineWidth;
      entity.polyline.outlineColor = this.boundaryStyle.outlineColor;
    }

    // 线条连续性和平滑度优化
    entity.polyline.granularity = Cesium.Math.RADIANS_PER_DEGREE;
    entity.polyline.followSurface = false;
    entity.polyline.arcType = Cesium.ArcType.NONE;

    // 启用地形遮挡效果 - 保持默认设置
  }

  /**
   * 初始化鼠标点击事件
   */
  initializeClickEvents() {
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
    this.infoWindow.className = 'cesium-country-info-window';
    this.infoWindow.style.cssText = `
      position: absolute;
      background: rgba(255, 215, 0, 0.95);
      color: #333;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: bold;
      z-index: 10002;
      display: none;
      max-width: 300px;
      min-width: 150px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 2px solid rgba(255, 215, 0, 1);
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
      color: #333;
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

    if (pick && pick.id && pick.id.polyline && this.isCountryBoundaryEntity(pick.id)) {
      this.showInfoWindow(pick.id, event);
      this.highlightEntity(pick.id);
    } else {
      this.hideInfoWindow();
      this.clearHighlight();
    }
  }

  /**
   * 检查是否为国界实体
   */
  isCountryBoundaryEntity(entity) {
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
      color: #333;
    `;
    this.closeButton.onclick = () => this.hideInfoWindow();
    this.infoWindow.appendChild(this.closeButton);

    this.infoWindow.style.display = 'block';

    // 计算位置，避免超出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const infoWidth = 300;
    const infoHeight = 150;

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
    entity.polyline.material = Cesium.Color.WHITE.withAlpha(1.0);
    entity.polyline.width = this.boundaryStyle.strokeWidth + 2;
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
      return '<div><strong>🌐 国界线</strong><br/>无详细信息</div>';
    }

    const now = Cesium.JulianDate.now();

    // 获取主要属性
    const name = this.getPropertyValue(properties, ['NAME', 'name', '名称', 'Country'], now) || '中华人民共和国';
    const area = this.getPropertyValue(properties, ['AREA', 'area', '面积'], now);
    const length = this.getPropertyValue(properties, ['LENGTH', 'length', '长度'], now);

    // 构建HTML内容
    let content = `<div><strong>🌐 国界线</strong><br/>`;
    content += `<strong>国家:</strong> ${name}<br/>`;

    if (area && area !== '未知') {
      content += `<strong>面积:</strong> ${area}平方公里<br/>`;
    }

    if (length && length !== '未知') {
      content += `<strong>边界长度:</strong> ${length}公里<br/>`;
    }

    content += `<strong>级别:</strong> 国家级边界<br/>`;
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
   * 设置图层可见性
   */
  setVisible(visible) {
    if (!this.dataSource) return;

    this.dataSource.show = visible;
    this.isVisible = visible;

    console.log(`👁️ 国界图层${visible ? '显示' : '隐藏'}`);
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
      this.boundaryStyle.strokeWidth = styleOptions.strokeWidth;
    }
    if (styleOptions.strokeColor !== undefined) {
      this.boundaryStyle.strokeColor = styleOptions.strokeColor;
    }
    if (styleOptions.clampToGround !== undefined) {
      this.boundaryStyle.clampToGround = styleOptions.clampToGround;
    }
    if (styleOptions.heightOffset !== undefined) {
      this.boundaryStyle.heightOffset = styleOptions.heightOffset;
    }

    // 重新应用样式
    this.applyStyle();
  }

  /**
   * 缩放到图层范围
   */
  zoomToLayer() {
    if (!this.dataSource || !this.isVisible) return;

    try {
      this.viewer.flyTo(this.dataSource);
      console.log('🎯 已缩放到国界图层范围');
    } catch (error) {
      console.error('❌ 缩放到国界图层失败:', error);
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
    const boundaryCount = entities.length;

    return {
      loaded: true,
      visible: this.isVisible,
      boundaryCount: boundaryCount,
      dataSource: 'API: /api/country-boundary',
      style: this.boundaryStyle
    };
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
    console.log('🗑️ 国界图层已销毁');
  }
}

// 导出到全局
window.CountryBoundaryLayer = CountryBoundaryLayer;