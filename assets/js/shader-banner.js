// assets/js/shader-banner.js
class Stage {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderParam = {
      clearColor: 0x000000
    };

    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.isInitialized = false;
  }

  init() {
    this._setScene();
    this._setRender();
    this._setCamera();
    this.isInitialized = true;
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setRender() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(new THREE.Color(this.renderParam.clearColor));
    this._resizeRenderer();
  }

  _resizeRenderer() {
    // Match the CSS size of the canvas (hero section) and let DPR control the drawing buffer
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false); // keep CSS size; only update buffer size
  }

  _setCamera() {
    if (!this.isInitialized) {
      // Fullscreen quad with ortho camera
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    this._resizeRenderer();
    this.camera.updateProjectionMatrix();
  }

  get drawingBufferSize() {
    const c = this.renderer.domElement;
    return { width: c.width, height: c.height };
  }

  onResize() {
    this._setCamera();
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  onRaf() {
    this._render();
  }
}

class Mesh {
  constructor(stage) {
    this.stage = stage;
    this.mesh = null;

    this.uniforms = {
      resolution: { value: [1, 1] },
      time:       { value: 0.0 },
      xScale:     { value: 1.0 },
      yScale:     { value: 0.5 },
      distortion: { value: 0.050 }
    };
  }

  init() {
    this._setMesh();
    this._updateResolution();
    window.addEventListener('resize', () => this._updateResolution());
  }

  _setMesh() {
    const position = [
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0,  1.0, 0.0
    ];
    const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positions);

    const material = new THREE.RawShaderMaterial({
      vertexShader:   document.getElementById('js-vertex-shader').textContent,
      fragmentShader: document.getElementById('js-fragment-shader').textContent,
      uniforms: this.uniforms,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.stage.scene.add(this.mesh);
  }

  _updateResolution() {
    // Use the renderer's drawing buffer size (accounts for devicePixelRatio)
    const c = this.stage.renderer.domElement;
    this.uniforms.resolution.value = [c.width, c.height];
  }

  onRaf() {
    this.uniforms.time.value += 0.01;
  }
}

(() => {
  const stage = new Stage();
  stage.init();

  const mesh = new Mesh(stage);
  mesh.init();

  const onResize = () => stage.onResize();
  window.addEventListener('resize', onResize, { passive: true });

  const loop = () => {
    requestAnimationFrame(loop);
    stage.onRaf();
    mesh.onRaf();
  };
  loop();
})();
