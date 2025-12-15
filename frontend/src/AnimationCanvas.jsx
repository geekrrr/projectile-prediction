import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

/*
 AnimationCanvas
 - Canvas-based 2D animation of a projectile.
 - Receives `xs`, `ys` arrays (meters) and `options` (duration, slowFactor).
 - Exposes imperative methods via ref: play(), replay(), stop(), setSpeed(factor)
 - Scales the physical coordinates to canvas pixels maintaining aspect and margin.
 - Emits a small callback when animation finishes (onComplete).
*/

const AnimationCanvas = forwardRef(function AnimationCanvas(props, ref){
  const { xs = [], ys = [], duration = 2000, onComplete = ()=>{}, style = {}, slowFactor = 1 } = props;
  const canvasRef = useRef(null);
  const animRef = useRef({ stopped:true, startTime: null, duration, slowFactor });

  // used to compute pixel mapping from meters -> canvas pixels
  function computeScale(w, h, xs, ys){
    if(!xs || xs.length === 0) return { scale:1, xMin:0, yMin:0, xMax:1, yMax:1, margin:20 };
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    // add tiny margins
    const margin = 24;
    const xRange = Math.max(1e-6, xMax - xMin);
    const yRange = Math.max(1e-6, yMax - yMin);
    // We want to fit x to width, and y to height, preserving aspect: scale = min(w/xRange, h/yRange)
    const scale = Math.min((w - 2*margin) / xRange, (h - 2*margin) / yRange);
    return { scale, xMin, yMin, xMax, yMax, margin };
  }

  // draw a frame at progress t in [0,1]
  function drawFrame(ctx, w, h, xs, ys, t){
    // background
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0,0,w,h);

    // if no data show placeholder
    if(!xs || xs.length === 0){
      ctx.fillStyle = "#333";
      ctx.fillRect(20,20,w-40,h-40);
      ctx.fillStyle = "#bbb";
      ctx.font = "14px Inter, Arial";
      ctx.fillText("No animation data — run a simulation", 34, 46);
      return;
    }

    // compute scale
    const { scale, xMin, yMin, margin } = computeScale(w, h, xs, ys);
    // map function: physical (x,y) meters -> canvas px (cx, cy)
    const px = (x) => margin + (x - xMin) * scale;
    // we draw from bottom up (canvas y increases downwards) -> invert y
    const canvasYBase = h - margin;
    const py = (y) => canvasYBase - (y - yMin) * scale;

    // draw ground line
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, canvasYBase+1);
    ctx.lineTo(w-margin, canvasYBase+1);
    ctx.stroke();

    // draw full path lightly (so user sees where it will land)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,165,90,0.18)"; // warm orange faint
    ctx.lineWidth = 2;
    for(let i=0;i<xs.length;i++){
      const cx = px(xs[i]), cy = py(ys[i]);
      if(i===0) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
    }
    ctx.stroke();

    // draw path up to progress
    const steps = Math.floor(t * (xs.length-1));
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,140,40,0.98)"; // warm orange solid
    ctx.lineWidth = 3;
    for(let i=0;i<=steps;i++){
      const cx = px(xs[i]), cy = py(ys[i]);
      if(i===0) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
    }
    ctx.stroke();

    // draw projectile (current position)
    const idx = Math.min(xs.length-1, Math.max(0, steps));
    const cx = px(xs[idx]), cy = py(ys[idx]);
    // shadow
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.ellipse(cx+6, canvasYBase+6, 14, 6, 0, 0, Math.PI*2);
    ctx.fill();
    // body
    ctx.beginPath();
    const radius = 9;
    // gradient for metallic look
    const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, radius+2);
    g.addColorStop(0, "#fff2e6");
    g.addColorStop(0.4, "#ffb66b");
    g.addColorStop(1, "#d94b2b");
    ctx.fillStyle = g;
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.stroke();

    // draw landing marker (last point)
    const lastX = px(xs[xs.length-1]), lastY = py(ys[ys.length-1]);
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,120,40,0.95)";
    ctx.arc(lastX, lastY, 6, 0, Math.PI*2);
    ctx.fill();

    // if t >= 1 show distance popup near landing
    if(t >= 0.999){
      const distText = `${xs[xs.length-1].toFixed(2)} m`;
      ctx.font = "bold 18px Inter, Arial";
      ctx.fillStyle = "#fff7ee";
      // background rounded rect
      const padX = 12, padY = 8;
      const metrics = ctx.measureText(distText);
      const bgW = metrics.width + padX*2, bgH = 28;
      const bgX = Math.min(w - margin - bgW, lastX + 10);
      const bgY = Math.max(margin, lastY - 40);
      // rounded rect
      ctx.fillStyle = "rgba(45,20,10,0.85)";
      roundRect(ctx, bgX, bgY, bgW, bgH, 8, true, false);
      // text
      ctx.fillStyle = "#ffd9b8";
      ctx.fillText(distText, bgX + padX, bgY + bgH - 9);
    }
  }

  // helper: rounded rect
  function roundRect(ctx, x, y, w, h, r, fill, stroke){
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
  }

  // animation loop
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");

    // set size (high DPI aware)
    function resize(){
      const ratio = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const style = getComputedStyle(parent);
      const w = Math.max(300, parent.clientWidth);
      const h = Math.max(220, parent.clientHeight);
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      // draw initial frame
      drawFrame(ctx, w, h, xs, ys, 0);
    }

    resize();
    window.addEventListener("resize", resize);
    return ()=> window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xs, ys]);

  // imperative handlers (exposed to parent via ref)
  useImperativeHandle(ref, ()=>({
    play: (speed=1) => startAnimation(speed),
    replay: (speed=1) => startAnimation(speed),
    stop: ()=> { animRef.current.stopped = true; }
  }), [xs, ys]);

  // core start animation routine
  function startAnimation(speed=1){
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    animRef.current.stopped = false;
    animRef.current.startTime = null;
    animRef.current.duration = Math.max(300, duration / (speed * (animRef.current.slowFactor || 1)));
    const dur = animRef.current.duration;

    function step(ts){
      if(animRef.current.stopped) return;
      if(!animRef.current.startTime) animRef.current.startTime = ts;
      const elapsed = ts - animRef.current.startTime;
      const t = Math.min(1, elapsed / dur);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      drawFrame(ctx, w, h, xs, ys, t);
      if(t < 1){
        requestAnimationFrame(step);
      } else {
        animRef.current.stopped = true;
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  return (
    <canvas ref={canvasRef} style={{ width: "100%", height: "100%", borderRadius: 12, display: "block", ...style }} />
  );
});

export default AnimationCanvas;
