// 几何体动画库 - 炫酷科技感加载动画
class GeometryLoader {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.icosahedron = null;
    this.rings = [];
    this.animationId = null;
    this.particles = [];

    // 检查容器是否存在
    if (!this.container) {
      console.error(`❌ 找不到容器元素: ${containerId}`);
      return;
    }

    // 开始初始化几何动画
    this.init();
  }

  init() {
    // 检查THREE.js是否已加载
    if (typeof THREE === 'undefined') {
      // 等待THREE.js加载
      setTimeout(() => this.init(), 100);
      return;
    }

    // THREE.js已就绪，开始创建加载动画

    // 创建Three.js场景
    this.scene = new THREE.Scene();

    // 创建相机 - 针对新布局调整视角
    const animationHeight = window.innerHeight * 0.55; // 动画区域占55%高度
    const aspectRatio = window.innerWidth / animationHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, 4.8);  // 稍微远一点，给3D动画更多展示空间

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight * 0.55);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 设置canvas样式确保可见
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '100001';
    canvas.style.pointerEvents = 'none';

    this.container.appendChild(canvas);
    // Canvas已添加到容器

    // 创建几何体和光源
    this.createLights();
    this.createIcosahedron();
    this.createRings();
    this.createParticles();

    // 启动动画
    this.animate();

    // 窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize());

    // 加载动画场景已创建
  }

  createLights() {
    // 柔和的环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // 主光源 - 突出二十面体
    const mainLight = new THREE.DirectionalLight(0x0099ff, 1.2);
    mainLight.position.set(8, 8, 4);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // 填充光 - 减弱强度，避免过亮
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-3, -3, -3);
    this.scene.add(fillLight);

    // 中心点光源 - 增强内部发光，突出焦点
    const pointLight = new THREE.PointLight(0x00bbff, 1.0, 8);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  createIcosahedron() {
    // 二十面体几何 - 稍微放大一点，增强存在感
    const geometry = new THREE.IcosahedronGeometry(1.8, 1);

    // 主材质 - 更强的金属反射效果
    const mainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0099ff,  // 稍微调整颜色，更鲜明
      metalness: 0.9,   // 增强金属感
      roughness: 0.1,   // 更光滑
      transparent: true,
      opacity: 0.95,    // 稍微提高不透明度
      envMapIntensity: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05  // 更光滑的涂层
    });

    // 线框材质 - 更突出的边缘发光
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ddff,  // 稍微调整色彩
      wireframe: true,
      transparent: true,
      opacity: 0.8      // 增强线框可见度
    });

    // 创建主体
    this.icosahedron = new THREE.Mesh(geometry, mainMaterial);
    this.icosahedron.castShadow = true;
    this.icosahedron.receiveShadow = true;
    this.scene.add(this.icosahedron);

    // 创建线框覆盖层
    const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
    wireframe.scale.setScalar(1.01); // 略大一点，避免z-fighting
    this.icosahedron.add(wireframe);
  }

  createRings() {
    // 清空原有的rings数组
    this.rings = [];

    // 创建高级光环系统
    this.createEnergyRings();
    this.createNestedRings();
    this.createEnergyFlow();
  }

  createEnergyRings() {
    // 主能量环 - 断裂式六边形设计
    const segments = 6;  // 六边形
    const gapAngle = Math.PI / 3;  // 60度缺口

    for (let i = 0; i < segments; i++) {
      const startAngle = (i * Math.PI * 2 / segments);
      const endAngle = startAngle + (Math.PI * 2 / segments) - (gapAngle / segments);

      // 创建六边形环段
      const geometry = new THREE.RingGeometry(2.0, 2.4, 2, 1, startAngle, endAngle - startAngle);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const ringSegment = new THREE.Mesh(geometry, material);
      ringSegment.rotation.x = Math.PI / 2;

      // 添加发光边缘
      const edgeGeometry = new THREE.RingGeometry(2.35, 2.45, 2, 1, startAngle, endAngle - startAngle);
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const edgeRing = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edgeRing.rotation.x = Math.PI / 2;

      this.rings.push({ main: ringSegment, edge: edgeRing, type: 'energy' });
      this.scene.add(ringSegment);
      this.scene.add(edgeRing);
    }
  }

  createNestedRings() {
    // 内层细环
    const innerGeometry = new THREE.RingGeometry(1.5, 1.55, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0099ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
    innerRing.rotation.x = Math.PI / 2;

    // 外层细环
    const outerGeometry = new THREE.RingGeometry(2.8, 2.85, 32);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x4daaff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
    outerRing.rotation.x = Math.PI / 2;

    this.rings.push({ main: innerRing, type: 'inner' });
    this.rings.push({ main: outerRing, type: 'outer' });
    this.scene.add(innerRing);
    this.scene.add(outerRing);
  }

  createEnergyFlow() {
    // 能量流动粒子 - 在缺口处
    const flowParticles = [];
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x66ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const particle = new THREE.Mesh(geometry, material);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.2;

      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = 0;

      flowParticles.push({
        mesh: particle,
        angle: angle,
        baseRadius: radius,
        speed: 0.02 + Math.random() * 0.01
      });

      this.scene.add(particle);
    }

    this.energyFlow = flowParticles;
  }

  createParticles() {
    // 创建精致的环境粒子效果 - 更集中，不干扰UI
    const particleCount = 30;  // 减少数量
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      // 围绕中心区域分布，严格避免下半部分
      const radius = Math.random() * 6 + 2;  // 1.5-8范围，更集中
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() * 0.5 + 0.25) * Math.PI;  // 限制在中央区域

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = Math.max(radius * Math.cos(phi) * 0.3 - 1, -2);  // 严格控制Y轴，避免下方
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // 更慢的运动
      velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.005,  // 垂直运动更慢
        z: (Math.random() - 0.5) * 0.01
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00aaff,
      size: 0.05,  // 更小的粒子
      transparent: true,
      opacity: 0.4,  // 更透明
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData = { velocities };
    this.scene.add(this.particles);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    if (this.icosahedron) {
      // 二十面体多轴旋转
      this.icosahedron.rotation.x = time * 0.3;
      this.icosahedron.rotation.y = time * 0.5;
      this.icosahedron.rotation.z = time * 0.2;

      // 呼吸效果
      const scale = 1 + Math.sin(time * 2) * 0.05;
      this.icosahedron.scale.setScalar(scale);

      // 颜色变化
      const hue = (time * 0.1) % 1;
      const color = new THREE.Color().setHSL(hue * 0.3 + 0.5, 0.8, 0.6);
      this.icosahedron.material.color.copy(color);
    }

    // 高级光环系统动画
    this.rings.forEach((ring, index) => {
      if (ring.type === 'energy') {
        // 主能量环 - 脉冲旋转
        const pulseFactor = 1 + Math.sin(time * 3) * 0.1;
        ring.main.rotation.z += 0.015;
        ring.edge.rotation.z += 0.015;
        ring.main.scale.setScalar(pulseFactor);
        ring.edge.scale.setScalar(pulseFactor * 1.02);

        // 透明度脉冲
        ring.main.material.opacity = 0.6 + Math.sin(time * 2) * 0.2;
        ring.edge.material.opacity = 0.8 + Math.sin(time * 2.5) * 0.3;
      } else if (ring.type === 'inner') {
        // 内环 - 快速反向旋转
        ring.main.rotation.z -= 0.02;
        ring.main.material.opacity = 0.3 + Math.sin(time * 1.5) * 0.1;
      } else if (ring.type === 'outer') {
        // 外环 - 慢速正向旋转
        ring.main.rotation.z += 0.008;
        ring.main.material.opacity = 0.2 + Math.sin(time * 1.2) * 0.1;
      }
    });

    // 能量流动粒子动画
    if (this.energyFlow) {
      this.energyFlow.forEach((flow, index) => {
        flow.angle += flow.speed;
        const radius = flow.baseRadius + Math.sin(time * 2 + index) * 0.1;

        flow.mesh.position.x = Math.cos(flow.angle) * radius;
        flow.mesh.position.z = Math.sin(flow.angle) * radius;
        flow.mesh.position.y = Math.sin(time * 3 + index) * 0.1;

        // 粒子发光脉冲
        flow.mesh.material.opacity = 0.8 + Math.sin(time * 4 + index) * 0.3;

        // 尺寸脉冲
        const scale = 1 + Math.sin(time * 5 + index) * 0.5;
        flow.mesh.scale.setScalar(scale);
      });
    }

    // 粒子动画
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        positions[i] += velocities[index].x;
        positions[i + 1] += velocities[index].y;
        positions[i + 2] += velocities[index].z;

        // 边界检查，重新进入
        if (Math.abs(positions[i]) > 10) velocities[index].x *= -1;
        if (Math.abs(positions[i + 1]) > 10) velocities[index].y *= -1;
        if (Math.abs(positions[i + 2]) > 10) velocities[index].z *= -1;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const animationHeight = window.innerHeight * 0.55;
    this.camera.aspect = window.innerWidth / animationHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, animationHeight);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

    // 清理几何体和材质
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

// 导出类
window.GeometryLoader = GeometryLoader;