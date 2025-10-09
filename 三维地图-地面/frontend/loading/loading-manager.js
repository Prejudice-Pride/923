// 加载进度管理器 - 管理各种资源的加载状态和进度
class LoadingManager {
  constructor() {
    this.tasks = new Map();
    this.totalProgress = 0;
    this.currentStatus = '初始化应用...';
    this.isComplete = false;

    // 回调函数
    this.onProgress = null;
    this.onStatusChange = null;
    this.onComplete = null;

    // 预定义的加载任务
    this.taskDefinitions = [
      { id: 'cesium', name: '加载 Cesium 库', weight: 20 },
      { id: 'sgs', name: '连接 SGS 服务器', weight: 20 },
      { id: 'terrain', name: '加载地形数据', weight: 25 },
      { id: 'imagery', name: '加载影像数据', weight: 25 },
      { id: 'scene', name: '初始化场景', weight: 10 }
    ];

    this.initializeTasks();
  }

  initializeTasks() {
    this.taskDefinitions.forEach(task => {
      this.tasks.set(task.id, {
        name: task.name,
        weight: task.weight,
        progress: 0,
        status: 'pending'
      });
    });
  }

  // 更新任务进度
  updateTask(taskId, progress, status = null) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Unknown task: ${taskId}`);
      return;
    }

    task.progress = Math.min(100, Math.max(0, progress));
    if (status) {
      task.status = status;
      this.currentStatus = task.name;
      this.triggerStatusChange();
    }

    this.calculateTotalProgress();
  }

  // 完成任务
  completeTask(taskId, finalStatus = null) {
    this.updateTask(taskId, 100, finalStatus || `${this.tasks.get(taskId)?.name}完成`);
  }

  // 计算总进度
  calculateTotalProgress() {
    let weightedProgress = 0;
    let totalWeight = 0;

    this.tasks.forEach(task => {
      weightedProgress += (task.progress / 100) * task.weight;
      totalWeight += task.weight;
    });

    this.totalProgress = Math.round((weightedProgress / totalWeight) * 100);
    this.triggerProgress();

    // 检查是否全部完成
    if (this.totalProgress >= 100 && !this.isComplete) {
      this.isComplete = true;
      this.currentStatus = '加载完成';
      this.triggerComplete();
    }
  }

  // 模拟任务进度（用于演示或测试）
  simulateProgress(taskId, duration = 2000) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const startTime = Date.now();
    const startProgress = task.progress;
    const targetProgress = 100;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(targetProgress, startProgress + (elapsed / duration) * (targetProgress - startProgress));

      this.updateTask(taskId, progress);

      if (progress < targetProgress && elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        this.completeTask(taskId);
      }
    };

    // 开始任务
    this.updateTask(taskId, startProgress, task.name);
    animate();
  }

  // 快速完成所有任务（用于跳过加载）
  completeAll() {
    this.tasks.forEach((task, taskId) => {
      this.completeTask(taskId);
    });
  }

  // 重置管理器
  reset() {
    this.isComplete = false;
    this.totalProgress = 0;
    this.currentStatus = '初始化应用...';
    this.initializeTasks();
  }

  // 事件触发器
  triggerProgress() {
    if (this.onProgress) {
      this.onProgress(this.totalProgress);
    }
  }

  triggerStatusChange() {
    if (this.onStatusChange) {
      this.onStatusChange(this.currentStatus);
    }
  }

  triggerComplete() {
    if (this.onComplete) {
      this.onComplete();
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      progress: this.totalProgress,
      status: this.currentStatus,
      isComplete: this.isComplete,
      tasks: Array.from(this.tasks.entries()).map(([id, task]) => ({
        id,
        ...task
      }))
    };
  }
}

// 导出类
window.LoadingManager = LoadingManager;