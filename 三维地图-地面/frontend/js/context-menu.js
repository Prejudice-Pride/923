// 右键菜单模块 - 多级菜单系统
class ContextMenu {
  constructor(viewer) {
    console.log('🔧 初始化右键菜单...', viewer);
    this.viewer = viewer;
    this.menuElement = null;
    this.submenuElement = null;
    this.clickPosition = null;
    this.cartesianPosition = null;

    // 状态跟踪对象
    this.featureStates = {
      rotation: false,
      keyboardRoaming: false,
      rain: false,
      snow: false,
      fog: false,
      bloom: false,
      nightVision: false,
      blackAndWhite: false,
      silhouette: false,
      terrain: true, // 默认开启
      depthTest: true,
      skyBox: true,
      shadows: false,
      atmosphere: true
    };

    this.initializeMenu();
    this.setupEventHandlers();
    console.log('✅ 右键菜单构造完成');
  }

  /**
   * 初始化右键菜单
   */
  initializeMenu() {
    // 创建主菜单容器
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'context-menu';
    this.menuElement.style.cssText = `
      position: fixed;
      background: rgba(45, 48, 52, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 4px 0;
      min-width: 180px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      z-index: 10000;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #fff;
      backdrop-filter: blur(12px);
    `;

    // 创建子菜单容器
    this.submenuElement = document.createElement('div');
    this.submenuElement.className = 'context-submenu';
    this.submenuElement.style.cssText = `
      position: fixed;
      background: rgba(45, 48, 52, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 4px 0;
      min-width: 160px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      z-index: 10001;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #fff;
      backdrop-filter: blur(12px);
    `;

    // 定义菜单结构（根据参考图）
    const menuStructure = [
      { icon: '📍', text: '查看此处坐标', action: () => this.showCoordinates() },
      { icon: '👁️', text: '查看当前视角', action: () => this.showCurrentView() },
      {
        icon: '🔧',
        text: '常用工具',
        hasSubmenu: true,
        submenu: [
          { icon: '📚', text: '关闭图层管理', action: () => this.showNotification('图层管理功能开发中', 'info') },
          { icon: '📐', text: '图上量算', action: () => this.measureDistance() },
          { icon: '🗺️', text: '空间分析', action: () => this.spatialAnalysis() },
          { icon: '📍', text: '坐标定位', action: () => this.coordinateLocation() },
          { icon: '🧭', text: '地区导航', action: () => this.locationNavigation() },
          { icon: '🏷️', text: '我的标记', action: () => this.showNotification('我的标记功能开发中', 'info') },
          { icon: '📖', text: '视角书签', action: () => this.viewBookmark() },
          { icon: '🖨️', text: '地图打印', action: () => this.printMap() },
          { icon: '🔍', text: '关闭兴趣点查询', action: () => this.showNotification('兴趣点查询功能开发中', 'info') },
          { icon: '❌', text: '关闭所有', action: () => this.showNotification('关闭所有功能开发中', 'info') }
        ]
      },
      {
        icon: '📏',
        text: '图上量算',
        hasSubmenu: true,
        submenu: [
          { icon: '📏', text: '距离', action: () => this.measureDistance() },
          { icon: '📐', text: '面积', action: () => this.measureArea() },
          { icon: '📊', text: '高度差', action: () => this.measureHeight() },
          { icon: '📐', text: '角度', action: () => this.measureAngle() }
        ]
      },
      {
        icon: '🏷️',
        text: '图上标记',
        hasSubmenu: true,
        submenu: [
          { icon: '🚩', text: '标记点', action: () => this.markPoint() },
          { icon: '〰️', text: '标记线', action: () => this.markPolyline() },
          { icon: '▭', text: '标记面', action: () => this.markPolygon() },
          { icon: '⭕', text: '标记圆', action: () => this.markCircle() },
          { icon: '▢', text: '标记矩形', action: () => this.markRectangle() },
          { icon: '✏️', text: '清除所有标记', action: () => this.clearAllMarkers() }
        ]
      },
      {
        icon: '🎯',
        text: '视角切换',
        hasSubmenu: true,
        submenu: [
          { icon: '🔄', text: '环绕飞行', action: () => this.startRotation(), stateKey: 'rotation' },
          { icon: '🎯', text: '移动到此处', action: () => this.flyToPosition() },
          { icon: '👁️', text: '第一视角站到此处', action: () => this.firstPersonView() },
          { icon: '⌨️', text: '键盘漫游', action: () => this.toggleKeyboardRoaming(), stateKey: 'keyboardRoaming' }
        ]
      },
      {
        icon: '✨',
        text: '特效效果',
        hasSubmenu: true,
        submenu: [
          { icon: '🌧️', text: '下雨效果', action: () => this.toggleRain(), stateKey: 'rain' },
          { icon: '❄️', text: '下雪效果', action: () => this.toggleSnow(), stateKey: 'snow' },
          { icon: '☁️', text: '雾天气', action: () => this.toggleFog(), stateKey: 'fog' },
          { icon: '⚙️', text: '泛光效果', action: () => this.toggleBloom(), stateKey: 'bloom' },
          { icon: '☀️', text: '调节亮度', action: () => this.adjustBrightness() },
          { icon: '🌙', text: '夜视效果', action: () => this.toggleNightVision(), stateKey: 'nightVision' },
          { icon: '⚫', text: '黑白效果', action: () => this.toggleBlackAndWhite(), stateKey: 'blackAndWhite' },
          { icon: '🔒', text: '拾取高亮', action: () => this.toggleSilhouette(), stateKey: 'silhouette' }
        ]
      },
      {
        icon: '🌍',
        text: '地形服务',
        hasSubmenu: true,
        submenu: [
          { icon: '🏔️', text: '地形显示', action: () => this.toggleTerrain(), stateKey: 'terrain' },
          { icon: '△', text: '显示三角网', action: () => this.showNotification('三角网显示功能开发中', 'info') }
        ]
      },
      {
        icon: '⚙️',
        text: '场景设置',
        hasSubmenu: true,
        submenu: [
          { icon: '📏', text: '深度检测', action: () => this.toggleDepthTest(), stateKey: 'depthTest' },
          { icon: '◇', text: '星空背景', action: () => this.toggleSkyBox(), stateKey: 'skyBox' },
          { icon: '☀️', text: '日照阴影', action: () => this.toggleShadows(), stateKey: 'shadows' },
          { icon: '🌫️', text: '大气渲染', action: () => this.toggleAtmosphere(), stateKey: 'atmosphere' },
          { icon: '⬆️', text: '导出JSON', action: () => this.exportSceneJSON() },
          { icon: '📸', text: '场景出图', action: () => this.captureScene() }
        ]
      }
    ];

    // 创建主菜单项
    menuStructure.forEach((item, index) => {
      this.createMenuItem(item, index);
    });

    document.body.appendChild(this.menuElement);
    document.body.appendChild(this.submenuElement);
  }

  /**
   * 创建菜单项
   */
  createMenuItem(item, index) {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.style.cssText = `
      padding: 7px 12px;
      cursor: pointer;
      transition: background-color 0.15s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    `;

    const leftContent = document.createElement('span');
    leftContent.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    leftContent.innerHTML = `
      <span style="width: 18px; text-align: center; font-size: 14px;">${item.icon}</span>
      <span>${item.text}</span>
    `;

    menuItem.appendChild(leftContent);

    // 如果有子菜单，添加箭头
    if (item.hasSubmenu) {
      const arrow = document.createElement('span');
      arrow.textContent = '▶';
      arrow.style.cssText = 'color: rgba(255,255,255,0.6); font-size: 10px;';
      menuItem.appendChild(arrow);
    }

    // 鼠标事件
    menuItem.addEventListener('mouseenter', () => {
      // 清除其他项的高亮
      Array.from(this.menuElement.children).forEach(child => {
        child.style.background = 'transparent';
      });
      menuItem.style.background = 'rgba(66, 133, 244, 0.85)';

      // 如果有子菜单，显示它
      if (item.hasSubmenu && item.submenu) {
        this.showSubmenu(item.submenu, menuItem);
      } else {
        this.hideSubmenu();
      }
    });

    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!item.hasSubmenu && item.action) {
        item.action();
        this.hideMenu();
      }
    });

    this.menuElement.appendChild(menuItem);
  }

  /**
   * 显示子菜单
   */
  showSubmenu(submenuItems, parentItem) {
    // 清空子菜单
    this.submenuElement.innerHTML = '';

    // 创建子菜单项
    submenuItems.forEach(item => {
      const submenuItem = document.createElement('div');
      submenuItem.className = 'context-submenu-item';
      submenuItem.style.cssText = `
        padding: 7px 12px;
        cursor: pointer;
        transition: background-color 0.15s;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
      `;

      // 左侧内容(图标+文字)
      const leftContent = document.createElement('span');
      leftContent.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      leftContent.innerHTML = `
        <span style="width: 18px; text-align: center; font-size: 14px;">${item.icon}</span>
        <span>${item.text}</span>
      `;
      submenuItem.appendChild(leftContent);

      // 如果有状态键,添加状态指示器
      if (item.stateKey) {
        const stateIndicator = document.createElement('span');
        stateIndicator.className = 'state-indicator';
        stateIndicator.style.cssText = `
          font-size: 12px;
          margin-left: 10px;
          font-weight: bold;
        `;
        const isActive = this.featureStates[item.stateKey];
        stateIndicator.textContent = isActive ? '✓' : '✗';
        stateIndicator.style.color = isActive ? '#4ade80' : '#6b7280';
        submenuItem.appendChild(stateIndicator);
      }

      submenuItem.addEventListener('mouseenter', () => {
        Array.from(this.submenuElement.children).forEach(child => {
          child.style.background = 'transparent';
        });
        submenuItem.style.background = 'rgba(66, 133, 244, 0.85)';
      });

      submenuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.action) {
          item.action();
        }
        this.hideMenu();
      });

      this.submenuElement.appendChild(submenuItem);
    });

    // 定位子菜单
    const rect = parentItem.getBoundingClientRect();
    this.submenuElement.style.left = `${rect.right + 2}px`;
    this.submenuElement.style.top = `${rect.top}px`;
    this.submenuElement.style.display = 'block';

    // 确保子菜单在视窗内
    this.adjustSubmenuPosition();
  }

  /**
   * 隐藏子菜单
   */
  hideSubmenu() {
    this.submenuElement.style.display = 'none';
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 禁用默认右键菜单
    this.viewer.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showMenu(e);
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', (e) => {
      if (!this.menuElement.contains(e.target) && !this.submenuElement.contains(e.target)) {
        this.hideMenu();
      }
    });

    // ESC键隐藏菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideMenu();
      }
    });

    // 鼠标移出菜单区域
    this.menuElement.addEventListener('mouseleave', (e) => {
      // 检查是否移动到子菜单
      const toElement = e.relatedTarget;
      if (!this.submenuElement.contains(toElement)) {
        // 延迟隐藏，给用户时间移动到子菜单
        setTimeout(() => {
          if (!this.submenuElement.matches(':hover')) {
            this.hideSubmenu();
          }
        }, 100);
      }
    });

    this.submenuElement.addEventListener('mouseleave', (e) => {
      const toElement = e.relatedTarget;
      if (!this.menuElement.contains(toElement)) {
        setTimeout(() => {
          if (!this.menuElement.matches(':hover')) {
            this.hideSubmenu();
          }
        }, 100);
      }
    });
  }

  /**
   * 显示右键菜单
   */
  showMenu(event) {
    // 保存点击位置
    this.clickPosition = new Cesium.Cartesian2(event.clientX, event.clientY);

    // 获取3D世界坐标
    const pickedPosition = this.viewer.camera.pickEllipsoid(
      this.clickPosition,
      this.viewer.scene.globe.ellipsoid
    );
    if (pickedPosition) {
      this.cartesianPosition = pickedPosition;
    }

    // 设置菜单位置
    this.menuElement.style.left = `${event.clientX}px`;
    this.menuElement.style.top = `${event.clientY}px`;
    this.menuElement.style.display = 'block';

    // 隐藏子菜单
    this.hideSubmenu();

    // 清除高亮
    Array.from(this.menuElement.children).forEach(child => {
      child.style.background = 'transparent';
    });

    // 确保菜单在视窗内
    this.adjustMenuPosition();
  }

  /**
   * 隐藏右键菜单
   */
  hideMenu() {
    this.menuElement.style.display = 'none';
    this.hideSubmenu();
  }

  /**
   * 调整主菜单位置
   */
  adjustMenuPosition() {
    const rect = this.menuElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (rect.right > windowWidth) {
      this.menuElement.style.left = `${windowWidth - rect.width - 10}px`;
    }

    if (rect.bottom > windowHeight) {
      this.menuElement.style.top = `${windowHeight - rect.height - 10}px`;
    }
  }

  /**
   * 调整子菜单位置
   */
  adjustSubmenuPosition() {
    const rect = this.submenuElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 如果右侧超出，显示在左侧
    if (rect.right > windowWidth) {
      const mainRect = this.menuElement.getBoundingClientRect();
      this.submenuElement.style.left = `${mainRect.left - rect.width - 2}px`;
    }

    // 如果底部超出，调整到顶部对齐
    if (rect.bottom > windowHeight) {
      this.submenuElement.style.top = `${windowHeight - rect.height - 10}px`;
    }
  }

  // ========== 功能实现方法 ==========

  /**
   * 显示坐标信息 - 改进版UI
   */
  showCoordinates() {
    if (!this.cartesianPosition) {
      this.showNotification('无法获取坐标信息', 'warning');
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(this.cartesianPosition);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    this.showInfoDialog('📍 查看此处坐标', `
      <div style="font-size: 14px; line-height: 2;">
        <div><strong>经度:</strong> ${longitude.toFixed(6)}°</div>
        <div><strong>纬度:</strong> ${latitude.toFixed(6)}°</div>
        <div><strong>高度:</strong> ${height.toFixed(2)} m</div>
        <div style="margin-top: 10px; font-size: 12px; color: #888;">
          点击坐标可复制到剪贴板
        </div>
      </div>
    `);
  }

  /**
   * 显示当前视角
   */
  showCurrentView() {
    const camera = this.viewer.camera;
    const position = camera.positionCartographic;
    const heading = Cesium.Math.toDegrees(camera.heading);
    const pitch = Cesium.Math.toDegrees(camera.pitch);
    const roll = Cesium.Math.toDegrees(camera.roll);

    this.showInfoDialog('👁️ 查看当前视角', `
      <div style="font-size: 14px; line-height: 2;">
        <div style="font-weight: bold; margin-bottom: 8px;">相机位置:</div>
        <div><strong>经度:</strong> ${Cesium.Math.toDegrees(position.longitude).toFixed(6)}°</div>
        <div><strong>纬度:</strong> ${Cesium.Math.toDegrees(position.latitude).toFixed(6)}°</div>
        <div><strong>高度:</strong> ${position.height.toFixed(2)} m</div>
        <div style="font-weight: bold; margin: 12px 0 8px 0;">相机姿态:</div>
        <div><strong>朝向(Heading):</strong> ${heading.toFixed(2)}°</div>
        <div><strong>俯仰(Pitch):</strong> ${pitch.toFixed(2)}°</div>
        <div><strong>翻滚(Roll):</strong> ${roll.toFixed(2)}°</div>
      </div>
    `);
  }

  /**
   * 飞行到点击位置
   */
  flyToPosition() {
    if (!this.cartesianPosition) {
      this.showNotification('无法获取目标位置', 'warning');
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(this.cartesianPosition);
    const height = Math.max(cartographic.height + 1000, 1000);

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height
      ),
      duration: 2.0,
      complete: () => {
        this.showNotification('已到达目标位置', 'success');
      }
    });
  }

  /**
   * 开始围绕点旋转 - 保持当前高度
   */
  startRotation() {
    if (!this.cartesianPosition) {
      this.showNotification('无法获取旋转中心点', 'warning');
      return;
    }

    // 停止之前的旋转
    if (this.rotationAnimation) {
      this.viewer.clock.onTick.removeEventListener(this.rotationAnimation);
      this.rotationAnimation = null;
      this.updateFeatureState('rotation', false);
      this.showNotification('已停止环绕飞行', 'info');
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(this.cartesianPosition);
    const centerLongitude = cartographic.longitude;
    const centerLatitude = cartographic.latitude;

    // 使用当前相机高度而不是固定高度
    const currentCameraHeight = this.viewer.camera.positionCartographic.height;
    const height = Math.max(currentCameraHeight, 500); // 至少保持500米高度

    // 计算合理的环绕半径(基于当前高度)
    const radius = Math.min(height * 0.5, 5000); // 半径为高度的一半,最大5km

    let angle = 0;

    this.rotationAnimation = () => {
      angle += 0.005; // 旋转速度
      const longitude = centerLongitude + (radius / 111320) * Math.cos(angle);
      const latitude = centerLatitude + (radius / 111320) * Math.sin(angle);

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromRadians(longitude, latitude, height),
        orientation: {
          heading: angle + Math.PI / 2,
          pitch: Cesium.Math.toRadians(-30),
          roll: 0
        }
      });
    };

    this.viewer.clock.onTick.addEventListener(this.rotationAnimation);
    this.updateFeatureState('rotation', true);
    this.showNotification(`开始环绕飞行(高度${height.toFixed(0)}m, 半径${radius.toFixed(0)}m, 再次点击停止)`, 'success');
  }

  /**
   * 距离测量 - 带实时预览
   */
  measureDistance() {
    this.showNotification('请点击地图测量距离(右键结束)', 'info');

    const positions = [];
    const entities = [];
    let floatingPoint = null;
    let polylineEntity = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // 计算两点间的距离
    const getDistance = (point1, point2) => {
      return Cesium.Cartesian3.distance(point1, point2);
    };

    // 计算总距离
    const getTotalDistance = (positions) => {
      let total = 0;
      for (let i = 0; i < positions.length - 1; i++) {
        total += getDistance(positions[i], positions[i + 1]);
      }
      return total;
    };

    // 左键点击 - 添加点
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      const pointEntity = this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 8,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
      entities.push(pointEntity);

      // 如果有两个点以上,添加分段距离标签
      if (positions.length >= 2) {
        const p1 = positions[positions.length - 2];
        const p2 = positions[positions.length - 1];
        const distance = getDistance(p1, p2);
        const midpoint = Cesium.Cartesian3.midpoint(p1, p2, new Cesium.Cartesian3());

        const labelEntity = this.viewer.entities.add({
          position: midpoint,
          label: {
            text: `${distance.toFixed(2)}m`,
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -15),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        entities.push(labelEntity);
      }

      // 创建动态折线(第一次点击时)
      if (!polylineEntity) {
        polylineEntity = this.viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                return positions.concat([floatingPoint]);
              }
              return positions;
            }, false),
            width: 3,
            material: Cesium.Color.RED,
            clampToGround: true
          }
        });
        entities.push(polylineEntity);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length > 0) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (positions.length > 1) {
        // 固定最终折线
        polylineEntity.polyline.positions = positions;

        // 添加总距离标签
        const totalDistance = getTotalDistance(positions);
        const lastPoint = positions[positions.length - 1];
        const totalLabelEntity = this.viewer.entities.add({
          position: lastPoint,
          label: {
            text: `总距离: ${totalDistance.toFixed(2)}m`,
            font: '16px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -40),
            backgroundColor: Cesium.Color.RED.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        entities.push(totalLabelEntity);

        this.showNotification(`测量完成: ${totalDistance.toFixed(2)}m`, 'success');

        // 存储entities以便清理
        if (!this.measurementEntities) {
          this.measurementEntities = [];
        }
        this.measurementEntities.push(...entities);
      } else {
        this.showNotification('至少需要2个点', 'warning');
        entities.forEach(entity => this.viewer.entities.remove(entity));
      }
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 面积测量 - 带实时预览
   */
  measureArea() {
    this.showNotification('请点击地图测量面积(右键结束)', 'info');

    const positions = [];
    const entities = [];
    let floatingPoint = null;
    let polygonEntity = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // 计算多边形面积(使用球面三角形方法)
    const getArea = (positions) => {
      if (positions.length < 3) return 0;

      const cartographics = positions.map(pos => Cesium.Cartographic.fromCartesian(pos));

      // 使用Shoelace公式计算平面近似面积
      let area = 0;
      for (let i = 0; i < cartographics.length; i++) {
        const j = (i + 1) % cartographics.length;
        const lon1 = cartographics[i].longitude;
        const lat1 = cartographics[i].latitude;
        const lon2 = cartographics[j].longitude;
        const lat2 = cartographics[j].latitude;

        area += lon1 * lat2 - lon2 * lat1;
      }

      area = Math.abs(area) / 2.0;

      // 转换为平方米(粗略估算)
      const R = 6371000; // 地球半径(米)
      area = area * R * R;

      return area;
    };

    // 左键点击 - 添加点
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      const pointEntity = this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 8,
          color: Cesium.Color.GREEN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
      entities.push(pointEntity);

      // 创建动态多边形(第一次点击时)
      if (!polygonEntity) {
        polygonEntity = this.viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.CallbackProperty(() => {
              const pts = floatingPoint ? positions.concat([floatingPoint]) : positions;
              return new Cesium.PolygonHierarchy(pts);
            }, false),
            material: Cesium.Color.GREEN.withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.GREEN,
            outlineWidth: 2
          }
        });
        entities.push(polygonEntity);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length > 0) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (positions.length > 2) {
        // 固定最终多边形
        polygonEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);

        // 计算并显示面积
        const area = getArea(positions);
        const center = Cesium.BoundingSphere.fromPoints(positions).center;

        const areaText = area >= 1000000
          ? `${(area / 1000000).toFixed(2)}km²`
          : `${area.toFixed(2)}m²`;

        const labelEntity = this.viewer.entities.add({
          position: center,
          label: {
            text: `面积: ${areaText}`,
            font: '16px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            backgroundColor: Cesium.Color.GREEN.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        entities.push(labelEntity);

        this.showNotification(`测量完成: ${areaText}`, 'success');

        // 存储entities以便清理
        if (!this.measurementEntities) {
          this.measurementEntities = [];
        }
        this.measurementEntities.push(...entities);
      } else {
        this.showNotification('至少需要3个点', 'warning');
        entities.forEach(entity => this.viewer.entities.remove(entity));
      }
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 高度差测量 - 带实时预览
   */
  measureHeight() {
    this.showNotification('请点击两个点测量高度差', 'info');

    const positions = [];
    const entities = [];
    let floatingPoint = null;
    let polylineEntity = null;
    let labelEntity = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      entities.push(this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      }));

      // 第一个点:创建动态预览线
      if (positions.length === 1) {
        polylineEntity = this.viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                return [positions[0], floatingPoint];
              }
              return positions;
            }, false),
            width: 3,
            material: Cesium.Color.YELLOW.withAlpha(0.8),
            clampToGround: false
          }
        });
        entities.push(polylineEntity);

        // 动态标签
        labelEntity = this.viewer.entities.add({
          position: new Cesium.CallbackProperty(() => {
            if (floatingPoint) {
              return Cesium.Cartesian3.midpoint(positions[0], floatingPoint, new Cesium.Cartesian3());
            }
            return positions[0];
          }, false),
          label: {
            text: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                const cart1 = Cesium.Cartographic.fromCartesian(positions[0]);
                const cart2 = Cesium.Cartographic.fromCartesian(floatingPoint);
                const heightDiff = Math.abs(cart2.height - cart1.height);
                return `高度差: ${heightDiff.toFixed(2)}m`;
              }
              return '移动鼠标查看高度差';
            }, false),
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        entities.push(labelEntity);
      }
      // 第二个点:完成测量
      else if (positions.length === 2) {
        const cart1 = Cesium.Cartographic.fromCartesian(positions[0]);
        const cart2 = Cesium.Cartographic.fromCartesian(positions[1]);
        const heightDiff = Math.abs(cart2.height - cart1.height);

        // 固定连线
        polylineEntity.polyline.positions = positions;

        // 固定标签
        const midpoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
        labelEntity.position = midpoint;
        labelEntity.label.text = `高度差: ${heightDiff.toFixed(2)}m`;

        this.showNotification(`高度差: ${heightDiff.toFixed(2)}m`, 'success');
        handler.destroy();

        // 存储entities以便清理
        if (!this.measurementEntities) {
          this.measurementEntities = [];
        }
        this.measurementEntities.push(...entities);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length === 1) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /**
   * 角度测量 - 带实时预览
   */
  measureAngle() {
    this.showNotification('请点击两个点测量方位角和俯仰角', 'info');

    const positions = [];
    const entities = [];
    let floatingPoint = null;
    let polylineEntity = null;
    let labelEntity = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // 计算角度的辅助函数
    const calculateAngles = (startPoint, endPoint) => {
      // 创建ENU坐标系
      const transform = Cesium.Transforms.eastNorthUpToFixedFrame(startPoint);
      const inverseTransform = Cesium.Matrix4.inverse(transform, new Cesium.Matrix4());

      // 计算方向向量
      const direction = Cesium.Cartesian3.subtract(endPoint, startPoint, new Cesium.Cartesian3());
      const localDirection = Cesium.Matrix4.multiplyByPointAsVector(inverseTransform, direction, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(localDirection, localDirection);

      // 计算方位角(heading) - 从北向顺时针
      let heading = Math.atan2(localDirection.x, localDirection.y);
      heading = Cesium.Math.toDegrees(heading);
      if (heading < 0) heading += 360;

      // 计算俯仰角(pitch)
      const pitch = Math.asin(localDirection.z);
      const pitchDegrees = Cesium.Math.toDegrees(pitch);

      return { heading, pitchDegrees };
    };

    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      entities.push(this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 10,
          color: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      }));

      // 第一个点:创建动态预览线
      if (positions.length === 1) {
        polylineEntity = this.viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                return [positions[0], floatingPoint];
              }
              return positions;
            }, false),
            width: 3,
            material: Cesium.Color.CYAN.withAlpha(0.8),
            clampToGround: false
          }
        });
        entities.push(polylineEntity);

        // 动态标签
        labelEntity = this.viewer.entities.add({
          position: new Cesium.CallbackProperty(() => {
            if (floatingPoint) {
              return Cesium.Cartesian3.midpoint(positions[0], floatingPoint, new Cesium.Cartesian3());
            }
            return positions[0];
          }, false),
          label: {
            text: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                const angles = calculateAngles(positions[0], floatingPoint);
                return `方位角: ${angles.heading.toFixed(2)}°\n俯仰角: ${angles.pitchDegrees.toFixed(2)}°`;
              }
              return '移动鼠标查看角度';
            }, false),
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        entities.push(labelEntity);
      }
      // 第二个点:完成测量
      else if (positions.length === 2) {
        const angles = calculateAngles(positions[0], positions[1]);

        // 固定连线
        polylineEntity.polyline.positions = positions;

        // 固定标签
        const midpoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
        labelEntity.position = midpoint;
        labelEntity.label.text = `方位角: ${angles.heading.toFixed(2)}°\n俯仰角: ${angles.pitchDegrees.toFixed(2)}°`;

        this.showNotification(`方位角: ${angles.heading.toFixed(2)}°, 俯仰角: ${angles.pitchDegrees.toFixed(2)}°`, 'success');
        handler.destroy();

        // 存储entities
        if (!this.measurementEntities) {
          this.measurementEntities = [];
        }
        this.measurementEntities.push(...entities);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length === 1) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /**
   * 坐标定位 - 输入经纬度跳转
   */
  coordinateLocation() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(66, 133, 244, 0.5);
      border-radius: 8px;
      padding: 20px 25px;
      min-width: 350px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      z-index: 10002;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
    `;

    dialog.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #4285f4;">
        📍 坐标定位
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">经度 (Longitude):</label>
        <input type="number" id="inputLon" step="0.000001" placeholder="例: 108.945951"
          style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff; font-size: 14px;">
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">纬度 (Latitude):</label>
        <input type="number" id="inputLat" step="0.000001" placeholder="例: 34.265472"
          style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff; font-size: 14px;">
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">高度 (米):</label>
        <input type="number" id="inputHeight" value="5000" placeholder="例: 5000"
          style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff; font-size: 14px;">
      </div>
      <div style="text-align: right; margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="btnCancel" style="padding: 8px 20px; background: rgba(128,128,128,0.2); border: 1px solid #888; border-radius: 4px; color: #888; cursor: pointer; font-size: 14px;">取消</button>
        <button id="btnGo" style="padding: 8px 20px; background: rgba(66, 133, 244, 0.2); border: 1px solid #4285f4; border-radius: 4px; color: #4285f4; cursor: pointer; font-size: 14px;">前往</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const btnGo = dialog.querySelector('#btnGo');
    const btnCancel = dialog.querySelector('#btnCancel');
    const inputLon = dialog.querySelector('#inputLon');
    const inputLat = dialog.querySelector('#inputLat');
    const inputHeight = dialog.querySelector('#inputHeight');

    btnGo.addEventListener('click', () => {
      const lon = parseFloat(inputLon.value);
      const lat = parseFloat(inputLat.value);
      const height = parseFloat(inputHeight.value) || 5000;

      if (isNaN(lon) || isNaN(lat)) {
        this.showNotification('请输入有效的经纬度', 'warning');
        return;
      }

      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
        duration: 2.0,
        complete: () => {
          this.showNotification(`已到达 (${lon.toFixed(6)}°, ${lat.toFixed(6)}°)`, 'success');
        }
      });

      document.body.removeChild(dialog);
    });

    btnCancel.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  }

  /**
   * 视角书签功能
   */
  viewBookmark() {
    if (!this.bookmarks) {
      this.bookmarks = JSON.parse(localStorage.getItem('cesium_bookmarks') || '[]');
    }

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(66, 133, 244, 0.5);
      border-radius: 8px;
      padding: 20px 25px;
      min-width: 400px;
      max-width: 500px;
      max-height: 600px;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      z-index: 10002;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
    `;

    const updateBookmarkList = () => {
      let bookmarkHTML = '';
      this.bookmarks.forEach((bookmark, index) => {
        bookmarkHTML += `
          <div style="padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; cursor: pointer;" data-index="${index}">
              <div style="font-weight: bold; color: #4285f4;">${bookmark.name}</div>
              <div style="font-size: 12px; color: #888; margin-top: 4px;">${new Date(bookmark.timestamp).toLocaleString()}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-go" data-index="${index}" style="padding: 4px 12px; background: rgba(66, 133, 244, 0.2); border: 1px solid #4285f4; border-radius: 4px; color: #4285f4; cursor: pointer; font-size: 12px;">前往</button>
              <button class="btn-delete" data-index="${index}" style="padding: 4px 12px; background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; border-radius: 4px; color: #f44336; cursor: pointer; font-size: 12px;">删除</button>
            </div>
          </div>
        `;
      });

      dialog.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #4285f4;">
          📖 视角书签
        </div>
        <div style="margin-bottom: 15px;">
          <input type="text" id="bookmarkName" placeholder="输入书签名称"
            style="width: calc(100% - 90px); padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff; font-size: 14px; margin-right: 8px;">
          <button id="btnSave" style="padding: 8px 16px; background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50; border-radius: 4px; color: #4caf50; cursor: pointer; font-size: 14px;">保存</button>
        </div>
        <div style="margin-bottom: 15px; max-height: 300px; overflow-y: auto;">
          ${bookmarkHTML || '<div style="text-align: center; color: #888; padding: 20px;">暂无书签</div>'}
        </div>
        <div style="text-align: right;">
          <button id="btnClose" style="padding: 8px 20px; background: rgba(128,128,128,0.2); border: 1px solid #888; border-radius: 4px; color: #888; cursor: pointer; font-size: 14px;">关闭</button>
        </div>
      `;

      // 绑定事件
      const btnSave = dialog.querySelector('#btnSave');
      const btnClose = dialog.querySelector('#btnClose');
      const bookmarkName = dialog.querySelector('#bookmarkName');

      btnSave.addEventListener('click', () => {
        const name = bookmarkName.value.trim() || `书签${this.bookmarks.length + 1}`;
        const camera = this.viewer.camera;
        const position = camera.positionCartographic;

        this.bookmarks.push({
          name: name,
          longitude: Cesium.Math.toDegrees(position.longitude),
          latitude: Cesium.Math.toDegrees(position.latitude),
          height: position.height,
          heading: Cesium.Math.toDegrees(camera.heading),
          pitch: Cesium.Math.toDegrees(camera.pitch),
          roll: Cesium.Math.toDegrees(camera.roll),
          timestamp: new Date().toISOString()
        });

        localStorage.setItem('cesium_bookmarks', JSON.stringify(this.bookmarks));
        this.showNotification(`书签"${name}"已保存`, 'success');
        updateBookmarkList();
      });

      btnClose.addEventListener('click', () => {
        document.body.removeChild(dialog);
      });

      // 前往书签
      dialog.querySelectorAll('.btn-go').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          const bookmark = this.bookmarks[index];

          this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              bookmark.longitude,
              bookmark.latitude,
              bookmark.height
            ),
            orientation: {
              heading: Cesium.Math.toRadians(bookmark.heading),
              pitch: Cesium.Math.toRadians(bookmark.pitch),
              roll: Cesium.Math.toRadians(bookmark.roll)
            },
            duration: 2.0,
            complete: () => {
              this.showNotification(`已到达"${bookmark.name}"`, 'success');
            }
          });
        });
      });

      // 删除书签
      dialog.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          const name = this.bookmarks[index].name;
          this.bookmarks.splice(index, 1);
          localStorage.setItem('cesium_bookmarks', JSON.stringify(this.bookmarks));
          this.showNotification(`已删除"${name}"`, 'info');
          updateBookmarkList();
        });
      });
    };

    document.body.appendChild(dialog);
    updateBookmarkList();
  }

  /**
   * 第一视角站到此处
   */
  firstPersonView() {
    if (!this.cartesianPosition) {
      this.showNotification('无法获取目标位置', 'warning');
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(this.cartesianPosition);

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height + 1.7 // 人眼高度约1.7米
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(0), // 水平视角
        roll: 0
      },
      duration: 2.0,
      complete: () => {
        this.showNotification('已切换到第一视角', 'success');
      }
    });
  }

  /**
   * 键盘漫游功能 - WASD控制
   */
  toggleKeyboardRoaming() {
    if (this.keyboardRoamingActive) {
      // 停止键盘漫游
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardRoamingActive = false;
      this.keysPressed = {};
      if (this.roamingInterval) {
        clearInterval(this.roamingInterval);
      }
      this.updateFeatureState('keyboardRoaming', false);
      this.showNotification('键盘漫游已关闭', 'info');
    } else {
      // 开启键盘漫游
      this.keyboardRoamingActive = true;
      this.keysPressed = {};
      const moveSpeed = 10; // 移动速度(米/帧)
      const rotateSpeed = 0.02; // 旋转速度

      this.keyboardHandler = (e) => {
        const key = e.key.toLowerCase();
        this.keysPressed[key] = true;
      };

      const keyUpHandler = (e) => {
        const key = e.key.toLowerCase();
        delete this.keysPressed[key];
      };

      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('keyup', keyUpHandler);

      // 使用interval更新相机位置
      this.roamingInterval = setInterval(() => {
        const camera = this.viewer.camera;

        // W - 前进
        if (this.keysPressed['w']) {
          camera.moveForward(moveSpeed);
        }
        // S - 后退
        if (this.keysPressed['s']) {
          camera.moveBackward(moveSpeed);
        }
        // A - 左移
        if (this.keysPressed['a']) {
          camera.moveLeft(moveSpeed);
        }
        // D - 右移
        if (this.keysPressed['d']) {
          camera.moveRight(moveSpeed);
        }
        // Q - 上升
        if (this.keysPressed['q']) {
          camera.moveUp(moveSpeed);
        }
        // E - 下降
        if (this.keysPressed['e']) {
          camera.moveDown(moveSpeed);
        }
        // 方向键 - 旋转视角
        if (this.keysPressed['arrowleft']) {
          camera.lookLeft(rotateSpeed);
        }
        if (this.keysPressed['arrowright']) {
          camera.lookRight(rotateSpeed);
        }
        if (this.keysPressed['arrowup']) {
          camera.lookUp(rotateSpeed);
        }
        if (this.keysPressed['arrowdown']) {
          camera.lookDown(rotateSpeed);
        }
      }, 16); // ~60fps

      this.updateFeatureState('keyboardRoaming', true);
      this.showNotification('键盘漫游已开启\nWASD:移动 QE:升降 方向键:旋转', 'success');
    }
  }

  /**
   * 地图打印功能
   */
  printMap() {
    this.viewer.render();
    const canvas = this.viewer.scene.canvas;

    // 创建打印预览窗口
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>地图打印</title>
        <style>
          body { margin: 0; padding: 20px; text-align: center; }
          img { max-width: 100%; height: auto; }
          .info { margin: 20px 0; font-family: Arial, sans-serif; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="info no-print">
          <h2>三维地图可视化系统</h2>
          <p>打印时间: ${new Date().toLocaleString()}</p>
          <button onclick="window.print()">打印</button>
          <button onclick="window.close()">关闭</button>
        </div>
        <img src="${canvas.toDataURL('image/png')}" alt="地图截图" />
      </body>
      </html>
    `);
    printWindow.document.close();

    this.showNotification('打印预览已打开', 'success');
  }

  /**
   * 地形服务控制
   */
  toggleTerrain() {
    const terrainProvider = this.viewer.terrainProvider;
    if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
      // 当前无地形,恢复地形
      if (window.sgsTerrainProvider) {
        this.viewer.terrainProvider = window.sgsTerrainProvider;
        this.updateFeatureState('terrain', true);
        this.showNotification('地形已开启', 'success');
      }
    } else {
      // 当前有地形,关闭地形
      this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      this.updateFeatureState('terrain', false);
      this.showNotification('地形已关闭', 'success');
    }
  }

  /**
   * 场景设置 - 星空背景
   */
  toggleSkyBox() {
    this.viewer.scene.skyBox.show = !this.viewer.scene.skyBox.show;
    const status = this.viewer.scene.skyBox.show ? '开启' : '关闭';
    this.updateFeatureState('skyBox', this.viewer.scene.skyBox.show);
    this.showNotification(`星空背景已${status}`, 'success');
  }

  /**
   * 场景设置 - 大气渲染
   */
  toggleAtmosphere() {
    this.viewer.scene.skyAtmosphere.show = !this.viewer.scene.skyAtmosphere.show;
    const status = this.viewer.scene.skyAtmosphere.show ? '开启' : '关闭';
    this.updateFeatureState('atmosphere', this.viewer.scene.skyAtmosphere.show);
    this.showNotification(`大气渲染已${status}`, 'success');
  }

  /**
   * 场景设置 - 日照阴影
   */
  toggleShadows() {
    this.viewer.shadows = !this.viewer.shadows;
    const status = this.viewer.shadows ? '开启' : '关闭';
    this.updateFeatureState('shadows', this.viewer.shadows);
    this.showNotification(`日照阴影已${status}`, 'success');
  }

  /**
   * 场景设置 - 深度检测
   */
  toggleDepthTest() {
    this.viewer.scene.globe.depthTestAgainstTerrain = !this.viewer.scene.globe.depthTestAgainstTerrain;
    const status = this.viewer.scene.globe.depthTestAgainstTerrain ? '开启' : '关闭';
    this.updateFeatureState('depthTest', this.viewer.scene.globe.depthTestAgainstTerrain);
    this.showNotification(`深度检测已${status}`, 'success');
  }

  /**
   * 导出场景JSON
   */
  exportSceneJSON() {
    const camera = this.viewer.camera;
    const position = camera.positionCartographic;

    const sceneData = {
      camera: {
        longitude: Cesium.Math.toDegrees(position.longitude),
        latitude: Cesium.Math.toDegrees(position.latitude),
        height: position.height,
        heading: Cesium.Math.toDegrees(camera.heading),
        pitch: Cesium.Math.toDegrees(camera.pitch),
        roll: Cesium.Math.toDegrees(camera.roll)
      },
      settings: {
        terrainEnabled: !(this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider),
        skyBoxShow: this.viewer.scene.skyBox.show,
        atmosphereShow: this.viewer.scene.skyAtmosphere.show,
        shadowsEnabled: this.viewer.shadows,
        depthTestEnabled: this.viewer.scene.globe.depthTestAgainstTerrain
      },
      timestamp: new Date().toISOString()
    };

    const jsonStr = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('场景JSON已导出', 'success');
  }

  /**
   * 场景截图
   */
  captureScene() {
    this.viewer.render();
    const canvas = this.viewer.scene.canvas;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      this.showNotification('场景截图已保存', 'success');
    });
  }

  /**
   * 标记点功能
   */
  markPoint() {
    this.showNotification('请点击地图添加标记点', 'info');

    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      const entity = this.viewer.entities.add({
        position: pickedPosition,
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
              <path fill="#ff4444" stroke="#fff" stroke-width="2" d="M16,0 C7.2,0 0,7.2 0,16 C0,24.8 16,48 16,48 S32,24.8 32,16 C32,7.2 24.8,0 16,0 Z"/>
              <circle cx="16" cy="16" r="6" fill="#fff"/>
            </svg>
          `),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.8
        },
        label: {
          text: '标记点',
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50)
        }
      });

      if (!this.markerEntities) {
        this.markerEntities = [];
      }
      this.markerEntities.push(entity);

      this.showNotification('标记点已添加', 'success');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * 标记线功能 - 带实时预览
   */
  markPolyline() {
    this.showNotification('请点击地图绘制线段(右键结束)', 'info');

    const positions = [];
    let floatingPoint = null; // 跟随鼠标的动态点
    let polylineEntity = null;
    const tempPoints = []; // 临时显示的点标记
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // 左键点击 - 添加点
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      const pointEntity = this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 8,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
      tempPoints.push(pointEntity);

      // 创建动态线(第一次点击时)
      if (!polylineEntity) {
        polylineEntity = this.viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              if (floatingPoint) {
                return positions.concat([floatingPoint]);
              }
              return positions;
            }, false),
            width: 3,
            material: Cesium.Color.BLUE,
            clampToGround: true
          }
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length > 0) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (positions.length > 1) {
        // 移除临时点标记
        tempPoints.forEach(entity => this.viewer.entities.remove(entity));

        // 固定最终线段
        polylineEntity.polyline.positions = positions;

        this.showNotification(`线段已添加(${positions.length}个点)`, 'success');
        if (!this.markerEntities) {
          this.markerEntities = [];
        }
        this.markerEntities.push(polylineEntity);
      } else {
        this.showNotification('至少需要2个点', 'warning');
        if (polylineEntity) this.viewer.entities.remove(polylineEntity);
        tempPoints.forEach(entity => this.viewer.entities.remove(entity));
      }
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 标记面功能 - 带实时预览
   */
  markPolygon() {
    this.showNotification('请点击地图绘制多边形(右键结束)', 'info');

    const positions = [];
    let floatingPoint = null;
    let polygonEntity = null;
    const tempPoints = [];
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // 左键点击 - 添加点
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      positions.push(pickedPosition);

      // 添加点标记
      const pointEntity = this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 8,
          color: Cesium.Color.GREEN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
      tempPoints.push(pointEntity);

      // 创建动态多边形(第一次点击时)
      if (!polygonEntity) {
        polygonEntity = this.viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.CallbackProperty(() => {
              const pts = floatingPoint ? positions.concat([floatingPoint]) : positions;
              return new Cesium.PolygonHierarchy(pts);
            }, false),
            material: Cesium.Color.GREEN.withAlpha(0.4),
            outline: true,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          }
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (positions.length > 0) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          floatingPoint = pickedPosition;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (positions.length > 2) {
        // 移除临时点标记
        tempPoints.forEach(entity => this.viewer.entities.remove(entity));

        // 固定最终多边形
        polygonEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);

        this.showNotification(`多边形已添加(${positions.length}个点)`, 'success');
        if (!this.markerEntities) {
          this.markerEntities = [];
        }
        this.markerEntities.push(polygonEntity);
      } else {
        this.showNotification('至少需要3个点', 'warning');
        if (polygonEntity) this.viewer.entities.remove(polygonEntity);
        tempPoints.forEach(entity => this.viewer.entities.remove(entity));
      }
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 标记圆功能 - 带实时预览
   */
  markCircle() {
    this.showNotification('请点击地图确定圆心，移动鼠标调整半径，再次点击完成', 'info');

    let centerPosition = null;
    let circleEntity = null;
    let centerPoint = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    let clickCount = 0;

    // 左键点击
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      clickCount++;

      if (clickCount === 1) {
        // 第一次点击 - 设置圆心
        centerPosition = pickedPosition;

        // 显示圆心点
        centerPoint = this.viewer.entities.add({
          position: centerPosition,
          point: {
            pixelSize: 8,
            color: Cesium.Color.ORANGE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          }
        });

        // 创建动态圆
        circleEntity = this.viewer.entities.add({
          position: centerPosition,
          ellipse: {
            semiMinorAxis: new Cesium.CallbackProperty(() => {
              return 1; // 最小半径1米
            }, false),
            semiMajorAxis: new Cesium.CallbackProperty(() => {
              return 1; // 最小半径1米
            }, false),
            material: Cesium.Color.ORANGE.withAlpha(0.4),
            outline: true,
            outlineColor: Cesium.Color.ORANGE,
            outlineWidth: 2
          }
        });

        this.showNotification('移动鼠标调整半径，再次点击完成', 'info');

      } else if (clickCount === 2) {
        // 第二次点击 - 固定半径
        const radius = Cesium.Cartesian3.distance(centerPosition, pickedPosition);

        // 固定圆的半径
        circleEntity.ellipse.semiMinorAxis = radius;
        circleEntity.ellipse.semiMajorAxis = radius;

        // 移除圆心点
        if (centerPoint) this.viewer.entities.remove(centerPoint);

        this.showNotification(`圆已添加(半径: ${radius.toFixed(2)}m)`, 'success');

        if (!this.markerEntities) {
          this.markerEntities = [];
        }
        this.markerEntities.push(circleEntity);
        handler.destroy();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览半径
    handler.setInputAction((movement) => {
      if (clickCount === 1 && centerPosition) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          const radius = Cesium.Cartesian3.distance(centerPosition, pickedPosition);
          circleEntity.ellipse.semiMinorAxis = radius;
          circleEntity.ellipse.semiMajorAxis = radius;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /**
   * 标记矩形功能 - 带实时预览
   */
  markRectangle() {
    this.showNotification('请点击地图确定第一个角点，移动鼠标，再次点击完成', 'info');

    let firstPosition = null;
    let rectangleEntity = null;
    let firstPoint = null;
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    let clickCount = 0;

    // 左键点击
    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!pickedPosition) return;

      clickCount++;

      if (clickCount === 1) {
        // 第一次点击 - 设置第一个角点
        firstPosition = pickedPosition;

        // 显示角点
        firstPoint = this.viewer.entities.add({
          position: firstPosition,
          point: {
            pixelSize: 8,
            color: Cesium.Color.PURPLE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          }
        });

        // 创建动态矩形
        rectangleEntity = this.viewer.entities.add({
          rectangle: {
            coordinates: new Cesium.CallbackProperty(() => {
              const cart1 = Cesium.Cartographic.fromCartesian(firstPosition);
              return Cesium.Rectangle.fromRadians(cart1.longitude, cart1.latitude, cart1.longitude, cart1.latitude);
            }, false),
            material: Cesium.Color.PURPLE.withAlpha(0.4),
            outline: true,
            outlineColor: Cesium.Color.PURPLE,
            outlineWidth: 2
          }
        });

        this.showNotification('移动鼠标调整大小，再次点击完成', 'info');

      } else if (clickCount === 2) {
        // 第二次点击 - 固定矩形
        const cart1 = Cesium.Cartographic.fromCartesian(firstPosition);
        const cart2 = Cesium.Cartographic.fromCartesian(pickedPosition);
        const rectangle = Cesium.Rectangle.fromCartographicArray([cart1, cart2]);

        // 固定矩形坐标
        rectangleEntity.rectangle.coordinates = rectangle;

        // 移除角点
        if (firstPoint) this.viewer.entities.remove(firstPoint);

        this.showNotification('矩形已添加', 'success');

        if (!this.markerEntities) {
          this.markerEntities = [];
        }
        this.markerEntities.push(rectangleEntity);
        handler.destroy();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动 - 实时预览
    handler.setInputAction((movement) => {
      if (clickCount === 1 && firstPosition) {
        const pickedPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (pickedPosition) {
          const cart1 = Cesium.Cartographic.fromCartesian(firstPosition);
          const cart2 = Cesium.Cartographic.fromCartesian(pickedPosition);
          const rectangle = Cesium.Rectangle.fromCartographicArray([cart1, cart2]);
          rectangleEntity.rectangle.coordinates = rectangle;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /**
   * 清除所有标记
   */
  clearAllMarkers() {
    if (this.markerEntities && this.markerEntities.length > 0) {
      this.markerEntities.forEach(entity => {
        this.viewer.entities.remove(entity);
      });
      this.markerEntities = [];
      this.showNotification('所有标记已清除', 'success');
    } else {
      this.showNotification('没有标记需要清除', 'info');
    }

    // 同时清除测量entities
    if (this.measurementEntities && this.measurementEntities.length > 0) {
      this.measurementEntities.forEach(entity => {
        this.viewer.entities.remove(entity);
      });
      this.measurementEntities = [];
    }
  }

  /**
   * 特效功能 - 雾效果
   */
  toggleFog() {
    this.viewer.scene.fog.enabled = !this.viewer.scene.fog.enabled;
    const status = this.viewer.scene.fog.enabled ? '开启' : '关闭';
    this.updateFeatureState('fog', this.viewer.scene.fog.enabled);
    this.showNotification(`雾效果已${status}`, 'success');
  }

  /**
   * 特效功能 - 泛光效果
   */
  toggleBloom() {
    if (!this.bloomStage) {
      this.bloomStage = Cesium.PostProcessStageLibrary.createBloomStage();
      this.bloomStage.enabled = true;
      this.bloomStage.uniforms.contrast = 128;
      this.bloomStage.uniforms.brightness = -0.3;
      this.bloomStage.uniforms.glowOnly = false;
      this.bloomStage.uniforms.delta = 1.0;
      this.bloomStage.uniforms.sigma = 2.0;
      this.bloomStage.uniforms.stepSize = 1.0;
      this.viewer.scene.postProcessStages.add(this.bloomStage);
      this.updateFeatureState('bloom', true);
      this.showNotification('泛光效果已开启', 'success');
    } else {
      this.bloomStage.enabled = !this.bloomStage.enabled;
      const status = this.bloomStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('bloom', this.bloomStage.enabled);
      this.showNotification(`泛光效果已${status}`, 'success');
    }
  }

  /**
   * 特效功能 - 夜视效果
   */
  toggleNightVision() {
    if (!this.nightVisionStage) {
      this.nightVisionStage = Cesium.PostProcessStageLibrary.createNightVisionStage();
      this.nightVisionStage.enabled = true;
      this.viewer.scene.postProcessStages.add(this.nightVisionStage);
      this.updateFeatureState('nightVision', true);
      this.showNotification('夜视效果已开启', 'success');
    } else {
      this.nightVisionStage.enabled = !this.nightVisionStage.enabled;
      const status = this.nightVisionStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('nightVision', this.nightVisionStage.enabled);
      this.showNotification(`夜视效果已${status}`, 'success');
    }
  }

  /**
   * 特效功能 - 黑白效果
   */
  toggleBlackAndWhite() {
    if (!this.blackAndWhiteStage) {
      this.blackAndWhiteStage = Cesium.PostProcessStageLibrary.createBlackAndWhiteStage();
      this.blackAndWhiteStage.enabled = true;
      this.blackAndWhiteStage.uniforms.gradations = 5.0;
      this.viewer.scene.postProcessStages.add(this.blackAndWhiteStage);
      this.updateFeatureState('blackAndWhite', true);
      this.showNotification('黑白效果已开启', 'success');
    } else {
      this.blackAndWhiteStage.enabled = !this.blackAndWhiteStage.enabled;
      const status = this.blackAndWhiteStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('blackAndWhite', this.blackAndWhiteStage.enabled);
      this.showNotification(`黑白效果已${status}`, 'success');
    }
  }

  /**
   * 特效功能 - 亮度调节
   */
  adjustBrightness() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(66, 133, 244, 0.5);
      border-radius: 8px;
      padding: 20px 25px;
      min-width: 350px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      z-index: 10002;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
    `;

    const currentBrightness = this.brightnessStage ? this.brightnessStage.uniforms.brightness : 0;

    dialog.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #4285f4;">
        ☀️ 调节亮度
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px;">亮度: <span id="brightnessValue">${currentBrightness.toFixed(2)}</span></label>
        <input type="range" id="brightnessSlider" min="-1" max="1" step="0.05" value="${currentBrightness}"
          style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none;">
      </div>
      <div style="text-align: right; margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="btnReset" style="padding: 8px 20px; background: rgba(128,128,128,0.2); border: 1px solid #888; border-radius: 4px; color: #888; cursor: pointer; font-size: 14px;">重置</button>
        <button id="btnClose" style="padding: 8px 20px; background: rgba(66, 133, 244, 0.2); border: 1px solid #4285f4; border-radius: 4px; color: #4285f4; cursor: pointer; font-size: 14px;">关闭</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const slider = dialog.querySelector('#brightnessSlider');
    const valueDisplay = dialog.querySelector('#brightnessValue');
    const btnReset = dialog.querySelector('#btnReset');
    const btnClose = dialog.querySelector('#btnClose');

    // 初始化亮度效果
    if (!this.brightnessStage) {
      const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        uniform float brightness;
        varying vec2 v_textureCoordinates;
        void main() {
          vec4 color = texture2D(colorTexture, v_textureCoordinates);
          gl_FragColor = vec4(color.rgb + brightness, color.a);
        }
      `;
      this.brightnessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {
          brightness: currentBrightness
        }
      });
      this.viewer.scene.postProcessStages.add(this.brightnessStage);
    }

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      valueDisplay.textContent = value.toFixed(2);
      this.brightnessStage.uniforms.brightness = value;
    });

    btnReset.addEventListener('click', () => {
      slider.value = 0;
      valueDisplay.textContent = '0.00';
      this.brightnessStage.uniforms.brightness = 0;
    });

    btnClose.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  }

  /**
   * 特效功能 - 拾取高亮(轮廓线)
   */
  toggleSilhouette() {
    if (!this.silhouetteStage) {
      this.silhouetteStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
      this.silhouetteStage.enabled = true;
      this.silhouetteStage.uniforms.color = Cesium.Color.YELLOW;
      this.silhouetteStage.uniforms.length = 0.5;
      this.viewer.scene.postProcessStages.add(this.silhouetteStage);
      this.updateFeatureState('silhouette', true);
      this.showNotification('边缘检测已开启', 'success');
    } else {
      this.silhouetteStage.enabled = !this.silhouetteStage.enabled;
      const status = this.silhouetteStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('silhouette', this.silhouetteStage.enabled);
      this.showNotification(`边缘检测已${status}`, 'success');
    }
  }

  /**
   * 特效功能 - 下雨效果
   */
  toggleRain() {
    if (!this.rainStage) {
      const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        varying vec2 v_textureCoordinates;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = v_textureCoordinates;
          vec4 color = texture2D(colorTexture, uv);

          float time = czm_frameNumber * 0.05;
          vec2 rainUV = uv * vec2(20.0, 30.0) + vec2(0.0, time);

          float rain = 0.0;
          for(int i = 0; i < 3; i++) {
            vec2 offset = vec2(float(i) * 0.3, 0.0);
            float h = hash(floor(rainUV + offset));
            float y = fract(rainUV.y + offset.y + h);
            float x = fract(rainUV.x + offset.x + h * 0.1);

            if(x > 0.48 && x < 0.52 && y < 0.05) {
              rain += (0.05 - y) * 20.0;
            }
          }

          rain = clamp(rain, 0.0, 0.3);
          gl_FragColor = vec4(color.rgb + vec3(rain * 0.7, rain * 0.8, rain), color.a);
        }
      `;

      this.rainStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {}
      });
      this.rainStage.enabled = true;
      this.viewer.scene.postProcessStages.add(this.rainStage);
      this.updateFeatureState('rain', true);
      this.showNotification('下雨效果已开启', 'success');
    } else {
      this.rainStage.enabled = !this.rainStage.enabled;
      const status = this.rainStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('rain', this.rainStage.enabled);
      this.showNotification(`下雨效果已${status}`, 'success');
    }
  }

  /**
   * 特效功能 - 下雪效果
   */
  toggleSnow() {
    if (!this.snowStage) {
      const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        varying vec2 v_textureCoordinates;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = v_textureCoordinates;
          vec4 color = texture2D(colorTexture, uv);

          float time = czm_frameNumber * 0.02;
          vec2 snowUV = uv * vec2(15.0, 20.0);

          float snow = 0.0;
          for(int i = 0; i < 4; i++) {
            vec2 offset = vec2(float(i) * 0.25, time + float(i) * 0.5);
            vec2 pos = floor(snowUV + offset);
            float h = hash(pos);
            float y = fract(snowUV.y + offset.y + h);
            float x = fract(snowUV.x + h * 0.3);

            float size = 0.02 + h * 0.02;
            if(distance(vec2(x, y), vec2(0.5, 0.5)) < size) {
              snow += 0.6;
            }
          }

          snow = clamp(snow, 0.0, 0.8);
          gl_FragColor = vec4(color.rgb + vec3(snow), color.a);
        }
      `;

      this.snowStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {}
      });
      this.snowStage.enabled = true;
      this.viewer.scene.postProcessStages.add(this.snowStage);
      this.updateFeatureState('snow', true);
      this.showNotification('下雪效果已开启', 'success');
    } else {
      this.snowStage.enabled = !this.snowStage.enabled;
      const status = this.snowStage.enabled ? '开启' : '关闭';
      this.updateFeatureState('snow', this.snowStage.enabled);
      this.showNotification(`下雪效果已${status}`, 'success');
    }
  }

  /**
   * 显示信息对话框
   */
  showInfoDialog(title, content) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(66, 133, 244, 0.5);
      border-radius: 8px;
      padding: 20px 25px;
      min-width: 300px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      z-index: 10002;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
    `;

    dialog.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #4285f4;">
        ${title}
      </div>
      <div>${content}</div>
      <div style="text-align: right; margin-top: 20px;">
        <button style="
          padding: 8px 20px;
          background: rgba(66, 133, 244, 0.2);
          border: 1px solid #4285f4;
          border-radius: 4px;
          color: #4285f4;
          cursor: pointer;
          font-size: 14px;
        ">确定</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const button = dialog.querySelector('button');
    button.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // 点击对话框外部关闭
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!dialog.contains(e.target)) {
          document.body.removeChild(dialog);
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);
  }

  /**
   * 显示通知消息
   */
  showNotification(message, type = 'info') {
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(30, 30, 35, 0.95);
      border-left: 4px solid ${colors[type]};
      border-radius: 4px;
      padding: 12px 20px;
      color: #fff;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 10003;
      animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 地区导航功能 - 使用Nominatim进行地名搜索
   */
  locationNavigation() {
    this.hideMenu();

    // 创建搜索对话框
    const dialogHTML = `
      <div id="locationSearchDialog" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 33, 36, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 20px;
        min-width: 400px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        z-index: 20000;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
        backdrop-filter: blur(12px);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 500;">🧭 地区导航</h3>
          <button id="closeLocationSearch" style="
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>

        <div style="margin-bottom: 15px;">
          <input type="text" id="locationSearchInput" placeholder="输入城市、地名或地址..." style="
            width: 100%;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>

        <div style="margin-bottom: 15px;">
          <button id="locationSearchBtn" style="
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            font-weight: 500;
          ">🔍 搜索</button>
        </div>

        <div id="locationSearchResults" style="
          max-height: 300px;
          overflow-y: auto;
          margin-top: 10px;
        "></div>

        <div style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.5);">
          提示: 支持搜索城市、地标、地址等地理位置
        </div>
      </div>
    `;

    // 添加到页面
    const dialogContainer = document.createElement('div');
    dialogContainer.innerHTML = dialogHTML;
    document.body.appendChild(dialogContainer);

    const dialog = document.getElementById('locationSearchDialog');
    const input = document.getElementById('locationSearchInput');
    const searchBtn = document.getElementById('locationSearchBtn');
    const closeBtn = document.getElementById('closeLocationSearch');
    const resultsDiv = document.getElementById('locationSearchResults');

    // 关闭对话框
    const closeDialog = () => {
      if (dialogContainer && dialogContainer.parentNode) {
        dialogContainer.parentNode.removeChild(dialogContainer);
      }
    };

    closeBtn.addEventListener('click', closeDialog);

    // 搜索功能
    const performSearch = async () => {
      const query = input.value.trim();
      if (!query) {
        this.showNotification('请输入搜索内容', 'warning');
        return;
      }

      searchBtn.disabled = true;
      searchBtn.textContent = '🔍 搜索中...';
      resultsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: rgba(255,255,255,0.6);">搜索中...</div>';

      try {
        // 使用Nominatim API进行地理编码
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=zh-CN`,
          {
            headers: {
              'User-Agent': 'CesiumMapApp/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('搜索请求失败');
        }

        const results = await response.json();

        if (results.length === 0) {
          resultsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: rgba(255,255,255,0.6);">未找到相关位置</div>';
          return;
        }

        // 显示搜索结果
        resultsDiv.innerHTML = results.map((result, index) => `
          <div class="location-result-item" data-index="${index}" style="
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${result.display_name}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
              📍 经度: ${parseFloat(result.lon).toFixed(6)}, 纬度: ${parseFloat(result.lat).toFixed(6)}
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px;">
              类型: ${result.type || '未知'} | ${result.class || ''}
            </div>
          </div>
        `).join('');

        // 添加悬停效果
        const resultItems = resultsDiv.querySelectorAll('.location-result-item');
        resultItems.forEach(item => {
          item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(102, 126, 234, 0.2)';
            item.style.borderColor = 'rgba(102, 126, 234, 0.5)';
          });
          item.addEventListener('mouseleave', () => {
            item.style.background = 'rgba(255, 255, 255, 0.05)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          });
          item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const selected = results[index];

            // 飞往选中的位置
            const lon = parseFloat(selected.lon);
            const lat = parseFloat(selected.lat);

            // 根据边界框计算合适的高度
            let height = 10000; // 默认高度
            if (selected.boundingbox) {
              const bbox = selected.boundingbox;
              const latDiff = Math.abs(parseFloat(bbox[1]) - parseFloat(bbox[0]));
              const lonDiff = Math.abs(parseFloat(bbox[3]) - parseFloat(bbox[2]));
              const maxDiff = Math.max(latDiff, lonDiff);

              // 根据区域大小动态调整高度
              if (maxDiff > 10) height = 1000000;  // 国家级
              else if (maxDiff > 1) height = 500000;  // 省/州级
              else if (maxDiff > 0.1) height = 100000;  // 城市级
              else if (maxDiff > 0.01) height = 20000;  // 区/镇级
              else height = 5000;  // 街道/建筑级
            }

            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
              duration: 2,
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
              }
            });

            // 在地图上添加标记
            this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat),
              billboard: {
                image: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
                    <path fill="#667eea" stroke="#fff" stroke-width="2"
                          d="M16,0 C7.2,0 0,7.2 0,16 C0,24.8 16,48 16,48 S32,24.8 32,16 C32,7.2 24.8,0 16,0 Z"/>
                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                  </svg>
                `),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 1.2
              },
              label: {
                text: selected.display_name.split(',')[0],
                font: '14px Microsoft YaHei',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -50)
              }
            });

            this.showNotification(`正在飞往: ${selected.display_name.split(',')[0]}`, 'success');
            closeDialog();
          });
        });

      } catch (error) {
        console.error('地名搜索失败:', error);
        resultsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: #ff6b6b;">搜索失败,请稍后重试</div>';
        this.showNotification('搜索失败: ' + error.message, 'error');
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 搜索';
      }
    };

    searchBtn.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // 自动聚焦输入框
    setTimeout(() => input.focus(), 100);
  }

  /**
   * 空间分析功能 - 可视域分析
   */
  spatialAnalysis() {
    this.hideMenu();

    // 创建空间分析对话框
    const dialogHTML = `
      <div id="spatialAnalysisDialog" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 33, 36, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 20px;
        min-width: 350px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        z-index: 20000;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
        backdrop-filter: blur(12px);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 500;">🗺️ 空间分析</h3>
          <button id="closeSpatialAnalysis" style="
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>

        <div style="margin-bottom: 15px;">
          <button class="spatial-btn" data-analysis="viewshed" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 10px;
            font-weight: 500;
          ">👁️ 可视域分析</button>

          <button class="spatial-btn" data-analysis="buffer" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 10px;
            font-weight: 500;
          ">⭕ 缓冲区分析</button>

          <button class="spatial-btn" data-analysis="visibility" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 10px;
            font-weight: 500;
          ">📏 视线分析</button>

          <button class="spatial-btn" data-analysis="clear" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            font-weight: 500;
          ">🗑️ 清除分析结果</button>
        </div>

        <div style="font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5;">
          <strong>使用说明:</strong><br>
          • 可视域分析: 点击地图设置观察点<br>
          • 缓冲区分析: 点击地图创建缓冲区<br>
          • 视线分析: 点击两点分析视线遮挡
        </div>
      </div>
    `;

    // 添加到页面
    const dialogContainer = document.createElement('div');
    dialogContainer.innerHTML = dialogHTML;
    document.body.appendChild(dialogContainer);

    const dialog = document.getElementById('spatialAnalysisDialog');
    const closeBtn = document.getElementById('closeSpatialAnalysis');

    // 初始化分析结果存储
    if (!this.spatialAnalysisEntities) {
      this.spatialAnalysisEntities = [];
    }

    // 关闭对话框
    const closeDialog = () => {
      if (dialogContainer && dialogContainer.parentNode) {
        dialogContainer.parentNode.removeChild(dialogContainer);
      }
    };

    closeBtn.addEventListener('click', closeDialog);

    // 分析功能按钮事件
    const buttons = dialog.querySelectorAll('.spatial-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const analysisType = btn.dataset.analysis;

        switch(analysisType) {
          case 'viewshed':
            this.performViewshedAnalysis();
            closeDialog();
            break;
          case 'buffer':
            this.performBufferAnalysis();
            closeDialog();
            break;
          case 'visibility':
            this.performVisibilityAnalysis();
            closeDialog();
            break;
          case 'clear':
            this.clearSpatialAnalysis();
            break;
        }
      });
    });
  }

  /**
   * 执行可视域分析
   */
  performViewshedAnalysis() {
    this.showNotification('请点击地图设置观察点', 'info');

    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);

      if (!pickedPosition) {
        this.showNotification('无法获取有效位置', 'warning');
        handler.destroy();
        return;
      }

      const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height + 100; // 观察点高度+100米

      // 创建观察点标记
      const viewPoint = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
        point: {
          pixelSize: 12,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        },
        label: {
          text: '👁️ 观察点',
          font: '14px Microsoft YaHei',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15)
        }
      });

      // 创建可视域圆锥体
      const radius = 5000; // 5公里半径
      const viewshedEntity = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
        cylinder: {
          length: height + 1000,
          topRadius: 0,
          bottomRadius: radius,
          material: Cesium.Color.GREEN.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.GREEN.withAlpha(0.8)
        }
      });

      // 添加可视域圆形边界
      const circleEntity = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        ellipse: {
          semiMinorAxis: radius,
          semiMajorAxis: radius,
          material: Cesium.Color.GREEN.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.GREEN,
          outlineWidth: 2
        }
      });

      // 存储分析结果
      this.spatialAnalysisEntities.push(viewPoint, viewshedEntity, circleEntity);

      this.showNotification('可视域分析完成 (半径5km)', 'success');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 右键取消
    handler.setInputAction(() => {
      this.showNotification('已取消可视域分析', 'info');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 执行缓冲区分析
   */
  performBufferAnalysis() {
    this.showNotification('请点击地图创建缓冲区中心点', 'info');

    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);

      if (!pickedPosition) {
        this.showNotification('无法获取有效位置', 'warning');
        handler.destroy();
        return;
      }

      const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      // 创建多级缓冲区
      const bufferRadii = [1000, 2000, 3000]; // 1km, 2km, 3km
      const colors = [
        Cesium.Color.RED.withAlpha(0.3),
        Cesium.Color.ORANGE.withAlpha(0.25),
        Cesium.Color.YELLOW.withAlpha(0.2)
      ];

      // 中心点标记
      const centerPoint = this.viewer.entities.add({
        position: pickedPosition,
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: '⭕ 缓冲区中心',
          font: '14px Microsoft YaHei',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15)
        }
      });

      this.spatialAnalysisEntities.push(centerPoint);

      // 创建多级缓冲区圆
      bufferRadii.forEach((radius, index) => {
        const bufferEntity = this.viewer.entities.add({
          position: pickedPosition,
          ellipse: {
            semiMinorAxis: radius,
            semiMajorAxis: radius,
            material: colors[index],
            outline: true,
            outlineColor: colors[index].withAlpha(1.0),
            outlineWidth: 2
          },
          label: {
            text: `${radius/1000}km`,
            font: '12px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -radius/100)
          }
        });

        this.spatialAnalysisEntities.push(bufferEntity);
      });

      this.showNotification('缓冲区分析完成 (1km/2km/3km)', 'success');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 右键取消
    handler.setInputAction(() => {
      this.showNotification('已取消缓冲区分析', 'info');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 执行视线分析
   */
  performVisibilityAnalysis() {
    this.showNotification('请点击起点', 'info');

    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    let startPoint = null;
    let startEntity = null;

    handler.setInputAction((click) => {
      const pickedPosition = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);

      if (!pickedPosition) {
        this.showNotification('无法获取有效位置', 'warning');
        return;
      }

      if (!startPoint) {
        // 第一次点击 - 设置起点
        startPoint = pickedPosition;

        startEntity = this.viewer.entities.add({
          position: startPoint,
          point: {
            pixelSize: 10,
            color: Cesium.Color.BLUE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: '📏 起点',
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15)
          }
        });

        this.spatialAnalysisEntities.push(startEntity);
        this.showNotification('请点击终点', 'info');
      } else {
        // 第二次点击 - 设置终点并分析
        const endPoint = pickedPosition;

        const endEntity = this.viewer.entities.add({
          position: endPoint,
          point: {
            pixelSize: 10,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: '📏 终点',
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15)
          }
        });

        // 使用射线检测地形遮挡
        const scene = this.viewer.scene;
        const ray = new Cesium.Ray(startPoint, Cesium.Cartesian3.subtract(endPoint, startPoint, new Cesium.Cartesian3()));
        const intersection = scene.globe.pick(ray, scene);

        const isVisible = !intersection || Cesium.Cartesian3.distance(startPoint, intersection) >= Cesium.Cartesian3.distance(startPoint, endPoint);

        // 绘制视线
        const lineColor = isVisible ? Cesium.Color.GREEN : Cesium.Color.RED;
        const lineEntity = this.viewer.entities.add({
          polyline: {
            positions: [startPoint, endPoint],
            width: 3,
            material: lineColor,
            clampToGround: false
          },
          label: {
            position: Cesium.Cartesian3.midpoint(startPoint, endPoint, new Cesium.Cartesian3()),
            text: isVisible ? '✅ 可见' : '❌ 遮挡',
            font: '14px Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE
          }
        });

        this.spatialAnalysisEntities.push(endEntity, lineEntity);

        const distance = Cesium.Cartesian3.distance(startPoint, endPoint);
        this.showNotification(
          `视线分析完成: ${isVisible ? '可见' : '被遮挡'}, 距离: ${distance.toFixed(2)}米`,
          isVisible ? 'success' : 'warning'
        );

        handler.destroy();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 右键取消
    handler.setInputAction(() => {
      this.showNotification('已取消视线分析', 'info');
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 清除所有空间分析结果
   */
  clearSpatialAnalysis() {
    if (this.spatialAnalysisEntities && this.spatialAnalysisEntities.length > 0) {
      this.spatialAnalysisEntities.forEach(entity => {
        this.viewer.entities.remove(entity);
      });
      this.spatialAnalysisEntities = [];
      this.showNotification('已清除所有空间分析结果', 'success');
    } else {
      this.showNotification('没有需要清除的分析结果', 'info');
    }
  }

  /**
   * 更新功能状态并刷新菜单
   */
  updateFeatureState(stateKey, value) {
    if (this.featureStates.hasOwnProperty(stateKey)) {
      this.featureStates[stateKey] = value;
      // 注意: 菜单会在下次打开时自动显示最新状态
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    // 停止环绕动画
    if (this.rotationAnimation) {
      this.viewer.clock.onTick.removeEventListener(this.rotationAnimation);
    }

    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }

    if (this.submenuElement && this.submenuElement.parentNode) {
      this.submenuElement.parentNode.removeChild(this.submenuElement);
    }
  }
}

// 导出供其他模块使用
window.ContextMenu = ContextMenu;
console.log('📄 ============================================');
console.log('📄 context-menu.js 新版多级菜单已加载!');
console.log('📄 版本: 2024-10-07 v2.0 - 多级菜单系统');
console.log('📄 ============================================');

// 延迟自动初始化
setTimeout(() => {
  if (window.viewer && !window.contextMenu) {
    console.log('🔧 自动初始化右键菜单...');
    try {
      window.contextMenu = new ContextMenu(window.viewer);
      console.log('✅ 右键菜单自动初始化成功');
      console.log('✅ 请在地图上右键点击测试多级菜单!');
    } catch (error) {
      console.error('❌ 右键菜单自动初始化失败:', error);
    }
  } else if (!window.viewer) {
    console.warn('⚠️ window.viewer 不存在,无法初始化右键菜单');
  } else if (window.contextMenu) {
    console.log('ℹ️ 右键菜单已经初始化过了');
  }
}, 3000);
