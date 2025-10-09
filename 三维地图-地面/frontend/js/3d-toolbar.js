/**
 * 简单工具栏 - 使用纯CSS树形组件
 */
class SimpleToolbar {
  constructor() {
    this.currentPanel = null;
    this.viewer = null;
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();

    console.log('✅ 简单工具栏初始化完成');
  }

  createUI() {
    const html = `
      <div class="floating-toolbar">
        <div class="toolbar-buttons">
          <button class="toolbar-tab-btn" data-panel="basemap">
            <svg viewBox="0 0 24 24"><path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/></svg>
            底图
          </button>
          <button class="toolbar-tab-btn" data-panel="layers">
            <svg viewBox="0 0 24 24"><path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z"/></svg>
            图层
          </button>
          <button class="toolbar-tab-btn" data-panel="tools">
            <svg viewBox="0 0 24 24"><path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/></svg>
            工具
          </button>
        </div>
      </div>

      <!-- 底图面板 -->
      <div class="toolbar-panel" id="basemapPanel">
        <div class="toolbar-panel-header">
          <div class="toolbar-panel-title">
            <svg viewBox="0 0 24 24"><path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/></svg>
            底图选择
          </div>
          <button class="toolbar-panel-close">×</button>
        </div>
        <div class="toolbar-panel-content">
          <div class="basemap-grid">
            ${this.createBasemaps()}
          </div>

          <!-- DEM控制 -->
          <div class="dem-control">
            <div class="dem-control-item">
              <div class="dem-slider-container">
                <div class="dem-label">
                  <span class="dem-label-text">地形放大(夸张)</span>
                  <span class="dem-value" id="terrainExagValue">3.0</span>
                </div>
                <input type="range" id="terrainExaggeration" min="0" max="5" step="0.5" value="3.0" class="dem-slider">
                <div class="dem-marks">
                  <span>0</span>
                  <span>2.5</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图层面板 - 3D图层树 -->
      <div class="toolbar-panel" id="layersPanel">
        <div class="toolbar-panel-header">
          <div class="toolbar-panel-title">
            <svg viewBox="0 0 24 24"><path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z"/></svg>
            图层管理
          </div>
          <button class="toolbar-panel-close">×</button>
        </div>
        <div class="toolbar-panel-content">
          <!-- 图层树容器 - 由LayerTreeManager动态填充 -->
          <div id="layer-tree-container"></div>
        </div>
      </div>

      <!-- 工具下拉菜单 -->
      <div class="tool-dropdown" id="toolsDropdown">
        <ul class="tool-menu-list">
          ${this.createTools()}
        </ul>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  createBasemaps() {
    const maps = [
      {id:'sgs',name:'SGS影像',color:'#2E7D32'},
      {id:'gaode',name:'高德影像',color:'#228B22'},
      {id:'tianditu',name:'天地图影像',color:'#4682B4'},
      {id:'baidu',name:'百度影像',color:'#556B2F'}
    ];

    return maps.map((m,i)=>`
      <div class="basemap-item ${i===0?'active':''}" data-id="${m.id}">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${encodeURIComponent(m.color)}' width='100' height='100'/%3E%3C/svg%3E" class="basemap-preview">
        <div class="basemap-label">${m.name}</div>
      </div>
    `).join('');
  }


  createTools() {
    const tools = [
      {id:'fly-beijing',name:'飞往北京', icon:'🏛️'},
      {id:'fly-xian',name:'飞往西安', icon:'🏺'},
      {id:'fly-chuandian',name:'飞往川滇地区', icon:'📍'}
    ];

    return tools.map(t=>`
      <li class="tool-menu-item" data-id="${t.id}">
        <div class="tool-menu-icon">${t.icon || '🔧'}</div>
        <div class="tool-menu-text">${t.name}</div>
      </li>
    `).join('');
  }

  bindEvents() {
    // 按钮点击
    document.querySelectorAll('.toolbar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (panel === 'tools') {
          this.toggleDropdown();
        } else {
          this.togglePanel(panel);
        }
      });
    });

    // 面板关闭
    document.querySelectorAll('.toolbar-panel-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAll());
    });

    // 底图选择
    document.addEventListener('click', e => {
      const item = e.target.closest('.basemap-item');
      if (item) {
        document.querySelectorAll('.basemap-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        console.log('底图:', item.dataset.id);
      }
    });

    // 图层树由LayerTreeManager处理，不需要额外的事件绑定

    // DEM地形控制滑块
    const terrainSlider = document.getElementById('terrainExaggeration');
    const terrainValue = document.getElementById('terrainExagValue');
    if (terrainSlider && terrainValue) {
      terrainSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        terrainValue.textContent = value.toFixed(1);
        if (this.viewer && this.viewer.scene.globe.terrainProvider) {
          this.viewer.scene.globe.terrainExaggeration = value;
          console.log(`✅ 地形夸张值已设置为: ${value}`);
        }
      });
    }

    // 工具菜单
    document.addEventListener('click', async (e) => {
      const item = e.target.closest('.tool-menu-item');
      if (item) {
        const toolId = item.dataset.id;
        console.log('工具:', toolId);

        // 处理工具点击
        await this.handleToolClick(toolId);
        this.closeAll();
      }
    });

    // 外部点击只关闭工具下拉菜单,不关闭面板
    document.addEventListener('click', e => {
      if (!e.target.closest('.floating-toolbar') &&
          !e.target.closest('.tool-dropdown')) {
        const dropdown = document.getElementById('toolsDropdown');
        const toolsBtn = document.querySelector('[data-panel="tools"]');
        if (dropdown && toolsBtn) {
          dropdown.classList.remove('show');
          toolsBtn.classList.remove('active');
        }
      }
    });
  }

  togglePanel(name) {
    const panel = document.getElementById(name + 'Panel');
    const btn = document.querySelector(`[data-panel="${name}"]`);

    // 关闭工具下拉
    document.getElementById('toolsDropdown').classList.remove('show');
    document.querySelector('[data-panel="tools"]').classList.remove('active');

    // 如果点击的是已打开的面板按钮,保持打开(不关闭)
    if (this.currentPanel === name) {
      return;
    }

    // 关闭其他面板
    document.querySelectorAll('.toolbar-panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.toolbar-tab-btn').forEach(b => b.classList.remove('active'));

    // 打开当前面板
    panel.classList.add('show');
    btn.classList.add('active');
    this.currentPanel = name;
  }

  toggleDropdown() {
    const dropdown = document.getElementById('toolsDropdown');
    const btn = document.querySelector('[data-panel="tools"]');

    // 关闭所有面板
    document.querySelectorAll('.toolbar-panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.toolbar-tab-btn').forEach(b => b.classList.remove('active'));
    this.currentPanel = null;

    // 切换下拉
    dropdown.classList.toggle('show');
    btn.classList.toggle('active');
  }

  closeAll() {
    document.querySelectorAll('.toolbar-panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.toolbar-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolsDropdown').classList.remove('show');
    this.currentPanel = null;
  }

  async handleToolClick(toolId) {
    switch(toolId) {
      case 'fly-beijing':
        this.flyToCity('beijing');
        break;
      case 'fly-xian':
        this.flyToCity('xian');
        break;
      case 'fly-chuandian':
        this.flyToResearchArea('chuandian');
        break;
      default:
        console.log('未知工具:', toolId);
    }
  }

  flyToCity(city) {
    const cities = {
      beijing: {
        name: '北京',
        longitude: 116.4074,
        latitude: 39.9042,
        height: 50000
      },
      xian: {
        name: '西安',
        longitude: 108.9398,
        latitude: 34.3416,
        height: 50000
      }
    };

    const cityInfo = cities[city];
    if (!cityInfo) {
      console.error('未知城市:', city);
      return;
    }

    console.log(`✈️ 飞往${cityInfo.name}...`);

    // 调用Cesium的flyTo功能
    if (this.viewer) {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          cityInfo.longitude,
          cityInfo.latitude,
          cityInfo.height
        ),
        duration: 3.0,
        complete: () => {
          console.log(`✅ 已到达${cityInfo.name}`);
        }
      });
    } else {
      console.warn('⚠️ Viewer未初始化');
    }
  }

  flyToResearchArea(areaId) {
    // 调用研究区域图层的flyTo方法
    if (areaId === 'chuandian' && window.chuandianArea) {
      console.log('✈️ 飞往川滇地区研究区域...');
      window.chuandianArea.flyTo();
    } else {
      console.warn(`⚠️ 研究区域 ${areaId} 未找到`);
    }
  }

  setViewer(viewer) {
    this.viewer = viewer;
  }
}

// 全局实例
window.simpleToolbar = new SimpleToolbar();
