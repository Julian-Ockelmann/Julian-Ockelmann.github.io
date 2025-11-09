(function(){
  'use strict';

  // Find the header band container used by this theme
  const selectors = [
    '.page-cover', '.page-header', '.banner', '.post-cover',
    '.home-cover', '.cover', '.page-banner', '.site-cover', '.page-hero'
  ];
  let header = null;
  for (const s of selectors) { const el = document.querySelector(s); if (el) { header = el; break; } }
  if (!header) {
    // Fallback: create a simple header band below nav
    const after = document.querySelector('.site-header, header') || document.body.firstElementChild;
    const fake = document.createElement('section');
    fake.className = 'page-header';
    after && after.parentNode && after.parentNode.insertBefore(fake, after.nextSibling);
    header = fake;
  }
  header.style.position = 'relative';
  header.style.overflow = 'hidden';

  // Create canvas container
  const wrap = document.createElement('div');
  wrap.className = 'shader-hero-canvas';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  header.prepend(wrap);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    // graceful degrade: solid dark
    wrap.style.background = '#000';
    return;
  }

  // Vertex shader (full screen triangle)
  const vertSrc = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main(){
      v_uv = (a_pos + 1.0) * 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // Fragment shader — fleshpng-like starry/grain + RGB split + vignette + subtle drift
  const fragSrc = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_dpr;

    // hash / noise helpers
    float hash12(vec2 p){
      vec3 p3  = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash12(i);
      float b = hash12(i + vec2(1.0, 0.0));
      float c = hash12(i + vec2(0.0, 1.0));
      float d = hash12(i + vec2(1.0, 1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float s = 0.0, a = 0.5;
      for(int i=0;i<5;i++){
        s += a * noise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return s;
    }

    // Starfield: sparse bright points
    float stars(vec2 uv){
      vec2 g = fract(uv) - .5;
      vec2 id = floor(uv);
      float rnd = hash12(id);
      float d = length(g + (rnd - .5) * 0.3);
      float m = smoothstep(0.06, 0.0, d);
      m *= step(0.985, rnd); // density
      return m;
    }

    void main(){
      vec2 uv = v_uv;
      vec2 aspect = vec2(u_res.x/u_res.y, 1.0);
      vec2 p = (uv - 0.5) * aspect;

      // camera drift + mouse parallax
      vec2 drift = vec2(sin(u_time*0.07), cos(u_time*0.05)) * 0.02;
      vec2 par  = (u_mouse - 0.5) * 0.08;
      vec2 sceneUV = (uv + drift + par) * 3.0;

      // base star/dust field
      float dust = fbm(sceneUV * 1.2);
      float starA = stars(sceneUV * 2.5);
      float starB = stars(sceneUV * 1.7 + 10.0);
      float st = clamp(starA + starB, 0.0, 1.0);

      float grain = noise(uv * u_res * 0.6 + u_time * 60.0) * 0.25;

      // base luminance
      float lum = pow(dust, 1.6) * 0.35 + st * 1.2 + grain;

      // chromatic aberration (channel offsets)
      vec2 shift = (uv - 0.5) * 0.015;
      float r = lum * (0.85 + 0.15*sin(u_time*0.30));
      float g = lum;
      float b = lum * 0.95;

      // subtle channel shifts
      r *= 0.9 + 0.1*noise((uv+shift* 1.0)*u_res*0.15 + u_time);
      g *= 0.9 + 0.1*noise((uv+shift*-0.6)*u_res*0.15 + u_time*1.1);
      b *= 0.9 + 0.1*noise((uv+shift* 0.3)*u_res*0.15 + u_time*0.9);

      vec3 col = vec3(r,g,b);

      // vignette
      float v = smoothstep(0.95, 0.25, length(p));
      col *= v;

      // tone
      col = clamp(col, 0.0, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    console.error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  // Fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const verts = new Float32Array([
    -1,-1,  3,-1,  -1,3
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const u_res   = gl.getUniformLocation(prog, 'u_res');
  const u_time  = gl.getUniformLocation(prog, 'u_time');
  const u_mouse = gl.getUniformLocation(prog, 'u_mouse');
  const u_dpr   = gl.getUniformLocation(prog, 'u_dpr');

  let start = performance.now();
  let mouse = [0.5, 0.5];
  const pr = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = pr.matches;
  pr.addEventListener?.('change', e => reduced = e.matches);

  function onMouse(e){
    const rect = header.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouse[0] = Math.max(0, Math.min(1, x));
    mouse[1] = Math.max(0, Math.min(1, y));
  }
  header.addEventListener('mousemove', onMouse);
  header.addEventListener('mouseleave', () => { mouse = [0.5,0.5]; });

  function resize(){
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(header.clientWidth * ratio));
    const h = Math.max(1, Math.floor(Math.max(header.clientHeight, header.offsetHeight, 1) * ratio));
    canvas.width = w; canvas.height = h;
    canvas.style.width = header.clientWidth + 'px';
    canvas.style.height = Math.max(header.clientHeight, header.offsetHeight, 1) + 'px';
    gl.viewport(0,0,w,h);
    gl.uniform2f(u_res, w, h);
    gl.uniform1f(u_dpr, ratio);
  }
  new ResizeObserver(resize).observe(header);
  resize();

  function frame(){
    const t = (performance.now() - start) / 1000;
    gl.uniform1f(u_time, reduced ? 0.0 : t);
    gl.uniform2f(u_mouse, mouse[0], 1.0 - mouse[1]); // flip Y
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  frame();
})();