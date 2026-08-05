'use client';

import { useEffect, useRef, useState } from 'react';

export function WebGLHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reduceMotion || webglError || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!gl) { setWebglError(true); return; }
    if (gl.isContextLost()) { setWebglError(true); return; }

    // --- Shaders (GLSL ES 3.00 — WebGL2) ---
    const vsSource = `#version 300 es
      in vec2 aPos;
      in float aSize;
      in float aColorOffset;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uDPR;
      out float vColorOffset;
      out float vAlpha;
      void main() {
        vec2 pos = aPos;
        // Parallax suave por mouse
        pos += (uMouse - 0.5) * 0.02;
        // Respiración vertical sutil
        pos.y += sin(uTime * 0.5 + aColorOffset * 6.28) * 0.015;
        gl_Position = vec4(pos, 0.0, 1.0);
        gl_PointSize = aSize * uDPR * (1.0 + sin(uTime * 0.3 + aColorOffset * 6.28) * 0.15);
        vColorOffset = aColorOffset;
        vAlpha = 0.6 + 0.4 * sin(uTime * 0.4 + aColorOffset * 6.28);
      }
    `;
    const fsSource = `#version 300 es
      precision highp float;
      in float vColorOffset;
      in float vAlpha;
      out vec4 outColor;
      // Paleta dorada/madera: --gold-300 #A68C59, --gold-400 #9C7E3F, --wood-600 #6B4A35
      vec3 palette(float t) {
        vec3 gold3 = vec3(0.65, 0.55, 0.35);   // #A68C59
        vec3 gold4 = vec3(0.61, 0.49, 0.25);   // #9C7E3F
        vec3 wood6 = vec3(0.42, 0.29, 0.21);   // #6B4A35
        float s = sin(t * 6.28);
        return mix(mix(gold3, gold4, s * 0.5 + 0.5), wood6, max(0.0, s * 0.3));
      }
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        // Glow radial suave
        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        if (alpha < 0.01) discard;
        vec3 color = palette(vColorOffset);
        outColor = vec4(color, alpha);
      }
    `;

    // Todo el setup corre en try/catch: si algo falla → fallback CSS, nunca throw.
    let cleanup: (() => void) | undefined;
    try {
      const compileShader = (src: string, type: number) => {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error');
        }
        return shader;
      };

      const vs = compileShader(vsSource, gl.VERTEX_SHADER);
      const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
      }
      gl.useProgram(program);

      // --- Buffers: 200 partículas ---
      const COUNT = 200;
      const positions = new Float32Array(COUNT * 2);
      const sizes = new Float32Array(COUNT);
      const colorOffsets = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 2] = (Math.random() - 0.5) * 2.0;
        positions[i * 2 + 1] = (Math.random() - 0.5) * 2.0;
        sizes[i] = 2.0 + Math.random() * 3.0;
        colorOffsets[i] = Math.random();
      }

      // Regla C6 (PoC 3.1): nunca habilitar un attribute sin buffer ligado.
      // getAttribLocation devuelve -1 si el compilador descarta el atributo;
      // habilitar -1 deja un array enabled sin buffer → INVALID_OPERATION en drawArrays.
      const setupAttrib = (
        buffer: WebGLBuffer,
        data: Float32Array,
        size: number,
        name: string,
      ) => {
        const loc = gl.getAttribLocation(program, name);
        if (loc < 0) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      };

      setupAttrib(gl.createBuffer()!, positions, 2, 'aPos');
      setupAttrib(gl.createBuffer()!, sizes, 1, 'aSize');
      setupAttrib(gl.createBuffer()!, colorOffsets, 1, 'aColorOffset');

      // --- Uniforms ---
      const uTime = gl.getUniformLocation(program, 'uTime')!;
      const uMouse = gl.getUniformLocation(program, 'uMouse')!;
      const uDPR = gl.getUniformLocation(program, 'uDPR')!;

      // --- Mouse / Gyro ---
      const mouse = { x: 0.5, y: 0.5 };
      const onMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      };
      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.gamma !== null && e.beta !== null) {
          mouse.x = 0.5 + (e.gamma || 0) / 90 * 0.15;
          mouse.y = 0.5 + (e.beta || 0) / 90 * 0.15;
        }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('deviceorientation', onOrient);

      // --- Resize + DPR ---
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 1.5);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      // --- IntersectionObserver: pausa off-screen ---
      let rafId: number;
      const animate = (now: number) => {
        const t = (now - startTime) * 0.001;
        gl.uniform1f(uTime, t);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uDPR, Math.min(window.devicePixelRatio, 1.5));
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, COUNT);
        rafId = requestAnimationFrame(animate);
      };
      const startTime = performance.now();
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) rafId = requestAnimationFrame(animate);
        else cancelAnimationFrame(rafId);
      });
      io.observe(canvas);
      rafId = requestAnimationFrame(animate);

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('deviceorientation', onOrient);
        ro.disconnect();
        io.disconnect();
        // PoC 3.1: sin deleteBuffer/deleteProgram en cleanup. En StrictMode
        // (mount→cleanup→mount) el segundo mount REUTILIZA el mismo contexto;
        // borrar buffers deja los attrib arrays enabled apuntando a buffers
        // borrados → drawArrays INVALID_OPERATION. El contexto se libera solo
        // al desmontar el canvas.
      };
    } catch {
      setWebglError(true);
      return;
    }

    return cleanup;
  }, [reduceMotion, webglError]);

  if (reduceMotion || webglError) return null; // fallback CSS toma control

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />;
}
