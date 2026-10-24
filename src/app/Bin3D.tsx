"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// A real 3D pedal bin (three.js): lathe-turned tapered body, hinged lid that
// pops open now and then, foot pedal, studio-style reflections, and a soft
// contact shadow. Kept black/white to match the site theme.
export default function Bin3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 1.45, 6.2);
    camera.lookAt(0, 0.95, 0);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    scene.add(key, new THREE.AmbientLight(0xffffff, 0.25));

    const bin = new THREE.Group();
    scene.add(bin);

    const metal = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.85, roughness: 0.28 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.15 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0, roughness: 0.9 });

    // Body: slight taper, rounded bottom edge, rolled rim at the top.
    const profile = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.62, 0),
      new THREE.Vector2(0.68, 0.04),
      new THREE.Vector2(0.7, 0.12),
      new THREE.Vector2(0.8, 1.72),
      new THREE.Vector2(0.83, 1.76),
      new THREE.Vector2(0.81, 1.8),
    ];
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), metal);
    bin.add(body);

    // Base ring.
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.06, 96), rubber);
    base.position.y = 0.03;
    bin.add(base);

    // "BinBol" label band — canvas texture wrapped on a thin shell.
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "900 78px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B I N B O L", c.width / 2, c.height / 2);
    const labelTex = new THREE.CanvasTexture(c);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(
      // theta 0 faces +z (the front), so -0.9..+0.9 centres the band there
      new THREE.CylinderGeometry(0.778, 0.764, 0.22, 64, 1, true, -0.9, 1.8),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false })
    );
    label.position.y = 1.0;
    bin.add(label);

    // Lid, hinged at the back edge.
    const hinge = new THREE.Group();
    hinge.position.set(0, 1.8, -0.82);
    bin.add(hinge);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.09, 96), chrome);
    lid.position.set(0, 0.045, 0.82);
    hinge.add(lid);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.86, 96, 24, 0, Math.PI * 2, 0, Math.PI / 9),
      chrome
    );
    dome.position.set(0, -0.72, 0.82);
    hinge.add(dome);

    // Pedal at the front.
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.26), chrome);
    pedal.position.set(0, 0.1, 0.78);
    bin.add(pedal);

    // Soft contact shadow.
    const sc = document.createElement("canvas");
    sc.width = sc.height = 256;
    const sctx = sc.getContext("2d")!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.45)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    bin.rotation.y = -0.5;

    // Drag to spin; otherwise it auto-rotates.
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx * 0.01;
      bin.rotation.y += velocity;
    };
    const onUp = () => (dragging = false);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "pan-y";

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      if (!dragging) {
        velocity *= 0.95;
        bin.rotation.y += reduceMotion ? 0 : 0.006 + velocity;
      }
      // Lid: closed most of the cycle, pops open briefly every ~5s.
      const cycle = (t % 5) / 5;
      const open = cycle > 0.55 && cycle < 0.85 ? Math.sin(((cycle - 0.55) / 0.3) * Math.PI) : 0;
      hinge.rotation.x = reduceMotion ? 0 : -open * 1.05;
      pedal.rotation.x = reduceMotion ? 0 : open * 0.25;
      bin.position.y = reduceMotion ? 0 : Math.sin(t * 1.4) * 0.02;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material & { map?: THREE.Texture };
          m.map?.dispose();
          m.dispose();
        }
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-[260px] h-[320px]" aria-hidden="true" />;
}
