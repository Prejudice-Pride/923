/**
 * 3D图层树管理器
 * 管理图层树的显示、交互和图层可见性控制
 */

class LayerTreeManager {
  constructor(viewer, layerInstances) {
    this.viewer = viewer;
    this.layerInstances = layerInstances; // 图层实例对象 {faultLayer: ..., generationLayer: ...}
    this.config = null;
    this.treeContainer = null;
    this.initialized = false;
  }

  /**
   * 初始化图层树管理器
   */
  async initialize(containerId = 'layer-tree-container') {
    try {
      console.log('🌲 初始化图层树管理器...');

      // 加载配置文件
      await this.loadConfig();

      // 获取容器
      this.treeContainer = document.getElementById(containerId);
      if (!this.treeContainer) {
        console.warn(`⚠️ 未找到图层树容器: ${containerId}`);
        return false;
      }

      // 生成图层树HTML
      this.renderTree();

      // 绑定事件
      this.bindEvents();

      this.initialized = true;
      console.log('✅ 图层树管理器初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 图层树管理器初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    try {
      const response = await fetch('/config/3d-layer-tree-config.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.config = await response.json();
      console.log('📋 图层树配置加载成功:', this.config);
    } catch (error) {
      console.error('❌ 加载图层树配置失败:', error);
      throw error;
    }
  }

  /**
   * 渲染图层树（使用原来的tree-simple样式）
   */
  renderTree() {
    if (!this.config || !this.treeContainer) return;

    let html = '<div class="tree-simple"><ul>';

    // 遍历图层组
    this.config.layerGroups.forEach((group, groupIndex) => {
      if (!group.enabled) return;

      const toggleId = `tree-group-${group.id}`;

      html += `
        <li>
          <input type="checkbox" class="tree-toggle-checkbox" id="${toggleId}" ${group.expanded ? 'checked' : ''}>
          <label for="${toggleId}" class="tree-item">
            <span class="tree-expand-icon"></span>
            <input type="checkbox" class="tree-checkbox tree-group-checkbox" data-group-id="${group.id}">
            <span class="tree-icon">${group.icon}</span>
            <span class="tree-label">${group.name}</span>
          </label>
          <ul class="tree-children">
      `;

      // 遍历图层
      group.layers.forEach(layer => {
        if (!layer.enabled) return;

        html += `
          <li>
            <div class="tree-item leaf" data-layer-id="${layer.id}">
              <span class="tree-expand-icon"></span>
              <input
                type="checkbox"
                class="tree-checkbox layer-checkbox"
                data-instance-key="${layer.instanceKey}"
                ${layer.defaultChecked ? 'checked' : ''}
              />
              <span class="tree-icon">${layer.icon}</span>
              <span class="tree-label">${layer.name}</span>
            </div>
          </li>
        `;
      });

      html += `
          </ul>
        </li>
      `;
    });

    html += '</ul></div>';

    this.treeContainer.innerHTML = html;
    console.log('🎨 图层树渲染完成');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.treeContainer) return;

    // 树形结构使用纯CSS控制展开/折叠，不需要JavaScript

    // 绑定图层组复选框事件（全选/全不选）
    const groupCheckboxes = this.treeContainer.querySelectorAll('.tree-group-checkbox');
    groupCheckboxes.forEach(groupCheckbox => {
      groupCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleGroupLayers(groupCheckbox);
      });
    });

    // 绑定图层复选框事件
    const layerCheckboxes = this.treeContainer.querySelectorAll('.layer-checkbox:not(.tree-group-checkbox)');
    layerCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        // 阻止事件冒泡，避免触发展开/折叠
        e.stopPropagation();
        this.toggleLayerVisibility(checkbox);
      });
    });

    console.log('🔗 图层树事件绑定完成');
  }

  /**
   * 切换分组下所有图层的可见性
   */
  toggleGroupLayers(groupCheckbox) {
    const groupId = groupCheckbox.dataset.groupId;
    const checked = groupCheckbox.checked;

    // 找到该分组
    const group = this.config.layerGroups.find(g => g.id === groupId);
    if (!group) return;

    // 切换分组下所有图层的复选框状态
    group.layers.forEach(layer => {
      const layerCheckbox = this.treeContainer.querySelector(`[data-instance-key="${layer.instanceKey}"]`);
      if (layerCheckbox && layerCheckbox.checked !== checked) {
        layerCheckbox.checked = checked;
        this.toggleLayerVisibility(layerCheckbox);
      }
    });

    console.log(`🔄 ${checked ? '显示' : '隐藏'}分组 ${group.name} 的所有图层`);
  }

  /**
   * 切换图层可见性
   */
  toggleLayerVisibility(checkbox) {
    const instanceKey = checkbox.dataset.instanceKey;
    const checked = checkbox.checked;

    console.log(`[LayerTree] toggleLayerVisibility 被调用:`, {
      instanceKey,
      checked,
      checkbox
    });

    // 获取图层实例
    const layerInstance = this.layerInstances[instanceKey];
    if (!layerInstance) {
      console.warn(`⚠️ 未找到图层实例: ${instanceKey}`);
      console.warn(`可用的图层实例:`, Object.keys(this.layerInstances));
      return;
    }

    console.log(`[LayerTree] 找到图层实例:`, layerInstance);

    // 调用图层的显示/隐藏方法
    if (checked) {
      if (typeof layerInstance.show === 'function') {
        console.log(`[LayerTree] 调用 ${instanceKey}.show()`);
        layerInstance.show();
      } else {
        console.log(`[LayerTree] 调用 ${instanceKey}.setVisible(true)`);
        layerInstance.setVisible(true);
      }
      console.log(`👁️ 显示图层: ${instanceKey}`);
    } else {
      if (typeof layerInstance.hide === 'function') {
        console.log(`[LayerTree] 调用 ${instanceKey}.hide()`);
        layerInstance.hide();
      } else {
        console.log(`[LayerTree] 调用 ${instanceKey}.setVisible(false)`);
        layerInstance.setVisible(false);
      }
      console.log(`🙈 隐藏图层: ${instanceKey}`);
    }
  }

  /**
   * 全选/全不选
   */
  toggleAllLayers(checked) {
    if (!this.treeContainer) return;

    const checkboxes = this.treeContainer.querySelectorAll('.layer-checkbox');
    checkboxes.forEach(checkbox => {
      if (checkbox.checked !== checked) {
        checkbox.checked = checked;
        this.toggleLayerVisibility(checkbox);
      }
    });

    console.log(`🔄 ${checked ? '全选' : '全不选'}图层`);
  }

  /**
   * 展开所有分组
   */
  expandAllGroups() {
    if (!this.treeContainer) return;

    const groupHeaders = this.treeContainer.querySelectorAll('.layer-group-header');
    groupHeaders.forEach(header => {
      if (header.dataset.expanded !== 'true') {
        this.toggleGroupExpand(header);
      }
    });

    console.log('📂 展开所有分组');
  }

  /**
   * 折叠所有分组
   */
  collapseAllGroups() {
    if (!this.treeContainer) return;

    const groupHeaders = this.treeContainer.querySelectorAll('.layer-group-header');
    groupHeaders.forEach(header => {
      if (header.dataset.expanded === 'true') {
        this.toggleGroupExpand(header);
      }
    });

    console.log('📁 折叠所有分组');
  }

  /**
   * 根据ID获取图层配置
   */
  getLayerConfig(layerId) {
    if (!this.config) return null;

    for (const group of this.config.layerGroups) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) return layer;
    }

    return null;
  }

  /**
   * 根据ID显示图层
   */
  showLayer(layerId) {
    const layerConfig = this.getLayerConfig(layerId);
    if (!layerConfig) {
      console.warn(`⚠️ 未找到图层配置: ${layerId}`);
      return;
    }

    const checkbox = this.treeContainer.querySelector(`[data-instance-key="${layerConfig.instanceKey}"]`);
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      this.toggleLayerVisibility(checkbox);
    }
  }

  /**
   * 根据ID隐藏图层
   */
  hideLayer(layerId) {
    const layerConfig = this.getLayerConfig(layerId);
    if (!layerConfig) {
      console.warn(`⚠️ 未找到图层配置: ${layerId}`);
      return;
    }

    const checkbox = this.treeContainer.querySelector(`[data-instance-key="${layerConfig.instanceKey}"]`);
    if (checkbox && checkbox.checked) {
      checkbox.checked = false;
      this.toggleLayerVisibility(checkbox);
    }
  }

  /**
   * 销毁图层树管理器
   */
  destroy() {
    if (this.treeContainer) {
      this.treeContainer.innerHTML = '';
    }
    this.config = null;
    this.initialized = false;
    console.log('🗑️ 图层树管理器已销毁');
  }
}

// 导出到全局
window.LayerTreeManager = LayerTreeManager;
