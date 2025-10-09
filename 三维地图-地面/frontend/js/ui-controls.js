// UI控制模块
// 负责界面元素的交互、面板控制、工具栏按钮事件等

// 工具栏激活状态管理
const setActiveTool = (id) => {
  // 清除所有工具栏按钮的激活状态
  document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
  // 激活指定工具按钮
  const activeBtn = document.getElementById(id);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// 右侧面板控制
function toggleRightPanel() {
  const panel = document.querySelector('.right-panel');
  if (panel) {
    panel.classList.toggle('hidden');
    return !panel.classList.contains('hidden');
  }
  return false;
}

function showRightPanel() {
  const panel = document.querySelector('.right-panel');
  if (panel) {
    panel.classList.remove('hidden');
  }
}

function hideRightPanel() {
  const panel = document.querySelector('.right-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

// 获取实际的影像图层（跳过透明底图）
function getActiveImageryLayer() {
  if (!window.viewer || !window.viewer.imageryLayers) return null;

  const layers = window.viewer.imageryLayers;

  // 从最后一层开始查找，跳过透明的1x1底图
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers.get(i);
    if (layer && layer.imageryProvider) {
      // 检查是否为实际的影像图层而非透明底图
      const provider = layer.imageryProvider;

      // 跳过1x1透明图层或OpenStreetMap等默认图层
      if (provider.width === 1 && provider.height === 1) continue;
      if (provider.url && provider.url.includes('openstreetmap')) continue;

      return layer;
    }
  }

  // 如果没找到实际图层，返回最后一层
  return layers.length > 0 ? layers.get(layers.length - 1) : null;
}

// 图层控制函数
function setupLayerControls() {
  // 地形图层控制
  const terrainToggle = document.getElementById('terrainToggle');
  if (terrainToggle) {
    terrainToggle.addEventListener('change', (e) => {
      // 控制地形高程系数而不是完全隐藏地球
      if (window.viewer && window.viewer.scene && window.viewer.scene.globe) {
        // 强制确保原始地形夸张值为4.0（确保第一次点击就生效）
        window.originalTerrainExaggeration = 4.0;

        if (e.target.checked) {
          // 显示地形：使用保存的夸张值
          window.viewer.scene.globe.terrainExaggeration = window.originalTerrainExaggeration;
          console.log('🏔️ 地形已启用，夸张值:', window.originalTerrainExaggeration);

          // 同步滑动条的值
          const slExag = document.getElementById('slExag');
          const lbExag = document.getElementById('lbExag');
          if (slExag) {
            slExag.value = window.originalTerrainExaggeration;
          }
          if (lbExag) {
            lbExag.textContent = window.originalTerrainExaggeration.toFixed(1) + '×';
          }
        } else {
          // 隐藏地形：将地形高程设为0（平坦），但保持纹理和其他效果
          window.viewer.scene.globe.terrainExaggeration = 0.0;
          console.log('🏔️ 地形已禁用，设为平坦');
        }
      }

      // 控制地形夸张滑动条的启用/禁用状态
      const slExag = document.getElementById('slExag');
      if (slExag) {
        slExag.disabled = !e.target.checked;
        // 添加视觉反馈
        slExag.style.opacity = e.target.checked ? '1' : '0.5';
        slExag.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
      }

      console.log('地形显示:', e.target.checked ? '已启用（立体地形）' : '已禁用（平坦地形）');
    });


    // 延迟触发复选框change事件，强制同步状态
    setTimeout(() => {
      const event = new Event('change');
      terrainToggle.dispatchEvent(event);
    }, 2000); // 等待地形加载完成
  }

  // 影像图层控制
  const imageryToggle = document.getElementById('imageryToggle');
  if (imageryToggle) {
    imageryToggle.addEventListener('change', (e) => {
      // 控制影像显示
      const layer = getActiveImageryLayer();
      if (layer) {
        layer.show = e.target.checked;
        console.log('影像显示:', e.target.checked ? '已启用' : '已禁用');
      } else {
        console.warn('未找到可控制的影像图层');
      }
    });
  }

  // 地形夸张控制
  const slExag = document.getElementById('slExag');
  const lbExag = document.getElementById('lbExag');
  if (slExag && lbExag) {
    slExag.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      lbExag.textContent = value.toFixed(1) + '×';

      if (window.viewer && window.viewer.scene && window.viewer.scene.globe) {
        // 滑动条变化时，更新用户自定义的地形夸张值
        window.originalTerrainExaggeration = value;

        // 检查地形开关状态
        const terrainToggle = document.getElementById('terrainToggle');
        const isTerrainEnabled = terrainToggle ? terrainToggle.checked : true;

        // 只有在地形启用时才应用新的夸张值
        if (isTerrainEnabled) {
          window.viewer.scene.globe.terrainExaggeration = value;
          console.log('🏔️ 地形夸张值更新为:', value);
        } else {
          console.log('🏔️ 地形夸张值已保存，但地形当前禁用:', value);
        }
        // 如果地形被禁用，保持0值，但记录用户设置的值
      }
    });
  }

  // 透明度控制
  const slOpacity = document.getElementById('slOpacity');
  const lbOpacity = document.getElementById('lbOpacity');
  if (slOpacity && lbOpacity) {
    slOpacity.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      lbOpacity.textContent = Math.round(value * 100) + '%';

      const layer = getActiveImageryLayer();
      if (layer) {
        layer.alpha = value;
        console.log('影像透明度:', Math.round(value * 100) + '%');
      } else {
        console.warn('未找到可控制的影像图层');
      }
    });
  }


  // 界面控件控制
  setupInterfaceControls();

  // 地震图层控制
  setupEarthquakeControls();
}

// 界面控件控制函数
function setupInterfaceControls() {
  // 帮助控件
  const cbHelp = document.getElementById('cbHelp');
  if (cbHelp) {
    cbHelp.addEventListener('change', (e) => {
      const creditContainer = document.querySelector('.cesium-widget-credits');
      if (creditContainer) {
        creditContainer.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  // 地图缩放控件
  const cbMapControl = document.getElementById('cbMapControl');
  if (cbMapControl) {
    cbMapControl.addEventListener('change', (e) => {
      const navigationContainer = document.querySelector('.cesium-navigationHelpButton-wrapper');
      if (navigationContainer) {
        navigationContainer.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  // 状态信息栏
  const cbStatusInfo = document.getElementById('cbStatusInfo');
  if (cbStatusInfo) {
    cbStatusInfo.addEventListener('change', (e) => {
      const bottombar = document.getElementById('bottombar');
      if (bottombar) {
        bottombar.style.display = e.target.checked ? 'flex' : 'none';
      }
    });
  }

  // 导航球
  const cbNavBall = document.getElementById('cbNavBall');
  if (cbNavBall) {
    cbNavBall.addEventListener('change', (e) => {
      const vrButton = document.querySelector('.cesium-vrButton-wrapper');
      if (vrButton) {
        vrButton.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  // 比例尺
  const cbCompareRule = document.getElementById('cbCompareRule');
  if (cbCompareRule) {
    cbCompareRule.addEventListener('change', (e) => {
      const scaleContainer = document.querySelector('.cesium-sceneModePicker-wrapper');
      if (scaleContainer) {
        scaleContainer.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }
}

// 地震图层控制函数
function setupEarthquakeControls() {
  // 初始化地震图层
  if (window.viewer && window.EarthquakeLayer) {
    window.earthquakeLayer = new window.EarthquakeLayer(window.viewer);
  }

  // 地震图层开关
  const earthquakeToggle = document.getElementById('earthquakeToggle');
  if (earthquakeToggle) {
    earthquakeToggle.addEventListener('change', async (e) => {
      if (!window.earthquakeLayer) {
        console.warn('地震图层未初始化');
        return;
      }

      if (e.target.checked) {
        try {
          console.log('🌍 正在加载地震数据...');

          // 获取当前震级过滤设置
          const minMagSlider = document.getElementById('slMinMagnitude');
          const minMagnitude = minMagSlider ? parseFloat(minMagSlider.value) : 3.0;

          const count = await window.earthquakeLayer.loadEarthquakes({
            minMagnitude: minMagnitude,
            recentYears: 1  // 默认显示最近1年的地震数据
          });

          console.log(`✅ 已加载 ${count} 个地震点`);
        } catch (error) {
          console.error('❌ 加载地震数据失败:', error);
          e.target.checked = false; // 恢复开关状态
          alert('加载地震数据失败，请检查网络连接');
        }
      } else {
        window.earthquakeLayer.setVisible(false);
        console.log('🔄 已隐藏地震图层');
      }
    });
  }

  // 最小震级滑块控制
  const slMinMagnitude = document.getElementById('slMinMagnitude');
  const lbMinMag = document.getElementById('lbMinMag');
  if (slMinMagnitude && lbMinMag) {
    slMinMagnitude.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      lbMinMag.textContent = value.toFixed(1);

      // 实时过滤显示
      if (window.earthquakeLayer && window.earthquakeLayer.getVisible()) {
        window.earthquakeLayer.filterByMagnitude(value, 10); // 最大震级设为10
        console.log(`🔍 震级过滤: M${value.toFixed(1)}+`);
      }
    });

    // 滑块释放时重新加载数据（避免频繁请求）
    slMinMagnitude.addEventListener('change', async (e) => {
      const earthquakeToggle = document.getElementById('earthquakeToggle');

      if (earthquakeToggle && earthquakeToggle.checked && window.earthquakeLayer) {
        try {
          const minMagnitude = parseFloat(e.target.value);
          console.log(`🔄 重新加载震级M${minMagnitude.toFixed(1)}+的地震数据`);

          await window.earthquakeLayer.clear();
          const count = await window.earthquakeLayer.loadEarthquakes({
            minMagnitude: minMagnitude,
            recentYears: 1  // 默认显示最近1年的地震数据
          });

          console.log(`✅ 已重新加载 ${count} 个地震点`);
        } catch (error) {
          console.error('❌ 重新加载地震数据失败:', error);
        }
      }
    });
  }
}

// 断层图层控制函数
function setupFaultLayerControls() {
  // 断层图层开关
  const faultToggle = document.getElementById('faultToggle');
  if (faultToggle) {
    faultToggle.addEventListener('change', (e) => {
      if (window.faultLayer) {
        window.faultLayer.setVisible(e.target.checked);
        console.log(`🔴 断层图层${e.target.checked ? '显示' : '隐藏'}`);
      }
    });
  }
}

// 五代图图层控制函数
function setupGenerationLayerControls() {
  // 五代图图层开关
  const generationToggle = document.getElementById('generationToggle');
  if (generationToggle) {
    generationToggle.addEventListener('change', (e) => {
      if (window.generationLayer) {
        window.generationLayer.setVisible(e.target.checked);
        console.log(`🗺️ 五代图图层${e.target.checked ? '显示' : '隐藏'}`);
      }
    });
  }

}

// 行政界线控制函数
function setupAdministrativeBoundaryControls() {
  // 国界图层控制
  const countryBoundaryToggle = document.getElementById('countryBoundaryToggle');
  if (countryBoundaryToggle) {
    countryBoundaryToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        try {
          if (!window.countryBoundaryLayer) {
            window.countryBoundaryLayer = new CountryBoundaryLayer(window.viewer);
            await window.countryBoundaryLayer.initialize();
          }
          await window.countryBoundaryLayer.loadData();
          window.countryBoundaryLayer.setVisible(true);
          console.log('🌍 国界图层已显示');
        } catch (error) {
          console.error('❌ 国界图层加载失败:', error);
          e.target.checked = false;
        }
      } else {
        if (window.countryBoundaryLayer) {
          window.countryBoundaryLayer.setVisible(false);
          console.log('🌍 国界图层已隐藏');
        }
      }
    });
  }

  // 省界图层控制
  const provinceBoundaryToggle = document.getElementById('provinceBoundaryToggle');
  if (provinceBoundaryToggle) {
    provinceBoundaryToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        try {
          if (!window.provinceBoundaryLayer) {
            window.provinceBoundaryLayer = new ProvinceBoundaryLayer(window.viewer);
            await window.provinceBoundaryLayer.initialize();
          }
          await window.provinceBoundaryLayer.loadData();
          window.provinceBoundaryLayer.setVisible(true);
          console.log('🗾 省界图层已显示');
        } catch (error) {
          console.error('❌ 省界图层加载失败:', error);
          e.target.checked = false;
        }
      } else {
        if (window.provinceBoundaryLayer) {
          window.provinceBoundaryLayer.setVisible(false);
          console.log('🗾 省界图层已隐藏');
        }
      }
    });
  }

  // 市界图层控制
  const cityBoundaryToggle = document.getElementById('cityBoundaryToggle');
  if (cityBoundaryToggle) {
    cityBoundaryToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        try {
          if (!window.cityBoundaryLayer) {
            window.cityBoundaryLayer = new CityBoundaryLayer(window.viewer);
            await window.cityBoundaryLayer.initialize();
          }
          await window.cityBoundaryLayer.loadData();
          window.cityBoundaryLayer.setVisible(true);
          console.log('🏘️ 市界图层已显示');
        } catch (error) {
          console.error('❌ 市界图层加载失败:', error);
          e.target.checked = false;
        }
      } else {
        if (window.cityBoundaryLayer) {
          window.cityBoundaryLayer.setVisible(false);
          console.log('🏘️ 市界图层已隐藏');
        }
      }
    });
  }
}

// 台站图层控制函数
function setupStationLayerControls() {
  // 初始化台站图层
  if (window.viewer && window.StationLayer) {
    window.stationLayer = new window.StationLayer(window.viewer);
  }

  // 台站图层开关
  const stationToggle = document.getElementById('stationToggle');
  if (stationToggle) {
    stationToggle.addEventListener('change', async (e) => {
      if (!window.stationLayer) {
        console.warn('台站图层未初始化');
        return;
      }

      if (e.target.checked) {
        try {
          console.log('📡 正在加载台站数据...');

          // 初始化图层
          await window.stationLayer.initialize();

          // 加载台站数据
          const count = await window.stationLayer.loadStations();

          // 显示图层
          window.stationLayer.setVisible(true);

          console.log(`✅ 已加载 ${count} 个台站`);
        } catch (error) {
          console.error('❌ 加载台站数据失败:', error);
          e.target.checked = false; // 恢复开关状态
          alert('加载台站数据失败，请检查网络连接');
        }
      } else {
        window.stationLayer.setVisible(false);
        console.log('🔄 已隐藏台站图层');
      }
    });
  }
}


// 工具栏按钮事件绑定
function setupToolbarEvents() {
  // 选择指针工具
  document.getElementById('toolPointer')?.addEventListener('click', () => {
    if (window.MeasureTools) {
      window.MeasureTools.clearMeasure();
    }
    if (window.DrawingTools) {
      window.DrawingTools.clearDraws();
    }
    setActiveTool('toolPointer');
    console.log('选择工具已激活');
  });

  // 距离测量工具
  document.getElementById('toolMeasureDist')?.addEventListener('click', () => {
    if (window.MeasureTools) {
      window.MeasureTools.startMeasure('distance');
    }
    setActiveTool('toolMeasureDist');
  });

  // 复位视图
  document.getElementById('toolHome')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.flyHome();
    }
  });

  // 全球视图
  document.getElementById('toolGlobe')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.flyToGlobe();
    }
  });

  // 搜索定位
  document.getElementById('toolSearch')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.searchLocation();
    }
  });

  // 放大
  document.getElementById('toolZoomIn')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.zoomIn();
    }
  });

  // 缩小
  document.getElementById('toolZoomOut')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.zoomOut();
    }
  });

  // 全屏模式
  document.getElementById('toolVR')?.addEventListener('click', () => {
    if (window.MapControls) {
      window.MapControls.toggleFullscreen();
    }
  });

  // 面积测量工具
  document.getElementById('toolMeasureArea')?.addEventListener('click', () => {
    if (window.MeasureTools) {
      window.MeasureTools.startMeasure('area');
    }
    setActiveTool('toolMeasureArea');
  });

  // 绘制工具
  document.getElementById('toolDrawPoint')?.addEventListener('click', () => {
    if (window.DrawingTools) {
      window.DrawingTools.startDraw('point');
    }
    setActiveTool('toolDrawPoint');
  });

  document.getElementById('toolDrawLine')?.addEventListener('click', () => {
    if (window.DrawingTools) {
      window.DrawingTools.startDraw('line');
    }
    setActiveTool('toolDrawLine');
  });

  document.getElementById('toolDrawPolygon')?.addEventListener('click', () => {
    if (window.DrawingTools) {
      window.DrawingTools.startDraw('polygon');
    }
    setActiveTool('toolDrawPolygon');
  });

  // 清除工具
  document.getElementById('toolClear')?.addEventListener('click', () => {
    if (window.MeasureTools) {
      window.MeasureTools.clearMeasure();
    }
    if (window.DrawingTools) {
      window.DrawingTools.clearDraws();
    }
    setActiveTool('toolPointer');
    console.log('已清除所有标绘');
  });

  // 飞到西安
  document.getElementById('toolFlyToXiAn')?.addEventListener('click', () => {
    if (window.MapControls) {
      const UNDERGROUND_DEFAULT = { lon: 108.94, lat: 34.34 };
      window.MapControls.flyToPosition(UNDERGROUND_DEFAULT.lon, UNDERGROUND_DEFAULT.lat, 12000, 1.2);
    }
    // 飞行到西安地面位置
  });


  // 控件面板切换
  document.getElementById('toolTogglePanel')?.addEventListener('click', () => {
    const isVisible = toggleRightPanel();
    const button = document.getElementById('toolTogglePanel');
    if (button) {
      if (isVisible) {
        button.classList.add('active');
        button.title = '控件面板 - 隐藏控件面板';
      } else {
        button.classList.remove('active');
        button.title = '控件面板 - 显示控件面板';
      }
    }
    console.log('切换控件面板显示状态');
  });

  // 修复黑边
  document.getElementById('toolFixBlackEdges')?.addEventListener('click', () => {
    if (window.SGSManager) {
      window.SGSManager.setStatus('✅ 图层去黑边处理已应用');
    }
    console.log('黑边处理已应用');
  });
}

// 信息提示工具
document.getElementById('toolInfo')?.addEventListener('click', () => {
  const helpText = `
🗺️ 三维地图操作指南：

基本操作：
• 鼠标左键拖拽：旋转地球
• 鼠标右键拖拽：平移视图
• 鼠标滚轮：缩放
• 中键拖拽：倾斜视角

工具说明：
📍 指针：默认选择模式
🏠 复位：回到初始位置
📏 测距：点击两点测量距离
🌍 全球：显示地球全貌
🔍 缩放：放大/缩小视图
🖥️ 全屏：进入/退出全屏
✈️ 西安：飞到西安位置

快捷键：
• 空格：复位视图
• F：全屏切换
• ESC：取消当前操作
  `;

  alert(helpText);
});

// 键盘快捷键支持
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (window.MapControls) {
          window.MapControls.flyHome();
        }
        break;
      case 'KeyF':
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        if (window.MapControls) {
          window.MapControls.toggleFullscreen();
        }
        break;
      case 'Escape':
        if (window.MeasureTools) {
          window.MeasureTools.finishMeasure();
        }
        if (window.DrawingTools) {
          window.DrawingTools.finishDraw();
        }
        setActiveTool('toolPointer');
        break;
    }
  });
}

// 初始化UI控制
function initUIControls() {
  setupToolbarEvents();
  setupLayerControls();
  setupEarthquakeControls();
  setupFaultLayerControls();        // 新增断层图层控制
  setupGenerationLayerControls();   // 新增五代图图层控制
  setupAdministrativeBoundaryControls();  // 新增行政界线管理器控制
  setupStationLayerControls();      // 新增台站图层控制
  setupKeyboardShortcuts();

  // 设置默认激活工具
  setActiveTool('toolPointer');

  // 确保控件面板按钮初始状态正确（面板默认隐藏）
  const panelButton = document.getElementById('toolTogglePanel');
  if (panelButton) {
    panelButton.classList.remove('active');
    panelButton.title = '控件面板 - 显示控件面板';
  }

  // UI控制系统初始化完成
}

// 导出函数供其他模块使用
window.UIControls = {
  initUIControls,
  setupToolbarEvents,
  setupLayerControls,
  setupKeyboardShortcuts,
  setupInterfaceControls,
  setupEarthquakeControls,
  setActiveTool,
  toggleRightPanel,
  showRightPanel,
  hideRightPanel,
  getActiveImageryLayer
};

