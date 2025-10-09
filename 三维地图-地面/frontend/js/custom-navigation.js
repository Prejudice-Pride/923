// 自定义导航控件
(function() {
  'use strict';

  const CustomNavigation = {
    viewer: null,

    init: function(viewer) {
      this.viewer = viewer;
      this.createNavigationUI();
      this.bindEvents();
    },

    createNavigationUI: function() {
      const navHTML = `
        <div class="custom-navigation">
          <!-- Home按钮 -->
          <button class="nav-btn" id="navHome" title="回到初始视角">
            <svg viewBox="0 0 24 24">
              <path d="M12,3L4,9V21H9V14H15V21H20V9L12,3Z" fill="currentColor"/>
            </svg>
          </button>

          <!-- 放大按钮 - 粗线条 -->
          <button class="nav-btn" id="navZoomIn" title="放大">
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 缩小按钮 - 粗线条 -->
          <button class="nav-btn" id="navZoomOut" title="缩小">
            <svg viewBox="0 0 24 24">
              <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 全屏按钮 -->
          <button class="nav-btn" id="navFullscreen" title="全屏/退出全屏">
            <svg viewBox="0 0 24 24">
              <path d="M4,4 L4,9 L6,9 L6,6 L9,6 L9,4 Z M20,4 L15,4 L15,6 L18,6 L18,9 L20,9 Z M20,20 L20,15 L18,15 L18,18 L15,18 L15,20 Z M4,20 L9,20 L9,18 L6,18 L6,15 L4,15 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </button>

          <!-- 帮助按钮 -->
          <button class="nav-btn help-btn" id="navHelp" title="帮助">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
              <text x="12" y="17.5" text-anchor="middle" font-size="15" font-weight="600" fill="currentColor">?</text>
            </svg>
          </button>

          <!-- 底图选择按钮 -->
          <button class="nav-btn" id="navBasemap" title="坐标系选择">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2"/>
              <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>

          <!-- 底图弹出菜单 -->
          <div class="basemap-popup" id="basemapPopup">
            <!-- 平面坐标 - 2.5D斜视角网格 -->
            <button class="basemap-btn" id="basemapFlat" title="平面坐标系" data-mode="flat">
              <svg viewBox="0 0 24 24">
                <!-- 2.5D透视网格 -->
                <g transform="translate(12, 12) skewY(-15) scale(0.9)">
                  <!-- 水平线 -->
                  <line x1="-10" y1="-8" x2="10" y2="-8" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                  <line x1="-10" y1="-4" x2="10" y2="-4" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="currentColor" stroke-width="1.4" opacity="1"/>
                  <line x1="-10" y1="4" x2="10" y2="4" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
                  <line x1="-10" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
                  <!-- 垂直线 -->
                  <line x1="-8" y1="-10" x2="-8" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
                  <line x1="-4" y1="-10" x2="-4" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                  <line x1="0" y1="-10" x2="0" y2="10" stroke="currentColor" stroke-width="1.4" opacity="1"/>
                  <line x1="4" y1="-10" x2="4" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                  <line x1="8" y1="-10" x2="8" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>
                </g>
              </svg>
              <span>平面</span>
            </button>

            <!-- 球面坐标 - 精细经纬网地球 -->
            <button class="basemap-btn active" id="basemapGlobe" title="球面坐标系" data-mode="globe">
              <svg viewBox="0 0 24 24">
                <!-- 外圈 -->
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <!-- 赤道 -->
                <ellipse cx="12" cy="12" rx="10" ry="3" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                <!-- 经线 -->
                <ellipse cx="12" cy="12" rx="3" ry="10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.85"/>
                <ellipse cx="12" cy="12" rx="6" ry="10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.85"/>
                <!-- 纬线 -->
                <ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.75"/>
                <ellipse cx="12" cy="12" rx="10" ry="8" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.65"/>
                <!-- 中心经线强调 -->
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.2" opacity="0.9"/>
              </svg>
              <span>球面</span>
            </button>
          </div>
        </div>
      `;

      // 添加到页面
      const container = document.getElementById('cesiumContainer');
      const navElement = document.createElement('div');
      navElement.innerHTML = navHTML;
      container.appendChild(navElement.firstElementChild);
    },

    bindEvents: function() {
      const self = this;

      // Home按钮
      document.getElementById('navHome').addEventListener('click', function() {
        self.viewer.camera.flyHome(1);
      });

      // 放大按钮
      document.getElementById('navZoomIn').addEventListener('click', function() {
        const camera = self.viewer.camera;
        camera.zoomIn(camera.positionCartographic.height * 0.5);
      });

      // 缩小按钮
      document.getElementById('navZoomOut').addEventListener('click', function() {
        const camera = self.viewer.camera;
        camera.zoomOut(camera.positionCartographic.height * 0.5);
      });

      // 全屏按钮
      document.getElementById('navFullscreen').addEventListener('click', function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });

      // 帮助按钮
      document.getElementById('navHelp').addEventListener('click', function() {
        alert('导航帮助:\n\n左键拖动 - 旋转视图\n右键拖动 - 平移视图\n滚轮 - 缩放\n中键拖动 - 倾斜视图');
      });

      // 底图选择按钮 - 切换弹出菜单
      const basemapPopup = document.getElementById('basemapPopup');
      document.getElementById('navBasemap').addEventListener('click', function(e) {
        e.stopPropagation();
        basemapPopup.classList.toggle('show');
      });

      // 点击页面其他地方关闭弹出菜单
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-navigation')) {
          basemapPopup.classList.remove('show');
        }
      });

      // 底图选择按钮 - 切换底图
      const basemapButtons = document.querySelectorAll('.basemap-btn');
      basemapButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();

          // 移除所有active类
          basemapButtons.forEach(b => b.classList.remove('active'));
          // 添加当前按钮的active类
          this.classList.add('active');

          const mode = this.dataset.mode;
          console.log('切换底图模式:', mode);

          // 关闭弹出菜单
          basemapPopup.classList.remove('show');

          // TODO: 实现不同底图模式的切换逻辑
          if (mode === 'flat') {
            console.log('切换到平面坐标模式');
          } else if (mode === 'globe') {
            console.log('切换到球面坐标模式');
          }
        });
      });
    }
  };

  // 导出到全局
  window.CustomNavigation = CustomNavigation;
  console.log('✅ 自定义导航控件已加载');
})();
