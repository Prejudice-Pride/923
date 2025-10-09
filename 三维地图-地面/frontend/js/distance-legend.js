/**
 * 距离比例尺 - 基于TerriaJS实现
 * 动态显示地图比例尺，根据相机高度自动调整单位
 */

class DistanceLegend {
  constructor(viewer, container) {
    this.viewer = viewer;
    this.container = container || document.body;

    // 创建比例尺DOM
    this.element = this.createLegendElement();
    this.container.appendChild(this.element);

    // 监听相机变化
    this.viewer.camera.changed.addEventListener(this.update.bind(this));

    // 初始化更新 - 延迟确保场景已准备好
    setTimeout(() => {
      this.update();
      // 强制触发一次更新确保显示
      setTimeout(() => this.update(), 100);
    }, 50);
  }

  createLegendElement() {
    const legend = document.createElement('div');
    legend.className = 'cesium-distance-legend';
    legend.style.cssText = `
      position: fixed !important;
      left: 20px !important;
      right: auto !important;
      bottom: 50px !important;
      width: 125px;
      height: 30px;
      user-select: none;
      z-index: 1200;
      pointer-events: none;
    `;

    const label = document.createElement('div');
    label.className = 'distance-legend-label';
    label.style.cssText = `
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      width: 100%;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      font-family: 'Courier New', monospace;
      margin-bottom: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      letter-spacing: 1px;
    `;

    const bar = document.createElement('div');
    bar.className = 'distance-legend-bar';
    bar.style.cssText = `
      position: relative;
      height: 10px;
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-top: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
      margin: 0 auto;
    `;

    legend.appendChild(label);
    legend.appendChild(bar);

    this.label = label;
    this.bar = bar;

    return legend;
  }

  update() {
    const scene = this.viewer.scene;
    const camera = this.viewer.camera;

    // 如果相机位置无效，隐藏比例尺
    if (!camera.positionCartographic) {
      this.element.style.display = 'none';
      return;
    }

    // 获取屏幕中心底部两个点
    const width = scene.canvas.clientWidth;
    const height = scene.canvas.clientHeight;

    const left = scene.camera.getPickRay(new Cesium.Cartesian2(width / 2 | 0, height - 1));
    const right = scene.camera.getPickRay(new Cesium.Cartesian2(1 + width / 2 | 0, height - 1));

    if (!left || !right) {
      this.element.style.display = 'none';
      return;
    }

    const globe = scene.globe;
    let leftPosition = globe.pick(left, scene);
    let rightPosition = globe.pick(right, scene);

    // 如果pick失败（地形未加载），使用椭球体表面作为备选
    if (!leftPosition || !rightPosition) {
      const ellipsoid = globe.ellipsoid;
      const leftCart = scene.camera.pickEllipsoid(new Cesium.Cartesian2(width / 2 | 0, height - 1), ellipsoid);
      const rightCart = scene.camera.pickEllipsoid(new Cesium.Cartesian2(1 + width / 2 | 0, height - 1), ellipsoid);

      if (!leftCart || !rightCart) {
        this.element.style.display = 'none';
        return;
      }

      leftPosition = ellipsoid.cartesianToCartographic(leftCart);
      rightPosition = ellipsoid.cartesianToCartographic(rightCart);

      if (!leftPosition || !rightPosition) {
        this.element.style.display = 'none';
        return;
      }

      // 使用地理坐标计算
      const geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(leftPosition, rightPosition);
      const pixelDistance = geodesic.surfaceDistance;

      const { distance, unit, barWidth } = this.calculateScale(pixelDistance);
      this.label.textContent = `${distance} ${unit}`;
      this.bar.style.width = `${barWidth}px`;
      this.element.style.display = 'block';
      return;
    }

    // 计算两点之间的距离
    const leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
    const rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

    const geodesic = new Cesium.EllipsoidGeodesic();
    geodesic.setEndPoints(leftCartographic, rightCartographic);
    const pixelDistance = geodesic.surfaceDistance;

    // 计算合适的比例尺长度和单位
    const { distance, unit, barWidth } = this.calculateScale(pixelDistance);

    // 更新显示
    this.label.textContent = `${distance} ${unit}`;
    this.bar.style.width = `${barWidth}px`;
    this.element.style.display = 'block';
  }

  calculateScale(pixelDistance) {
    // 目标比例尺宽度（像素）
    const targetWidth = 100;

    // 计算实际距离（米）
    let distance = pixelDistance * targetWidth;
    let unit = 'm';
    let barWidth = targetWidth;

    // 转换为合适的单位
    if (distance >= 1000) {
      distance = distance / 1000;
      unit = 'km';
    }

    // 规范化数字（使用常见的比例尺数字）
    const scales = [1, 2, 3, 5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 500, 750, 1000];
    let bestScale = scales[0];

    for (let i = 0; i < scales.length; i++) {
      if (scales[i] <= distance) {
        bestScale = scales[i];
      } else {
        break;
      }
    }

    // 计算实际显示宽度
    barWidth = (bestScale / distance) * targetWidth;

    return {
      distance: bestScale,
      unit: unit,
      barWidth: Math.round(barWidth)
    };
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.viewer && this.viewer.camera) {
      this.viewer.camera.changed.removeEventListener(this.update);
    }
  }
}

// 导出
window.DistanceLegend = DistanceLegend;
