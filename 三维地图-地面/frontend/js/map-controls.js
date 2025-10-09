// 地图控制和交互模块
// 负责Cesium viewer的初始化、相机控制、鼠标交互等

// 工具函数
function byId(id) {
  return document.getElementById(id);
}

function setBtn(id, enabled) {
  const el = document.getElementById(id);
  if (!el) return;
  el.disabled = !enabled;
  el.classList.toggle('state-on', enabled);
  el.classList.toggle('state-off', !enabled);
}

// Viewer初始化
function initViewer() {
  const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    // 使用单像素透明底图，避免依赖第三方底图
    imageryProvider: new Cesium.SingleTileImageryProvider({
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      rectangle: Cesium.Rectangle.MAX_VALUE
    }),
    homeButton: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    infoBox: false,
    selectionIndicator: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    geocoder: false,
    fullscreenButton: false,
    navigationInstructionsInitiallyVisible: false,
    vrButton: false
  });

  // 基本地形显示优化
  viewer.scene.globe.enableLighting = false; // 关闭光照避免白天黑夜效果
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.globe.terrainExaggeration = 0.0; // 默认平坦地形，由UI控件控制显示

  // 保持大气效果让海洋呈现正常蓝色
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.fog.enabled = false;
  viewer.scene.globe.showGroundAtmosphere = true;

  // 固定太阳位置在正上方
  const julianDate = new Cesium.JulianDate();
  viewer.clock.currentTime = julianDate;
  viewer.clock.shouldAnimate = false;

  // 显示Cesium默认导航球
  viewer.cesiumWidget.creditContainer.style.display = 'none'; // 隐藏版权信息

  // 初始视角：地球整体
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(102.7129, 25.0389, 25000000)  // 高海拔俯视地球
  });

  viewer.scene.globe.terrainProviderChanged.addEventListener(() => {
    const name = viewer.scene.globe.terrainProvider?.constructor?.name || 'UnknownTerrain';
    if (window.SGSManager) {
      window.SGSManager.setStatus('地形提供者: ' + name);
    }
  });

  return viewer;
}

// 按钮状态初始化
function initButtonStates() {
  if (!window.viewer) return;

  const g = window.viewer.scene.globe;
  const btnL = document.getElementById('btnLighting');
  const btnD = document.getElementById('btnDepthTest');
  if (btnL) btnL.classList.toggle('success', g.enableLighting);
  if (btnD) btnD.classList.toggle('success', g.depthTestAgainstTerrain);
  const ex = document.getElementById('slExag');
  const lb = document.getElementById('lbExag');
  if (ex) ex.value = g.terrainExaggeration;
  if (lb) lb.textContent = g.terrainExaggeration.toFixed(1) + '×';
}

// 相机高度更新
function updateCamHeight() {
  try {
    const h = window.viewer.camera.positionCartographic.height;
    const camHEl = document.getElementById('camH');
    if (camHEl) {
      camHEl.textContent = h ? h.toFixed(0) : 'NA';
    }
  } catch (_) {}
}

// 姿态信息更新
function updateAtt() {
  try {
    const cam = window.viewer.camera;
    const heading = Cesium.Math.toDegrees(cam.heading);
    const pitch = Cesium.Math.toDegrees(cam.pitch);
    const roll = Cesium.Math.toDegrees(cam.roll);

    const attEl = document.getElementById('att');
    if (attEl) {
      attEl.textContent = `H:${heading.toFixed(0)}° P:${pitch.toFixed(0)}° R:${roll.toFixed(0)}°`;
    }
  } catch (_) {}
}

// 比例尺更新
function updateScaleBar() {
  try {
    const scene = window.viewer.scene;
    const canvas = scene.canvas;
    const camera = scene.camera;

    // 计算屏幕中心点的比例尺
    const centerPick = camera.getPickRay(new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2));
    const centerPosition = scene.globe.pick(centerPick, scene);

    if (centerPosition) {
      const carto = Cesium.Cartographic.fromCartesian(centerPosition);
      const height = carto.height;

      // 简化比例尺计算
      let scale;
      if (height > 10000000) scale = Math.round(height / 1000000) + ' Mm';
      else if (height > 10000) scale = Math.round(height / 1000) + ' km';
      else scale = Math.round(height) + ' m';

      const scaleEl = document.getElementById('scaleText');
      if (scaleEl) {
        scaleEl.textContent = scale;
      }
    }
  } catch (_) {}
}

// 坐标格式化
function toDMS(deg, isLat) {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  const dir = deg >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
  return `${d}°${m}'${s.toFixed(1)}"${dir}`;
}

function formatLonLat(lon, lat) {
  return `${lon.toFixed(5)}, ${lat.toFixed(5)}`;
}

// 鼠标位置坐标显示
function setupMousePos() {
  if (!window.viewer) return;

  const handler = new Cesium.ScreenSpaceEventHandler(window.viewer.scene.canvas);
  handler.setInputAction((event) => {
    try {
      const ray = window.viewer.camera.getPickRay(event.endPosition);
      const position = window.viewer.scene.globe.pick(ray, window.viewer.scene);

      if (position) {
        const carto = Cesium.Cartographic.fromCartesian(position);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const height = carto.height;

        const posLLEl = document.getElementById('posLL');
        const posHEl = document.getElementById('posH');

        if (posLLEl) {
          posLLEl.textContent = formatLonLat(lon, lat);
        }
        if (posHEl) {
          posHEl.textContent = height ? height.toFixed(0) : '0';
        }
      }
    } catch (_) {}
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// 相机飞行函数
function flyToPosition(lon, lat, height = 12000, duration = 1.2) {
  if (!window.viewer) return;

  window.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    duration: duration
  });
}

function flyHome() {
  if (!window.viewer) return;

  window.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(102.7129, 25.0389, 80000),
    duration: 2.5  // 增加飞行时间让过程更流畅
  });
}

function flyToGlobe() {
  if (!window.viewer) return;

  if (window.viewer.camera.flyHome) {
    window.viewer.camera.flyHome(1.2);
  }
}

function zoomIn() {
  if (!window.viewer) return;
  window.viewer.camera.zoomIn();
}

function zoomOut() {
  if (!window.viewer) return;
  window.viewer.camera.zoomOut();
}

// 全屏控制
function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  } catch (_) {}
}

// 搜索定位
function searchLocation() {
  const s = prompt('输入坐标，经度,纬度，例如: 108.94,34.34');
  if (!s) return;

  const m = s.split(',');
  if (m.length >= 2) {
    const lon = parseFloat(m[0]);
    const lat = parseFloat(m[1]);
    if (isFinite(lon) && isFinite(lat)) {
      flyToPosition(lon, lat, 1500, 1.0);
    }
  }
}

// 更新循环
function startUpdateLoop() {
  if (!window.viewer) return;

  // 更新相机信息
  setInterval(() => {
    updateCamHeight();
    updateAtt();
    updateScaleBar();
  }, 100);
}

// 导出函数供其他模块使用
window.MapControls = {
  initViewer,
  initButtonStates,
  setupMousePos,
  startUpdateLoop,
  flyToPosition,
  flyHome,
  flyToGlobe,
  zoomIn,
  zoomOut,
  toggleFullscreen,
  searchLocation,
  updateCamHeight,
  updateAtt,
  updateScaleBar,
  toDMS,
  formatLonLat,
  byId,
  setBtn
};