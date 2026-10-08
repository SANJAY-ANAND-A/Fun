import React, { useRef, useEffect, useState, useMemo } from 'react';
import './HoloCard.css';

export type HoloPreset = 'bursts' | 'shards' | 'stars';

export interface HoloCardProps {
  image: string;
  alt?: string;
  preset?: HoloPreset;
  intensity?: number;
  glare?: number;
  foilColor?: string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const HoloCard: React.FC<HoloCardProps> = ({
  image,
  alt = 'Cover artwork',
  preset = 'shards',
  intensity = 0.5,
  glare = 0.6,
  radius = 12,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // WebGL Holographic Shader Setup
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false });
    } catch {
      setWebglSupported(false);
      return;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader with procedural holographic diffraction grating
    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_intensity;
      uniform int u_preset; // 0: bursts, 1: shards, 2: stars

      vec3 spectral(float x) {
        // High-purity spectral iridescent rainbow
        float r = sin(x * 6.28318) * 0.5 + 0.5;
        float g = sin((x + 0.33) * 6.28318) * 0.5 + 0.5;
        float b = sin((x + 0.67) * 6.28318) * 0.5 + 0.5;
        return vec3(r, g, b);
      }

      void main() {
        vec2 p = v_uv;
        vec2 m = u_mouse;
        float dist = distance(p, m);
        float pattern = 0.0;

        if (u_preset == 0) {
          // Bursts
          float angle = atan(p.y - m.y, p.x - m.x);
          pattern = sin(angle * 12.0 + dist * 24.0 - u_time * 0.6);
        } else if (u_preset == 1) {
          // Shards (angular facet reflections)
          vec2 grid = floor(p * 18.0);
          float hash = fract(sin(dot(grid, vec2(12.9898, 78.233))) * 43758.5453);
          pattern = sin(dot(p, vec2(cos(hash * 6.28), sin(hash * 6.28))) * 28.0 + dist * 10.0);
        } else {
          // Stars (cross diffraction)
          float crossH = abs(sin((p.x - m.x) * 32.0));
          float crossV = abs(sin((p.y - m.y) * 32.0));
          pattern = (crossH + crossV) * 0.5;
        }

        float spectralPhase = p.x * 1.5 + p.y * 1.2 + pattern * 0.25 + (m.x - 0.5) * 1.5;
        vec3 rainbow = spectral(spectralPhase);

        float edgeFade = smoothstep(0.0, 0.1, p.x) * smoothstep(1.0, 0.9, p.x) *
                         smoothstep(0.0, 0.1, p.y) * smoothstep(1.0, 0.9, p.y);

        float sparkle = pow(max(0.0, pattern), 3.0) * u_intensity * edgeFade;
        gl_FragColor = vec4(rainbow * sparkle, sparkle * 0.45);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const intensityLoc = gl.getUniformLocation(program, 'u_intensity');
    const presetLoc = gl.getUniformLocation(program, 'u_preset');

    const presetMap: Record<HoloPreset, number> = {
      bursts: 0,
      shards: 1,
      stars: 2
    };

    let animFrame: number;
    let startTime = performance.now();

    const render = () => {
      if (!gl || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform2f(resLoc, w, h);
      gl.uniform2f(mouseLoc, glarePos.x / 100, 1.0 - glarePos.y / 100);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform1f(intensityLoc, intensity);
      gl.uniform1i(presetLoc, presetMap[preset] ?? 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, [preset, intensity, glarePos, reducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const card = containerRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    // Subtle 3D tilt (max 12 degrees)
    const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -9;
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 9;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({ x: percentX, y: percentY, opacity: glare });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const fallbackBackground = useMemo(() => {
    return `linear-gradient(135deg, #1e2430 0%, #11141b 100%)`;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`holo-card-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: `${radius}px`,
        transform: reducedMotion
          ? 'none'
          : `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        ...style
      }}
    >
      <div className="holo-card-inner" style={{ borderRadius: `${radius}px` }}>
        {/* Base artwork image with safe fallback */}
        <div
          className="holo-card-image-wrapper"
          style={{
            borderRadius: `${radius}px`,
            background: fallbackBackground
          }}
        >
          {image ? (
            <img
              src={image}
              alt={alt}
              className="holo-card-img"
              loading="lazy"
              onError={(e) => {
                // Graceful fallback on broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="holo-card-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
              </svg>
            </div>
          )}
        </div>

        {/* WebGL Shader Overlay */}
        {webglSupported && !reducedMotion && (
          <canvas
            ref={canvasRef}
            className="holo-card-canvas"
            style={{ borderRadius: `${radius}px` }}
          />
        )}

        {/* Non-WebGL CSS Fallback Gradient Foil */}
        {(!webglSupported || reducedMotion) && (
          <div
            className="holo-card-css-fallback"
            style={{
              borderRadius: `${radius}px`,
              opacity: intensity * 0.45
            }}
          />
        )}

        {/* Dynamic Specular Glare Reflection */}
        {!reducedMotion && (
          <div
            className="holo-card-glare"
            style={{
              borderRadius: `${radius}px`,
              opacity: glarePos.opacity,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`
            }}
          />
        )}
      </div>
    </div>
  );
};
