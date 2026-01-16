'use client';

import { useEffect, useRef } from 'react';

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create WebGL context with proper type handling
    let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    const webgl2Context = canvas.getContext('webgl2', { 
      antialias: false, 
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false 
    });

    if (webgl2Context) {
      gl = webgl2Context;
    } else {
      gl = canvas.getContext('webgl', { 
        antialias: false, 
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false 
      }) as WebGLRenderingContext;
    }

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    
    // Get extensions with proper type handling
    const halfFloat = isWebGL2 ? 
      gl.getExtension('EXT_color_buffer_float') : 
      gl.getExtension('OES_texture_half_float');
    
    const supportLinearFiltering = isWebGL2 ?
      gl.getExtension('EXT_color_buffer_float') :
      gl.getExtension('OES_texture_half_float_linear');

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    
    resizeCanvas();

    // Configuration - optimized for performance
    const config = {
      SIM_RESOLUTION: isWebGL2 ? 256 : 128,
      DYE_RESOLUTION: isWebGL2 ? 2048 : 1024,
      DENSITY_DISSIPATION: 0.98,
      VELOCITY_DISSIPATION: 0.98,
      PRESSURE_DISSIPATION: 0.8,
      PRESSURE_ITERATIONS: 50,
      CURL: 30,
      SPLAT_RADIUS: 0.25,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 10,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true,
      PAUSED: false,  // Add PAUSED property
    };

    // Type assertion to avoid null checks
    const webgl = gl as WebGL2RenderingContext | WebGLRenderingContext;

    // Resolution calculation
    function getResolution(resolution: number) {
      const aspectRatio = webgl.drawingBufferWidth / webgl.drawingBufferHeight;
      if (aspectRatio < 1) {
        return {
          width: Math.round(resolution),
          height: Math.round(resolution / aspectRatio)
        };
      }
      return {
        width: Math.round(resolution * aspectRatio),
        height: Math.round(resolution)
      };
    }

    // Shader Programs
    class GLProgram {
      program: WebGLProgram;
      uniforms: { [key: string]: WebGLUniformLocation | null } = {};

      constructor(vertexShader: string, fragmentShader: string) {
        this.program = this.createProgram(vertexShader, fragmentShader);
        const uniformCount = webgl.getProgramParameter(this.program, webgl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const uniformInfo = webgl.getActiveUniform(this.program, i);
          if (uniformInfo) {
            this.uniforms[uniformInfo.name] = webgl.getUniformLocation(this.program, uniformInfo.name);
          }
        }
      }

      private createProgram(vertexShader: string, fragmentShader: string): WebGLProgram {
        const program = webgl.createProgram();
        if (!program) throw new Error('Failed to create program');
        
        webgl.attachShader(program, this.compileShader(webgl.VERTEX_SHADER, vertexShader));
        webgl.attachShader(program, this.compileShader(webgl.FRAGMENT_SHADER, fragmentShader));
        webgl.linkProgram(program);
        
        if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
          throw new Error('Program link failed: ' + webgl.getProgramInfoLog(program));
        }
        return program;
      }

      private compileShader(type: number, source: string): WebGLShader {
        const shader = webgl.createShader(type);
        if (!shader) throw new Error('Failed to create shader');
        
        webgl.shaderSource(shader, source);
        webgl.compileShader(shader);
        
        if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
          throw new Error('Shader compile failed: ' + webgl.getShaderInfoLog(shader));
        }
        return shader;
      }

      bind() {
        webgl.useProgram(this.program);
      }
    }

    // Vertex shader
    const baseVertexShader = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Display shader with improved visuals
    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float uTime;
      
      void main() {
        vec3 color = texture2D(uTexture, vUv).rgb;
        
        // Enhanced color grading
        float brightness = 1.2;
        float contrast = 1.1;
        float saturation = 1.3;
        
        // Apply contrast
        color = (color - 0.5) * contrast + 0.5;
        
        // Apply brightness
        color *= brightness;
        
        // Apply saturation
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(vec3(luminance), color, saturation);
        
        // Vignette effect
        vec2 uv = vUv * (1.0 - vUv.yx);
        float vig = uv.x * uv.y * 15.0;
        vig = pow(vig, 0.25);
        color *= vig;
        
        // Subtle pulsing
        float pulse = sin(uTime * 0.5) * 0.02 + 1.0;
        color *= pulse;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Other shaders (unchanged but included for completeness)
    const splatShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    const advectionShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main() {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
      }
    `;

    const divergenceShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main() {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const curlShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main() {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;

    const vorticityShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main() {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `;

    const pressureShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;

    const gradientSubtractShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    const clearShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main() {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `;

    // Create buffer for full-screen quad
    const vertexBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), webgl.STATIC_DRAW);
    
    const indexBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), webgl.STATIC_DRAW);

    // Blit function for rendering
    const blit = (framebuffer: WebGLFramebuffer | null) => {
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, framebuffer);
      webgl.drawElements(webgl.TRIANGLES, 6, webgl.UNSIGNED_SHORT, 0);
    };

    // FBO creation
    interface FBO {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      attach: (id: number) => number;
    }

    interface DoubleFBO {
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      read: FBO;
      write: FBO;
      swap: () => void;
    }

    function createFBO(width: number, height: number, internalFormat: number, format: number, type: number, param: number): FBO {
      webgl.activeTexture(webgl.TEXTURE0);
      const texture = webgl.createTexture();
      if (!texture) throw new Error('Failed to create texture');
      
      webgl.bindTexture(webgl.TEXTURE_2D, texture);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, param);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, param);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
      webgl.texImage2D(webgl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

      const fbo = webgl.createFramebuffer();
      if (!fbo) throw new Error('Failed to create framebuffer');
      
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, fbo);
      webgl.framebufferTexture2D(webgl.FRAMEBUFFER, webgl.COLOR_ATTACHMENT0, webgl.TEXTURE_2D, texture, 0);
      webgl.viewport(0, 0, width, height);
      webgl.clear(webgl.COLOR_BUFFER_BIT);

      return {
        texture,
        fbo,
        width,
        height,
        attach(id: number) {
          webgl.activeTexture(webgl.TEXTURE0 + id);
          webgl.bindTexture(webgl.TEXTURE_2D, texture);
          return id;
        }
      };
    }

    function createDoubleFBO(width: number, height: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO {
      let fbo1 = createFBO(width, height, internalFormat, format, type, param);
      let fbo2 = createFBO(width, height, internalFormat, format, type, param);

      return {
        width,
        height,
        texelSizeX: 1.0 / width,
        texelSizeY: 1.0 / height,
        get read() {
          return fbo1;
        },
        set read(value) {
          fbo1 = value;
        },
        get write() {
          return fbo2;
        },
        set write(value) {
          fbo2 = value;
        },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        }
      };
    }

    function resizeFBO(fbo: FBO, width: number, height: number, internalFormat: number, format: number, type: number, param: number) {
      webgl.bindTexture(webgl.TEXTURE_2D, fbo.texture);
      webgl.texImage2D(webgl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
      fbo.width = width;
      fbo.height = height;
    }

    function resizeDoubleFBO(target: DoubleFBO, width: number, height: number, internalFormat: number, format: number, type: number, param: number) {
      target.width = width;
      target.height = height;
      target.texelSizeX = 1.0 / width;
      target.texelSizeY = 1.0 / height;
      resizeFBO(target.read, width, height, internalFormat, format, type, param);
      resizeFBO(target.write, width, height, internalFormat, format, type, param);
    }

    // Initialize programs
    const displayProgram = new GLProgram(baseVertexShader, displayShaderSource);
    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, advectionShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);
    const clearProgram = new GLProgram(baseVertexShader, clearShader);

    // Create framebuffers
    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let curl: FBO;
    let pressure: DoubleFBO;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      
      // Handle texture types for WebGL1 vs WebGL2
      let texType: number;
      let internalFormat: number;
      
      if (isWebGL2) {
        texType = halfFloat ? (webgl as WebGL2RenderingContext).HALF_FLOAT : webgl.FLOAT;
        internalFormat = halfFloat ? (webgl as WebGL2RenderingContext).RGBA16F : webgl.RGBA;
      } else {
        texType = halfFloat ? (halfFloat as any).HALF_FLOAT_OES : webgl.UNSIGNED_BYTE;
        internalFormat = webgl.RGBA;
      }
      
      const filtering = supportLinearFiltering ? webgl.LINEAR : webgl.NEAREST;

      if (!dye) {
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, internalFormat, webgl.RGBA, texType, filtering);
      } else {
        resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, internalFormat, webgl.RGBA, texType, filtering);
      }

      if (!velocity) {
        velocity = createDoubleFBO(simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, filtering);
      } else {
        resizeDoubleFBO(velocity, simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, filtering);
      }

      if (!divergence) {
        divergence = createFBO(simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      } else {
        resizeFBO(divergence, simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      }

      if (!curl) {
        curl = createFBO(simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      } else {
        resizeFBO(curl, simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      }

      if (!pressure) {
        pressure = createDoubleFBO(simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      } else {
        resizeDoubleFBO(pressure, simRes.width, simRes.height, internalFormat, webgl.RGBA, texType, webgl.NEAREST);
      }
    }

    initFramebuffers();

    // Pointer interface
    interface Pointer {
      id: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
      down: boolean;
      moved: boolean;
      color: [number, number, number];
    }

    const pointers: Pointer[] = [];
    let nextColorIndex = 0;
    const colors: [number, number, number][] = [
      [0.8, 0.2, 0.8],  // Purple
      [0.2, 0.8, 0.8],  // Cyan
      [0.8, 0.8, 0.2],  // Yellow
      [0.2, 0.2, 0.8],  // Blue
      [0.8, 0.2, 0.2],  // Red
      [0.2, 0.8, 0.2],  // Green
    ];

    function addPointer(x: number, y: number, id = 0): Pointer {
      const pointer: Pointer = {
        id,
        x,
        y,
        dx: 0,
        dy: 0,
        down: true,
        moved: false,
        color: colors[nextColorIndex % colors.length]
      };
      nextColorIndex++;
      pointers.push(pointer);
      return pointer;
    }

    function updatePointer(id: number, x: number, y: number) {
      const pointer = pointers.find(p => p.id === id);
      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        pointer.dx = dx;
        pointer.dy = dy;
        pointer.moved = Math.abs(dx) > 0 || Math.abs(dy) > 0;
        pointer.x = x;
        pointer.y = y;
      }
    }

    function removePointer(id: number) {
      const index = pointers.findIndex(p => p.id === id);
      if (index > -1) {
        pointers.splice(index, 1);
      }
    }

    // Splat function
    function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
      if (!canvas) return;
      
      // Apply splat to velocity
      webgl.viewport(0, 0, velocity.width, velocity.height);
      splatProgram.bind();
      webgl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      webgl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      webgl.uniform2f(splatProgram.uniforms.point, x, y);
      webgl.uniform3f(splatProgram.uniforms.color, dx * config.SPLAT_FORCE, dy * config.SPLAT_FORCE, 1.0);
      webgl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100.0);
      
      webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
      const positionLocation = webgl.getAttribLocation(splatProgram.program, 'aPosition');
      webgl.enableVertexAttribArray(positionLocation);
      webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);
      
      blit(velocity.write.fbo);
      velocity.swap();

      // Apply splat to dye
      webgl.viewport(0, 0, dye.width, dye.height);
      webgl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      webgl.uniform3f(splatProgram.uniforms.color, ...color);
      blit(dye.write.fbo);
      dye.swap();
    }

    // Simulation step
    let lastTime = 0;
    function step(time: number) {
      const dt = Math.min((time - lastTime) / 1000, 0.016);
      lastTime = time;

      if (config.PAUSED) return;

      // Curl
      webgl.viewport(0, 0, velocity.width, velocity.height);
      curlProgram.bind();
      webgl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl.fbo);

      // Vorticity
      vorticityProgram.bind();
      webgl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      webgl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      webgl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      webgl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write.fbo);
      velocity.swap();

      // Divergence
      divergenceProgram.bind();
      webgl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence.fbo);

      // Clear pressure
      clearProgram.bind();
      webgl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      webgl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
      blit(pressure.write.fbo);
      pressure.swap();

      // Pressure
      pressureProgram.bind();
      webgl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        webgl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write.fbo);
        pressure.swap();
      }

      // Gradient subtract
      gradienSubtractProgram.bind();
      webgl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      webgl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write.fbo);
      velocity.swap();

      // Advection - velocity
      advectionProgram.bind();
      webgl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      webgl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      webgl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0));
      webgl.uniform1f(advectionProgram.uniforms.dt, dt);
      webgl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write.fbo);
      velocity.swap();

      // Advection - dye
      webgl.viewport(0, 0, dye.width, dye.height);
      webgl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      webgl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      webgl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      webgl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write.fbo);
      dye.swap();
    }

    // Render function
    function render(time: number) {
      // Update pointers
      pointers.forEach(pointer => {
        if (pointer.down && pointer.moved) {
          splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
          pointer.moved = false;
        }
      });

      // Step simulation
      step(time);

      // Render to screen
      webgl.viewport(0, 0, webgl.drawingBufferWidth, webgl.drawingBufferHeight);
      displayProgram.bind();
      webgl.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
      webgl.uniform1f(displayProgram.uniforms.uTime, time * 0.001);
      
      webgl.enable(webgl.BLEND);
      webgl.blendFunc(webgl.SRC_ALPHA, webgl.ONE_MINUS_SRC_ALPHA);
      
      // Bind vertex buffer for display
      webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
      const positionLocation = webgl.getAttribLocation(displayProgram.program, 'aPosition');
      webgl.enableVertexAttribArray(positionLocation);
      webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);
      
      blit(null);

      requestAnimationFrame(render);
    }

    // Event handlers
    function getCanvasPosition(clientX: number, clientY: number): [number, number] {
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / canvas.width;
      const y = 1.0 - (clientY - rect.top) / canvas.height; // Flip Y
      return [x, y];
    }

    const handleMouseDown = (e: MouseEvent) => {
      const [x, y] = getCanvasPosition(e.clientX, e.clientY);
      addPointer(x, y, 0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const [x, y] = getCanvasPosition(e.clientX, e.clientY);
      updatePointer(0, x, y);
    };

    const handleMouseUp = () => {
      removePointer(0);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.changedTouches);
      touches.forEach(touch => {
        const [x, y] = getCanvasPosition(touch.clientX, touch.clientY);
        addPointer(x, y, touch.identifier);
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.touches);
      touches.forEach(touch => {
        const [x, y] = getCanvasPosition(touch.clientX, touch.clientY);
        updatePointer(touch.identifier, x, y);
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.changedTouches);
      touches.forEach(touch => {
        removePointer(touch.identifier);
      });
    };

    // Add auto-splat for demo effect
    let autoSplatInterval: NodeJS.Timeout;
    if (typeof window !== 'undefined') {
      autoSplatInterval = setInterval(() => {
        if (pointers.length === 0 && !config.PAUSED) {
          const x = 0.5 + Math.sin(Date.now() * 0.001) * 0.4;
          const y = 0.5 + Math.cos(Date.now() * 0.001) * 0.4;
          const color = colors[Math.floor(Math.random() * colors.length)];
          splat(x, y, Math.random() - 0.5, Math.random() - 0.5, color);
        }
      }, 2000);
    }

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    const handleResize = () => {
      resizeCanvas();
      initFramebuffers();
    };

    window.addEventListener('resize', handleResize);

    // Start animation
    requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (autoSplatInterval) {
        clearInterval(autoSplatInterval);
      }
      
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{
        background: '#000000',
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'all'
      }}
    />
  );
}