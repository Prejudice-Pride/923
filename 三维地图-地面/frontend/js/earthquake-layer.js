// 地震数据图层模块
// 负责从API获取地震数据并在Cesium中显示为点图层

class EarthquakeLayer {
  constructor(viewer) {
    this.viewer = viewer;
    this.dataSource = null;
    this.isVisible = false;
    this.apiUrl = '/api/data/earthquakes';
    this.infoWindow = null;  // 点击信息窗

    // 震级颜色映射
    this.magnitudeColors = {
      1: Cesium.Color.GREEN,      // M1-2: 绿色
      2: Cesium.Color.YELLOW,     // M2-3: 黄色
      3: Cesium.Color.ORANGE,     // M3-4: 橙色
      4: Cesium.Color.RED,        // M4-5: 红色
      5: Cesium.Color.PURPLE,     // M5-6: 紫色
      6: Cesium.Color.DARKRED,    // M6+: 深红色
      default: Cesium.Color.GRAY  // 默认: 灰色
    };
  }

  /**
   * 初始化地震图层
   */
  async initialize() {
    try {
      // 创建数据源
      this.dataSource = new Cesium.GeoJsonDataSource('earthquakes');

      // 禁用聚类，保持每个地震点单独显示
      this.dataSource.clustering.enabled = false;

      await this.viewer.dataSources.add(this.dataSource);

      // 保持默认值false，优先保证地球曲率遮挡
      // 通过适当的高度偏移来避免半圆问题
      this.viewer.scene.globe.depthTestAgainstTerrain = false;

      // 设置鼠标悬停事件
      this.setupMouseEvents();

      console.log('✅ 地震图层初始化成功（已启用地形遮挡）');
      return true;
    } catch (error) {
      console.error('❌ 地震图层初始化失败:', error);
      return false;
    }
  }

  /**
   * 从API获取地震数据
   */
  async fetchEarthquakeData(options = {}) {
    try {
      // 构建查询参数
      const params = new URLSearchParams();

      if (options.minMagnitude) params.append('min_magnitude', options.minMagnitude);
      if (options.maxMagnitude) params.append('max_magnitude', options.maxMagnitude);
      if (options.limit) params.append('limit', options.limit);
      if (options.recentYears) params.append('recent_years', options.recentYears);

      // 如果指定了边界框
      if (options.bbox) {
        params.append('bbox_west', options.bbox.west);
        params.append('bbox_south', options.bbox.south);
        params.append('bbox_east', options.bbox.east);
        params.append('bbox_north', options.bbox.north);
      }

      const url = params.toString() ? `${this.apiUrl}?${params}` : this.apiUrl;

      console.log('🌍 正在获取地震数据:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error('API返回错误状态');
      }

      console.log(`📊 获取到 ${result.total} 条地震记录`);
      return result.data; // 返回GeoJSON数据

    } catch (error) {
      console.error('❌ 获取地震数据失败:', error);
      throw error;
    }
  }

  /**
   * 过滤有效坐标的GeoJSON数据
   */
  filterValidCoordinates(geojsonData) {
    if (!geojsonData || !geojsonData.data || !geojsonData.data.features) {
      return geojsonData;
    }

    const originalCount = geojsonData.data.features.length;
    let removedCount = 0;

    geojsonData.data.features = geojsonData.data.features.filter((feature, index) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn(`❌ 地震点 ${index} 缺少坐标信息`);
        removedCount++;
        return false;
      }

      const coords = feature.geometry.coordinates;
      const lon = coords[0];
      const lat = coords[1];

      if (!isFinite(lon) || !isFinite(lat) ||
          lon < -180 || lon > 180 ||
          lat < -90 || lat > 90 ||
          (lon === 0 && lat === 0)) {
        const earthquakeId = feature.properties?.id || index;
        const magnitude = feature.properties?.magnitude || 'unknown';
        console.warn(`❌ 地震点 ${earthquakeId} (M${magnitude}) 坐标无效: [${lon}, ${lat}]`);
        removedCount++;
        return false;
      }

      return true;
    });

    if (removedCount > 0) {
      console.log(`🧹 过滤了 ${removedCount} 个无效坐标的地震点，剩余 ${geojsonData.data.features.length} 个`);
    }

    return geojsonData;
  }

  /**
   * 根据震级获取颜色
   */
  getMagnitudeColor(magnitude) {
    if (magnitude >= 6) return this.magnitudeColors[6];
    if (magnitude >= 5) return this.magnitudeColors[5];
    if (magnitude >= 4) return this.magnitudeColors[4];
    if (magnitude >= 3) return this.magnitudeColors[3];
    if (magnitude >= 2) return this.magnitudeColors[2];
    if (magnitude >= 1) return this.magnitudeColors[1];
    return this.magnitudeColors.default;
  }

  /**
   * 根据震级获取点大小
   */
  getMagnitudeSize(magnitude) {
    // 优化点大小，减少过大的点以提升性能（最小4像素，最大16像素）
    return Math.max(4, Math.min(16, magnitude * 3));
  }

  /**
   * 加载并显示地震数据
   */
  async loadEarthquakes(options = {}) {
    try {
      if (!this.dataSource) {
        await this.initialize();
      }

      // 获取数据
      const geojsonData = await this.fetchEarthquakeData(options);

      // 过滤无效坐标的地震数据
      const filteredGeojson = this.filterValidCoordinates(geojsonData);

      // 加载到数据源
      await this.dataSource.load(filteredGeojson);

      // 样式化地震点
      this.styleEarthquakePoints(options);

      // 🔥 官方推荐：等待地形加载完成后优化高度（可选）
      if (options.optimizeForTerrain) {
        this.optimizeHeightsAfterTerrainLoad();
      }

      // 设置可见性
      this.dataSource.show = true;
      this.isVisible = true;

      console.log('✅ 地震数据加载并显示成功');

      return this.dataSource.entities.values.length;

    } catch (error) {
      console.error('❌ 加载地震数据失败:', error);
      throw error;
    }
  }

  /**
   * 样式化地震点
   */
  styleEarthquakePoints(options = {}) {
    const entities = this.dataSource.entities.values;

    entities.forEach((entity, index) => {
      // 验证实体位置有效性
      if (!entity.position) {
        console.warn(`❌ 地震点 ${index} 缺少位置信息`);
        this.dataSource.entities.remove(entity);
        return;
      }

      const position = entity.position.getValue();
      if (!position) {
        console.warn(`❌ 地震点 ${index} 位置无效`);
        this.dataSource.entities.remove(entity);
        return;
      }

      // 验证坐标合理性
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      if (!isFinite(lon) || !isFinite(lat) ||
          lon < -180 || lon > 180 ||
          lat < -90 || lat > 90) {
        console.warn(`❌ 地震点 ${index} 坐标无效: [${lon}, ${lat}]`);
        this.dataSource.entities.remove(entity);
        return;
      }

      const props = entity.properties;
      const magnitude = props.magnitude?.getValue() || 0;

      // 🔥 关键修复：清除所有可能的图形属性，只保留point
      entity.billboard = undefined;
      entity.label = undefined;
      entity.box = undefined;
      entity.model = undefined;
      entity.polygon = undefined;

      // 官方推荐方案：使用默认深度测试 + CLAMP_TO_GROUND
      entity.point = {
        pixelSize: this.getMagnitudeSize(magnitude),
        color: Cesium.Color.fromAlpha(this.getMagnitudeColor(magnitude), 0.9),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 贴地显示
        scaleByDistance: new Cesium.NearFarScalar(50000, 1.0, 5000000, 0.3),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000000),
        disableDepthTestDistance: 1000 // 1km内禁用深度测试，避免半圆问题，保持地球曲率遮挡
      };

      // 隐藏标签，只通过鼠标悬停显示信息
      // entity.label = {
      //   text: `M${magnitude.toFixed(1)}`,
      //   font: '12pt sans-serif',
      //   pixelOffset: new Cesium.Cartesian2(0, -40),
      //   fillColor: Cesium.Color.WHITE,
      //   outlineColor: Cesium.Color.BLACK,
      //   outlineWidth: 2,
      //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      //   scale: 0.8,
      //   // 只在近距离显示标签
      //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 500000),
      //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      // };

      // 移除描述信息，避免显示蓝色方块
      // 改为存储在自定义属性中，供悬停提示使用

      // 从position中提取经纬度
      let longitude = '', latitude = '';
      if (entity.position) {
        const cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
        longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
        latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
      }

      entity.earthquakeInfo = {
        magnitude: magnitude,
        epicenter: props.epicenter?.getValue() || '',
        datetime: props.datetime?.getValue() || '',
        depth: props.depth?.getValue() || 0,
        eq_type: props.eqType?.getValue() || props.eq_type?.getValue() || '',
        longitude: longitude,
        latitude: latitude,
        title: props.title?.getValue() || '地震事件',
        description: props.description?.getValue() || ''
      };
    });

    console.log(`🎨 已样式化 ${entities.length} 个地震点`);
  }

  /**
   * 显示/隐藏地震图层
   */
  setVisible(visible) {
    if (this.dataSource) {
      this.dataSource.show = visible;
      this.isVisible = visible;
      console.log(`🔄 地震图层${visible ? '显示' : '隐藏'}`);
    }
  }

  /**
   * 获取图层可见性
   */
  getVisible() {
    return this.isVisible;
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
   * 清除地震数据
   */
  clear() {
    if (this.dataSource) {
      this.dataSource.entities.removeAll();
      console.log('🗑️ 已清除所有地震数据');
    }
  }

  /**
   * 飞行到地震数据范围
   */
  flyToEarthquakes() {
    if (this.dataSource && this.dataSource.entities.values.length > 0) {
      this.viewer.flyTo(this.dataSource)
        .then(() => {
          console.log('✈️ 已飞行到地震数据区域');
        })
        .catch(error => {
          console.error('❌ 飞行失败:', error);
        });
    }
  }

  /**
   * 按震级过滤显示
   */
  filterByMagnitude(minMag, maxMag) {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;
    entities.forEach(entity => {
      const magnitude = entity.earthquakeInfo?.magnitude || 0;
      entity.show = magnitude >= minMag && magnitude <= maxMag;
    });

    console.log(`🔍 已按震级过滤: M${minMag}-${maxMag}`);
  }

  /**
   * 重置过滤器
   */
  resetFilter() {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;
    entities.forEach(entity => {
      entity.show = true;
    });

    console.log('🔄 已重置地震数据过滤器');
  }

  /**
   * 设置鼠标事件（悬停提示）
   */
  setupMouseEvents() {
    if (!this.viewer || !this.viewer.canvas) return;

    // 创建信息窗（只创建一次）
    if (!this.infoWindow) {
      this.createInfoWindow();
    }

    // 绑定点击事件
    this.viewer.cesiumWidget.container.addEventListener('click', this.handleMouseClick.bind(this), false);

    // 监听相机移动事件，移动时关闭弹窗
    this.viewer.camera.moveStart.addEventListener(() => {
      this.hideInfoWindow();
    });
  }

  /**
   * 创建信息窗
   */
  createInfoWindow() {
    this.infoWindow = document.createElement('div');
    this.infoWindow.className = 'cesium-earthquake-info-window';
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
      min-width: 280px;
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

    if (pick && pick.id && pick.id.point && this.dataSource.entities.contains(pick.id)) {
      const earthquake = pick.id;
      if (earthquake.earthquakeInfo) {
        this.showInfoWindow(earthquake.earthquakeInfo, event);
      }
    } else {
      this.hideInfoWindow();
    }
  }

  /**
   * 显示信息窗
   */
  showInfoWindow(earthquakeInfo, event) {
    const content = this.generateInfoWindowContent(earthquakeInfo);

    this.infoWindow.innerHTML = content;
    this.infoWindow.style.display = 'block';

    // 计算位置，避免超出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const infoWidth = 300;
    const infoHeight = 300;

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
  }

  /**
   * 生成信息窗内容（简洁风格）
   */
  generateInfoWindowContent(earthquakeInfo) {
    // 格式化时间为中文习惯格式
    let formattedTime = '未知';
    if (earthquakeInfo.datetime) {
      try {
        // 尝试解析时间格式: "4/10/2022 07:19:34" 或 "2022-10-17 13:29:18"
        const timeStr = earthquakeInfo.datetime;
        let dateObj;

        if (timeStr.includes('/')) {
          // 格式: "17/10/2018 13:29:18" (日/月/年)
          const [datePart, timePart] = timeStr.split(' ');
          const [day, month, year] = datePart.split('/');
          dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`);
        } else {
          dateObj = new Date(timeStr);
        }

        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hour = String(dateObj.getHours()).padStart(2, '0');
          const minute = String(dateObj.getMinutes()).padStart(2, '0');
          const second = String(dateObj.getSeconds()).padStart(2, '0');
          formattedTime = `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
        }
      } catch (e) {
        console.warn('时间格式化失败:', e);
      }
    }

    // 格式化震级
    const magnitude = parseFloat(earthquakeInfo.magnitude);
    const magnitudeText = `M ${magnitude.toFixed(1)}`;

    // 格式化深度
    const depth = parseFloat(earthquakeInfo.depth);
    const depthText = `${depth.toFixed(1)} km`;

    // 根据震级选择颜色
    let magColor = '#ffa726'; // 橙色
    if (magnitude >= 7.0) {
      magColor = '#ef5350';
    } else if (magnitude >= 6.0) {
      magColor = '#ff7043';
    } else if (magnitude >= 5.0) {
      magColor = '#ffb74d';
    } else if (magnitude >= 4.0) {
      magColor = '#ffa726';
    } else if (magnitude >= 3.0) {
      magColor = '#ffc107';
    }

    // 构建HTML内容 - 简洁风格
    let content = `
      <!-- 标题 -->
      <div style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 18px; font-weight: 500; color: #5dade2;">地震信息</div>
      </div>

      <!-- 信息列表 - 左右布局，无图标 -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">时间:</span>
          <span style="color: #ffffff; font-size: 13px;">${formattedTime}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">震级:</span>
          <span style="color: ${magColor}; font-size: 16px; font-weight: 600;">${magnitudeText}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">深度:</span>
          <span style="color: #ffffff; font-size: 14px;">${depthText}</span>
        </div>

        ${earthquakeInfo.epicenter ? `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">震中:</span>
          <span style="color: #ffffff; font-size: 14px;">${earthquakeInfo.epicenter}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">经度:</span>
          <span style="color: #5dade2; font-size: 14px;">${earthquakeInfo.longitude || '未知'}°</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">纬度:</span>
          <span style="color: #5dade2; font-size: 14px;">${earthquakeInfo.latitude || '未知'}°</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #b0b8c1; font-size: 14px;">类型:</span>
          <span style="color: #ffffff; font-size: 14px;">${earthquakeInfo.eq_type || '未知'}</span>
        </div>
      </div>
    `;

    return content;
  }


  /**
   * 清理鼠标事件
   */
  cleanup() {
    if (this.infoWindow && this.infoWindow.parentNode) {
      document.body.removeChild(this.infoWindow);
      this.infoWindow = null;
    }
  }

  /**
   * 官方推荐的地形优化方法
   * 等待地形加载完成后手动调整高度，避免CLAMP_TO_GROUND性能问题
   */
  optimizeHeightsAfterTerrainLoad() {
    console.log('🔄 开始地形高度优化...');

    // 等待地形瓦片加载完成
    const checkTerrain = () => {
      if (this.viewer.scene.globe.tilesLoaded) {
        console.log('✅ 地形加载完成，开始高度优化');
        this.adjustEntityHeights();
      } else {
        // 继续等待
        setTimeout(checkTerrain, 100);
      }
    };

    checkTerrain();
  }

  /**
   * 调整实体高度到地面
   */
  async adjustEntityHeights() {
    if (!this.dataSource) return;

    const entities = this.dataSource.entities.values;
    console.log(`📏 正在调整 ${entities.length} 个地震点的高度...`);

    // 批量处理，避免阻塞UI
    const batchSize = 50;
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      batch.forEach(entity => {
        if (entity.position) {
          const cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue());

          // 使用相对地面高度，保持500米高度
          entity.position = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            500 // 固定500米高度，避免性能问题
          );

          // 移除heightReference，使用绝对高度
          if (entity.point) {
            entity.point.heightReference = undefined;
          }
        }
      });

      // 每批处理后稍作停顿，避免阻塞
      if (i + batchSize < entities.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log('✅ 地震点高度调整完成');
  }

  /**
   * 检查地形遮挡设置
   */
  checkTerrainOcclusion() {
    const depthTest = this.viewer.scene.globe.depthTestAgainstTerrain;
    console.log(`🔍 地形深度测试状态: ${depthTest ? '启用' : '禁用'}`);

    if (!depthTest) {
      console.warn('⚠️ 地形深度测试未启用，地震点不会被地形遮挡');
      console.log('💡 要启用遮挡效果，请运行: viewer.scene.globe.depthTestAgainstTerrain = true');
    } else {
      console.log('✅ 地形深度测试已启用，地震点会被地形正确遮挡');
    }

    return depthTest;
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    if (!this.dataSource) return null;

    const entities = this.dataSource.entities.values;
    const stats = {
      total: entities.length,
      visible: entities.filter(e => e.show).length,
      byMagnitude: {}
    };

    // 按震级统计
    entities.forEach(entity => {
      const magnitude = Math.floor(entity.earthquakeInfo?.magnitude || 0);
      stats.byMagnitude[magnitude] = (stats.byMagnitude[magnitude] || 0) + 1;
    });

    return stats;
  }
}

// 导出供其他模块使用
window.EarthquakeLayer = EarthquakeLayer;