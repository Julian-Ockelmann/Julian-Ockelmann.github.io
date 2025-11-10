(function () {
  // Only run on the homepage
  if (!document.body.classList.contains('home')) return;

  var container = document.getElementById('shader-banner');
  var canvas = document.getElementById('webgl-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var uniforms = {
    resolution: { value: new THREE.Vector2(1, 1) },
    time:       { value: 0.0 },
    xScale:     { value: 1.0 },
    yScale:     { value: 0.55 },
    distortion: { value: 0.050 }
  };

  var vs = 'attribute vec3 position; void main(){ gl_Position = vec4(position,1.0); }';
  var fs = [
    'precision highp float;',
    'uniform vec2 resolution; uniform float time; uniform float xScale; uniform float yScale; uniform float distortion;',
    'void main(){',
    '  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);',
    '  float d = length(p) * distortion;',
    '  float rx = p.x * (1.0 + d);',
    '  float gx = p.x;',
    '  float bx = p.x * (1.0 - d);',
    '  float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);',
    '  float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);',
    '  float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);',
    '  gl_FragColor = vec4(r, g, b, 1.0);',
    '}'
  ].join('\n');

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -1,-1,0,  1,-1,0, -1, 1,0,
     1,-1,0, -1, 1,0,  1, 1,0
  ]), 3));

  var material = new THREE.RawShaderMaterial({
    vertexShader: vs,
    fragmentShader: fs,
    uniforms: uniforms,
    transparent: true
  });

  scene.add(new THREE.Mesh(geometry, material));

  function resize() {
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || Math.round(window.innerHeight * 0.46);
    renderer.setSize(w, h, false);
    uniforms.resolution.value.set(w, h);
  }
  resize();

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize, { passive: true });

  var clock = new THREE.Clock();
  function tick() {
    uniforms.time.value += clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
