(function () {
  // Only run if the banner container exists
  var container = document.getElementById('shader-banner');
  var canvas = document.getElementById('webgl-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var uniforms = {
    resolution: { value: new THREE.Vector2() },
    time:       { value: 0.0 },
    xScale:     { value: 1.0 },
    yScale:     { value: 0.55 },
    distortion: { value: 0.050 }
  };

  var vs = 'attribute vec3 position; void main(){ gl_Position = vec4(position,1.0); }';
  var fs = [
    'precision highp float;',
    'uniform vec2 resolution; uniform float time;',
    'uniform float xScale; uniform float yScale; uniform float distortion;',
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
  ].join('');

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

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function resize() {
    // Size the canvas to the banner container
    var w = container.clientWidth || window.innerWidth || 1;
    var h = container.clientHeight || Math.round(window.innerHeight * 0.6) || 1;
    renderer.setSize(w, h, false);
    uniforms.resolution.value.set(w, h);
  }

  resize();
  if ('ResizeObserver' in window) {
    try { new ResizeObserver(resize).observe(container); } catch(e){ window.addEventListener('resize', resize); }
  } else {
    window.addEventListener('resize', resize);
  }

  var clock = new THREE.Clock();
  (function raf(){
    uniforms.time.value += clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(raf);
  })();
})();