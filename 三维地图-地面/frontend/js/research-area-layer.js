/**
 * 研究区域图层类
 * 用于显示地下研究区域的边界范围
 */
class ResearchAreaLayer {
  constructor(viewer, config) {
    this.viewer = viewer;
    this.name = config.name || '研究区域';
    this.id = config.id;

    // 边界范围
    this.bounds = {
      minLon: config.bounds.minLon,
      maxLon: config.bounds.maxLon,
      minLat: config.bounds.minLat,
      maxLat: config.bounds.maxLat
    };

    // 关联的数据集路径
    this.datasetPath = config.datasetPath;

    // Cesium实体
    this.entity = null;
    this.isVisible = false;

    // 样式配置
    this.style = {
      fillColor: Cesium.Color.RED.withAlpha(0.2), // 半透明红色填充
      outlineColor: Cesium.Color.RED.withAlpha(0.9), // 红色边界线
      outlineWidth: 3
    };

    console.log(`📍 研究区域图层已创建: ${this.name}`);
  }

  /**
   * 创建矩形实体
   */
  createEntity() {
    if (this.entity) return;

    const { minLon, maxLon, minLat, maxLat } = this.bounds;

    this.entity = this.viewer.entities.add({
      name: this.name,
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat),
        material: this.style.fillColor,
        outline: true,
        outlineColor: this.style.outlineColor,
        outlineWidth: this.style.outlineWidth,
        height: 0, // 贴地
        classificationType: Cesium.ClassificationType.TERRAIN // 贴到地形上
      }
    });

    console.log(`✅ 研究区域实体已创建: ${this.name}`);
  }

  /**
   * 显示图层
   */
  show() {
    if (!this.entity) {
      this.createEntity();
    }
    this.entity.show = true;
    this.isVisible = true;
    console.log(`👁️ 显示研究区域: ${this.name}`);
  }

  /**
   * 隐藏图层
   */
  hide() {
    if (this.entity) {
      this.entity.show = false;
    }
    this.isVisible = false;
    console.log(`🙈 隐藏研究区域: ${this.name}`);
  }

  /**
   * 切换可见性
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 检查某个点是否在研究区域内
   */
  containsPoint(lon, lat) {
    const { minLon, maxLon, minLat, maxLat } = this.bounds;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }

  /**
   * 获取区域中心点（用于飞行定位）
   */
  getCenter() {
    const { minLon, maxLon, minLat, maxLat } = this.bounds;
    return {
      longitude: (minLon + maxLon) / 2,
      latitude: (minLat + maxLat) / 2,
      height: 500000 // 50万米高度俯瞰
    };
  }

  /**
   * 飞向研究区域（让整个区域在视野中可见）
   */
  flyTo(duration = 2.0) {
    const { minLon, maxLon, minLat, maxLat } = this.bounds;

    // 创建矩形范围
    const rectangle = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);

    // 使用flyTo飞向矩形区域，Cesium会自动计算合适的高度让整个区域可见
    this.viewer.camera.flyTo({
      destination: rectangle,
      duration: duration,
      complete: () => {
        console.log(`✈️ 已飞往 ${this.name}，整个区域可见`);
      }
    });
  }

  /**
   * 获取区域信息
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      bounds: this.bounds,
      datasetPath: this.datasetPath,
      visible: this.isVisible,
      center: this.getCenter()
    };
  }

  /**
   * 销毁图层
   */
  destroy() {
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
    console.log(`🗑️ 研究区域图层已销毁: ${this.name}`);
  }
}

// 导出到全局
window.ResearchAreaLayer = ResearchAreaLayer;
