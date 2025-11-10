// Shader banner confined to the theme's page banner (home page only)
(function () {
  // Add a 'home' class to <body> when we're at the root (defensive)
  var isHome = location.pathname === '/' || /\/index\.(html|htm)?$/.test(location.pathname);
  if (isHome && !document.body.classList.contains('home')) {
    document.body.classList.add('home');
  }
  if (!document.body.classList.contains('home')) return;

  // Find the page banner
  var banner = document.querySelector('.page-banner');
  if (!banner) return;

  // Ensure a shader container exists inside the banner
  var shell = banner.querySelector('.shader-banner');
  if (!shell) {
    shell = document.createElement('div');
    shell.className = 'shader-banner';
    shell.innerHTML = '<canvas id="webgl-banner"></canvas>';
    // Insert as first child of the inner so text stays above
    var inner = banner.querySelector('.page-banner-inner') || banner;
    inner.insertBefore(shell, inner.firstChild);
  }
  var canvas = shell.querySelector('canvas');

  // Load three.js if not already present, then boot
  function ensureThree(cb) {
    if (window.THREE) return cb();
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/three@0.157.0/build/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  // Shader code
  var VS = 'attribute vec3 position;void main(){gl_Position=vec4(position,1.0);}';
  var FS = [
    'precision highp float;',
    'uniform vec2  resolution;',
    'uniform float time;',
    'uniform float xScale;',
    'uniform float yScale;',
    'uniform float distortion;',
    'void main(){',
    '  vec2 p=(gl_FragCoord.xy*2.0-resolution)/min(resolution.x,resolution.y);',
    '  float d=length(p)*distortion;',
    '  float rx=p.x*(1.0+d);',
    '  float gx=p.x;',
    '  float bx=p.x*(1.0-d);',
    '  float r=0.05/abs(p.y+sin((rx+time)*xScale)*yScale);',
    '  float g=0.05/abs(p.y+sin((gx+time)*xScale)*yScale);',
    '  float b=0.05/abs(p.y+sin((bx+time)*xScale)*yScale);',
    '  gl_FragColor=vec4(r,g,b,1.0);',
    '}'
  ].join('');

  function boot() {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var uniforms = {
      resolution: { value: new THREE.Vector2(1, 1) },
      time:       { value: 0.0 },
      xScale:     { value: 1.15 },
      yScale:     { value: 0.55 },
      distortion: { value: 0.050 }
    };

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      -1,-1,0,  1,-1,0, -1, 1,0,
       1,-1,0,  1, 1,0, -1, 1,0
    ]), 3));

    var mat = new THREE.RawShaderMaterial({
      vertexShader: VS, fragmentShader: FS, uniforms: uniforms, transparent: true
    });

    var mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    function sizeToBanner() {
      var rect = banner.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      // account for device pixel ratio to keep it crisp
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(w, h, false);
      uniforms.resolution.value.set(w * dpr, h * dpr);
    }

    function render() {
      uniforms.time.value += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    sizeToBanner();
    render();

    // Keep in sync with layout changes
    var ro = window.ResizeObserver ? new ResizeObserver(sizeToBanner) : null;
    if (ro) {
      ro.observe(banner);
    } else {
      window.addEventListener('resize', sizeToBanner, { passive: true });
    }
  }

  ensureThree(boot);
})();