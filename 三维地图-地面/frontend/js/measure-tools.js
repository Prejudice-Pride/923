// 测量工具模块
// 负责距离测量、面积测量、高程测量等功能

// 测量状态管理
const _measure = {
  mode: 'none',
  handler: null,
  positions: [],
  dynamic: null,
  polyline: null,
  polygon: null,
  label: null,
  lastResult: null // 缓存最后一次测量结果
};

// 地面拾取函数
function pickGround(screenPosition) {
  try {
    const ray = window.viewer.camera.getPickRay(screenPosition);
    return window.viewer.scene.globe.pick(ray, window.viewer.scene);
  } catch (_) {
    return null;
  }
}

// 坐标转换函数
function cart2carto(arr) {
  return arr.map(c => Cesium.Cartographic.fromCartesian(c));
}

// 距离计算（米）
function distMeters(arr) {
  let d = 0;
  const cs = cart2carto(arr);
  for (let i = 1; i < cs.length; i++) {
    const g = new Cesium.EllipsoidGeodesic(cs[i - 1], cs[i]);
    d += g.surfaceDistance || 0;
  }
  return d;
}

// 面积计算（平方米）
function areaMeters(arr) {
  if (arr.length < 3) return 0;
  try {
    // 创建多边形几何体进行面积计算
    const polygonGeometry = Cesium.PolygonGeometry.createGeometry(
      new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(arr),
        granularity: 0.1
      })
    );

    if (!polygonGeometry) return 0;

    // 使用椭球面积计算
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    const cartographics = cart2carto(arr);

    // 计算椭球面上的面积
    let area = 0;
    for (let i = 0; i < cartographics.length; i++) {
      const p1 = cartographics[i];
      const p2 = cartographics[(i + 1) % cartographics.length];

      const g = new Cesium.EllipsoidGeodesic(p1, p2, ellipsoid);
      area += g.surfaceDistance * Math.cos((p1.latitude + p2.latitude) / 2);
    }

    return Math.abs(area);
  } catch (error) {
    console.warn('面积计算出错:', error);
    // 备用简单算法
    try {
      const cartographics = cart2carto(arr);
      let area = 0;
      for (let i = 0; i < cartographics.length; i++) {
        const j = (i + 1) % cartographics.length;
        area += cartographics[i].longitude * cartographics[j].latitude;
        area -= cartographics[j].longitude * cartographics[i].latitude;
      }
      area = Math.abs(area) / 2;

      // 转换为平方米（粗略估算）
      const R = 6371000; // 地球半径（米）
      return area * R * R;
    } catch (_) {
      return 0;
    }
  }
}

// 格式化距离显示
function formatDistance(meters) {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km';
  } else {
    return meters.toFixed(1) + ' m';
  }
}

// 格式化面积显示
function formatArea(sqMeters) {
  if (sqMeters >= 1000000) {
    return (sqMeters / 1000000).toFixed(2) + ' km²';
  } else {
    return sqMeters.toFixed(1) + ' m²';
  }
}

// 确保折线实体存在
function ensurePolyline() {
  if (!_measure.polyline) {
    _measure.polyline = window.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const pos = [..._measure.positions];
          if (_measure.dynamic && _measure.dynamic._temp) {
            pos.push(_measure.dynamic._temp);
          }
          return pos;
        }, false),
        width: 3,
        material: Cesium.Color.YELLOW,
        clampToGround: true,
        classificationType: Cesium.ClassificationType.BOTH
      }
    });
  }
}

// 确保多边形实体存在
function ensurePolygon() {
  if (!_measure.polygon) {
    _measure.polygon = window.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          const pos = [..._measure.positions];
          if (_measure.dynamic && _measure.dynamic._temp) {
            pos.push(_measure.dynamic._temp);
          }
          return new Cesium.PolygonHierarchy(pos);
        }, false),
        material: Cesium.Color.YELLOW.withAlpha(0.3),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 2,
        extrudedHeight: 0,
        classificationType: Cesium.ClassificationType.BOTH
      }
    });
  }
}

// 确保绘制实体存在
function ensureDrawing() {
  if (_measure.mode === 'distance' || _measure.mode === 'height') {
    ensurePolyline();
  }
  if (_measure.mode === 'area') {
    ensurePolygon();
  }
}

// 更新测量标签
async function updateMeasureLabel(finalize = false) {
  if (_measure.mode === 'none') return;

  ensureDrawing();

  if (!_measure.dynamic) {
    _measure.dynamic = window.viewer.entities.add({
      position: new Cesium.CallbackProperty(() => {
        const pos = [..._measure.positions];
        if (_measure.dynamic._temp) pos.push(_measure.dynamic._temp);
        return pos.length > 0 ? pos[pos.length - 1] : undefined;
      }, false),
      label: {
        text: new Cesium.CallbackProperty(() => {
          const pos = [..._measure.positions];
          if (_measure.dynamic._temp) pos.push(_measure.dynamic._temp);

          if (pos.length < 2 && _measure.mode !== 'point') return '点击开始测量';

          switch (_measure.mode) {
            case 'distance':
              const dist = distMeters(pos);
              return `距离: ${formatDistance(dist)}`;
            case 'area':
              if (pos.length < 3) return '继续点击形成面积';
              const area = areaMeters(pos);
              return `面积: ${formatArea(area)}`;
            case 'height':
              if (pos.length === 1) return '点击第二点';
              const cart1 = Cesium.Cartographic.fromCartesian(pos[0]);
              const cart2 = Cesium.Cartographic.fromCartesian(pos[1]);
              const heightDiff = Math.abs(cart2.height - cart1.height);
              return `高差: ${heightDiff.toFixed(1)} m`;
            default:
              return '';
          }
        }, false),
        font: '14pt Arial',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
        backgroundPadding: new Cesium.Cartesian2(8, 4)
      }
    });
  }

  if (finalize) {
    _measure.dynamic = null;
  }
}

// 开始测量
function startMeasure(type) {
  clearMeasure();
  _measure.mode = type;
  _measure.positions = [];

  if (!window.viewer) return;

  _measure.handler = new Cesium.ScreenSpaceEventHandler(window.viewer.scene.canvas);

  // 左键点击添加点
  _measure.handler.setInputAction((movement) => {
    const p = pickGround(movement.position);
    if (!p) return;
    _measure.positions.push(p);

    if (_measure.mode === 'height' && _measure.positions.length === 2) {
      finishMeasure();
    }

    updateMeasureLabel();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 鼠标移动实时更新
  _measure.handler.setInputAction((movement) => {
    const p = pickGround(movement.endPosition);
    if (!_measure.dynamic || !p) return;
    _measure.dynamic._temp = p;
    updateMeasureLabel();
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  // 右键或双击结束测量
  _measure.handler.setInputAction(() => finishMeasure(), Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  _measure.handler.setInputAction(() => finishMeasure(), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  console.log(`开始${type === 'distance' ? '距离' : type === 'area' ? '面积' : '高差'}测量`);
}

// 结束测量
function finishMeasure() {
  if (_measure.handler) {
    _measure.handler.destroy();
    _measure.handler = null;
  }

  // 在清除模式前缓存测量结果
  _measure.lastResult = getCurrentMeasureResult();

  _measure.mode = 'none';
  updateMeasureLabel(true);
  console.log('测量完成');
}

// 清除测量
function clearMeasure() {
  try {
    if (_measure.handler) {
      _measure.handler.destroy();
      _measure.handler = null;
    }
    if (_measure.polyline && window.viewer) {
      window.viewer.entities.remove(_measure.polyline);
      _measure.polyline = null;
    }
    if (_measure.polygon && window.viewer) {
      window.viewer.entities.remove(_measure.polygon);
      _measure.polygon = null;
    }
    if (_measure.label && window.viewer) {
      window.viewer.entities.remove(_measure.label);
      _measure.label = null;
    }
    if (_measure.dynamic && window.viewer) {
      window.viewer.entities.remove(_measure.dynamic);
      _measure.dynamic = null;
    }
    _measure.positions = [];
    _measure.mode = 'none';
    _measure.lastResult = null;
  } catch (e) {
    console.warn('清除测量时出错:', e);
  }
}

// 内部函数：根据当前状态计算测量结果
function getCurrentMeasureResult() {
  if (_measure.positions.length < 2) return null;

  switch (_measure.mode) {
    case 'distance':
      return {
        type: 'distance',
        value: distMeters(_measure.positions),
        unit: 'm',
        formatted: formatDistance(distMeters(_measure.positions))
      };
    case 'area':
      if (_measure.positions.length < 3) return null;
      return {
        type: 'area',
        value: areaMeters(_measure.positions),
        unit: 'm²',
        formatted: formatArea(areaMeters(_measure.positions))
      };
    case 'height':
      if (_measure.positions.length < 2) return null;
      const cart1 = Cesium.Cartographic.fromCartesian(_measure.positions[0]);
      const cart2 = Cesium.Cartographic.fromCartesian(_measure.positions[1]);
      const heightDiff = Math.abs(cart2.height - cart1.height);
      return {
        type: 'height',
        value: heightDiff,
        unit: 'm',
        formatted: `${heightDiff.toFixed(1)} m`
      };
    default:
      return null;
  }
}

// 获取测量结果（公共接口）
function getMeasureResult() {
  // 如果当前正在测量，返回实时结果
  if (_measure.mode !== 'none') {
    return getCurrentMeasureResult();
  }

  // 如果测量已完成，返回缓存的最后结果
  return _measure.lastResult;
}

// 导出函数供其他模块使用
window.MeasureTools = {
  startMeasure,
  finishMeasure,
  clearMeasure,
  getMeasureResult,
  pickGround,
  distMeters,
  areaMeters,
  formatDistance,
  formatArea,
  get measureState() { return _measure; }
};