// 主加载控制器 - 协调加载动画和进度管理
class LoadingController {
  constructor() {
    this.loadingManager = null;
    this.geometryLoader = null;
    this.isInitialized = false;
    this.autoStartTimer = null;
    this.appStartTriggered = false;
  }

  // 初始化加载系统
  async init() {
    if (this.isInitialized) return;

    // 初始化加载动画系统

    try {
      // 创建加载进度管理器
      this.loadingManager = new LoadingManager();

      // 绑定进度事件
      this.loadingManager.onProgress = (progress) => this.updateProgress(progress);
      this.loadingManager.onStatusChange = (status) => this.updateStatus(status);
      this.loadingManager.onComplete = () => this.handleLoadComplete();

      // 几何动画加载器将在显示覆盖层时创建
      this.isInitialized = true;
      // 加载系统初始化完成

      // 自动开始加载序列
      this.startLoadingSequence();

    } catch (error) {
      console.error('Failed to initialize loading system:', error);
    }
  }

  // 开始加载序列
  startLoadingSequence() {
    if (!this.loadingManager) return;

    // 显示加载界面
    this.showLoadingOverlay();

    // 等待依赖库加载完成，然后触发应用启动
    this.waitForDependencies();
  }

  // 显示加载覆盖层
  showLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
      overlay.classList.remove('fade-out');

      // 几何动画已禁用（不再需要Three.js）
      // 使用CSS动画代替
    }
  }

  // 隐藏加载覆盖层
  hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      overlay.style.zIndex = '-1';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 800);
    }
  }

  // 更新进度条
  updateProgress(progress) {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${progress}%`;
    }
  }

  // 更新状态文字
  updateStatus(status) {
    const statusElement = document.querySelector('.loading-status');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.classList.add('updating');

      setTimeout(() => {
        statusElement.classList.remove('updating');
      }, 300);
    }
  }

  // 处理加载完成
  handleLoadComplete() {
    this.updateStatus('加载完成');

    setTimeout(() => {
      this.hideLoadingOverlay();

      // 几何动画已禁用

      // 触发应用启动事件
      this.triggerAppStart();
    }, 800);
  }

  // 等待依赖库加载完成
  waitForDependencies() {
    const checkInterval = 500; // 每500ms检查一次
    const maxWaitTime = 30000; // 最多等待30秒
    const startTime = Date.now();

    const checkDependencies = () => {
      const elapsed = Date.now() - startTime;

      // 检查各个依赖库的加载状态
      const cesiumLoaded = typeof Cesium !== 'undefined';
      const sgsLoaded = typeof SGSProvider !== 'undefined';
      const mapControlsLoaded = typeof window.MapControls !== 'undefined';

      console.log('📊 依赖检查:', {
        Cesium: cesiumLoaded ? '✅' : '⏳',
        SGS: sgsLoaded ? '✅' : '⏳',
        MapControls: mapControlsLoaded ? '✅' : '⏳',
        时间: `${(elapsed/1000).toFixed(1)}s`
      });

      // 更新加载状态
      if (!cesiumLoaded) {
        this.loadingManager?.updateTask('cesium', 30, '加载 Cesium 库...');
      } else if (!sgsLoaded) {
        this.loadingManager?.updateTask('cesium', 100);
        this.loadingManager?.updateTask('sgs', 30, '加载 SGS 库...');
      } else if (!mapControlsLoaded) {
        this.loadingManager?.updateTask('sgs', 60, '加载控制模块...');
      }

      // 如果所有依赖都加载完成，启动应用
      if (cesiumLoaded && sgsLoaded && mapControlsLoaded) {
        console.log('✅ 所有依赖已加载，启动应用...');
        this.triggerAppStart();
        return;
      }

      // 如果超时，强制启动
      if (elapsed > maxWaitTime) {
        console.warn('⚠️ 依赖加载超时，强制启动应用...');
        this.triggerAppStart();
        return;
      }

      // 继续等待
      setTimeout(checkDependencies, checkInterval);
    };

    // 立即开始检查
    checkDependencies();
  }

  // 触发应用启动
  triggerAppStart() {
    if (this.appStartTriggered) {
      return;
    }

    this.appStartTriggered = true;
    console.log('🚀 触发应用启动事件...');
    const event = new CustomEvent('loadingComplete');
    document.dispatchEvent(event);
  }

  // 跳过加载（用于开发调试）
  skipLoading() {
    if (this.loadingManager) {
      this.loadingManager.completeAll();
    }
  }

  // 重新开始加载
  restart() {
    if (this.loadingManager) {
      this.loadingManager.reset();
      this.startLoadingSequence();
    }
  }

  // 销毁加载系统
  destroy() {
    if (this.geometryLoader) {
      this.geometryLoader.destroy();
      this.geometryLoader = null;
    }

    if (this.autoStartTimer) {
      clearTimeout(this.autoStartTimer);
    }

    this.loadingManager = null;
    this.isInitialized = false;
  }
}

// 全局加载控制器实例
window.loadingController = new LoadingController();

// 立即显示加载界面（在DOM解析完成前）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoadingSystem);
} else {
  initLoadingSystem();
}

function initLoadingSystem() {
  // 确保loading overlay显示
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.classList.remove('fade-out');
  }

  // 立即初始化加载控制器
  window.loadingController.init();
}

// 键盘快捷键（开发用）
document.addEventListener('keydown', (event) => {
  // 按 ESC 跳过加载
  if (event.key === 'Escape' && window.loadingController) {
    console.log('Skipping loading sequence...');
    window.loadingController.skipLoading();
  }

  // 按 F5 重新开始加载
  if (event.key === 'F5' && window.loadingController) {
    event.preventDefault();
    console.log('Restarting loading sequence...');
    window.loadingController.restart();
  }
});