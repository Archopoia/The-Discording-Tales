// @ts-nocheck
/**
 * Signature pinned act: scroll progress drives a camera along a 3D
 * CatmullRom path through a cluster of image planes (peoples, areas,
 * world map). Textures come from existing assets - no GLTF.
 *
 * Keeps a single Three.js renderer. Render callback is registered on the
 * conductor's gsap.ticker; it never starts its own requestAnimationFrame.
 */
import * as THREE from 'three';
import { gsap, ScrollTrigger, type Conductor } from './conductor';
import type { ChaptersResult, ChapterDef, Waypoint } from './chapters';

const BASE_HREF = '../';

function assetUrl(src: string) {
  if (/^https?:\/\//.test(src)) return src;
  return BASE_HREF + src.replace(/^\/+/, '');
}

export function initFlythrough(conductor: Conductor, chapters: ChaptersResult) {
  const section = document.querySelector<HTMLElement>('[data-chapter="flythrough"]');
  if (!section) return;

  const canvas = section.querySelector<HTMLCanvasElement>('[data-fly-canvas]');
  const overlayHost = section.querySelector<HTMLElement>('[data-fly-overlays]');
  if (!canvas || !overlayHost) return;

  const def = chapters.getFlythrough();
  if (!def || !def.waypoints || !def.waypoints.length) {
    section.setAttribute('data-fly-mode', 'static');
    return;
  }

  const waypoints: Waypoint[] = conductor.isMobile && def.mobile?.waypoints
    ? def.waypoints.slice(0, def.mobile.waypoints as number)
    : def.waypoints;

  // Reduced-motion / low-tier fallback: show the midpoint waypoint as a
  // still, plus a readable list of all waypoint titles. No WebGL.
  if (conductor.reduceMotion) {
    const mid = waypoints[Math.floor(waypoints.length / 2)];
    const img = document.createElement('img');
    img.src = assetUrl(mid.texture); img.alt = mid.title;
    img.style.cssText = 'width:100%;max-width:48rem;margin:0 auto;display:block;border-radius:6px;border:1px solid rgba(228,197,106,.3)';
    overlayHost.innerHTML = '';
    overlayHost.appendChild(img);
    const list = document.createElement('ul');
    list.className = 'fly-waypoint-list';
    waypoints.forEach((w) => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${w.title}</b><span>${w.body}</span>`;
      list.appendChild(li);
    });
    overlayHost.appendChild(list);
    section.setAttribute('data-fly-mode', 'static');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, conductor.isMobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x120606, 0.018);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

  const planes: THREE.Mesh[] = [];
  const loader = new THREE.TextureLoader();

  // Lay waypoints along a gentle sinusoidal path. Each gets a plane sized by
  // aspect that faces roughly toward the camera path tangent.
  const curvePoints: THREE.Vector3[] = [];
  const lookAtPoints: THREE.Vector3[] = [];
  waypoints.forEach((wp, i) => {
    const z = -i * 14;
    const x = Math.sin(i * 0.9) * 3.2 + (i % 2 === 0 ? 1.2 : -1.2);
    const y = Math.cos(i * 0.6) * 1.4;
    const planePos = new THREE.Vector3(x, y, z);
    const camPos = new THREE.Vector3(x * 0.3, y * 0.4, z + 8);

    curvePoints.push(camPos);
    lookAtPoints.push(planePos);

    const geom = new THREE.PlaneGeometry(1, 1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0,
    });
    const plane = new THREE.Mesh(geom, mat);
    plane.position.copy(planePos);
    plane.userData.wp = wp;
    scene.add(plane);
    planes.push(plane);

    loader.load(assetUrl(wp.texture), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() ?? 1);
      mat.map = tex;
      const img = tex.image as HTMLImageElement;
      const aspect = img.width / img.height;
      const h = 5.5;
      plane.scale.set(h * aspect, h, 1);
      mat.needsUpdate = true;
      // Also seed overlay DOM once first texture is loaded.
      ensureOverlays();
    });
  });

  // Give the end a short tail so the camera can glide past the last plane.
  const tailStart = curvePoints[curvePoints.length - 1];
  curvePoints.push(new THREE.Vector3(tailStart.x * 0.4, tailStart.y * 0.4, tailStart.z - 12));
  lookAtPoints.push(new THREE.Vector3(0, 0, tailStart.z - 20));

  const camCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);
  const lookCurve = new THREE.CatmullRomCurve3(lookAtPoints, false, 'catmullrom', 0.5);

  // Ambient tint light so textures glow a little against the fog.
  const light = new THREE.AmbientLight(0xf6edd4, 0.9);
  scene.add(light);
  const warm = new THREE.DirectionalLight(0xe4c56a, 0.4);
  warm.position.set(2, 3, 2);
  scene.add(warm);

  // DOM overlays: one per waypoint, HTML next to the canvas.
  overlayHost.innerHTML = '';
  const overlayEls: HTMLElement[] = [];
  function ensureOverlays() {
    if (overlayEls.length === waypoints.length) return;
    overlayHost.innerHTML = '';
    overlayEls.length = 0;
    waypoints.forEach((wp) => {
      const el = document.createElement('article');
      el.className = 'fly-overlay';
      el.innerHTML = `
        <p class="fly-overlay__kicker">Chapter</p>
        <h3 class="fly-overlay__title">${wp.title}</h3>
        <p class="fly-overlay__body">${wp.body}</p>
      `;
      el.style.opacity = '0';
      overlayHost.appendChild(el);
      overlayEls.push(el);
    });
  }
  ensureOverlays();

  function size() {
    const rect = canvas.parentElement!.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', size, { passive: true });

  // Pin + scrub drives a smoothed `p` from 0 to 1.
  let targetP = 0;
  let smoothP = 0;

  const useScrub = !conductor.isMobile && def.pin !== false;
  if (useScrub) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=240%',
      pin: section.querySelector('[data-fly-stage]') as HTMLElement,
      scrub: 0.6,
      onUpdate: (self) => { targetP = self.progress; },
    });
  } else {
    // Mobile / unpinned: progress tracks section-local scroll via already-wired chapter trigger.
    const chapterP = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--chapter-flythrough-p').trim();
      const n = parseFloat(v || '0');
      return isNaN(n) ? 0 : n;
    };
    conductor.addStep(() => { targetP = chapterP(); });
  }

  conductor.addStep(({ delta }) => {
    size();
    smoothP += (targetP - smoothP) * Math.min(1, delta / 160);
    const p = Math.min(0.9999, Math.max(0, smoothP));

    // Keep a plane framed. Progress walks waypoint-to-waypoint instead of
    // running off the end of the curve into empty fog.
    const n = Math.max(1, planes.length);
    const f = p * Math.max(1, n - 1);
    const i0 = Math.min(n - 1, Math.floor(f));
    const i1 = Math.min(n - 1, i0 + 1);
    const local = f - i0;
    const focus = planes[i0].position.clone().lerp(planes[i1].position, local);
    camera.position.set(focus.x * 0.12, focus.y * 0.15 + 0.35, focus.z + 8);
    camera.lookAt(focus);

    planes.forEach((plane, i) => {
      const dist = Math.abs(i - f);
      const op = THREE.MathUtils.clamp(1.15 - dist * 0.55, 0, 1);
      (plane.material as THREE.MeshBasicMaterial).opacity = op;
      plane.lookAt(camera.position);
    });

    // Overlay copy: show the overlay for the nearest-ahead waypoint.
    const perWaypoint = 1 / Math.max(1, waypoints.length);
    const activeIndex = Math.min(waypoints.length - 1, Math.floor(p / perWaypoint));
    overlayEls.forEach((el, i) => {
      const local = (p - i * perWaypoint) / perWaypoint;
      const show = i === activeIndex && local >= 0 && local <= 1;
      const fade = show ? Math.min(1, Math.min(local * 3, (1 - local) * 3 + 0.4)) : 0;
      el.style.opacity = String(Math.max(0, fade));
      el.style.transform = `translateY(${(1 - fade) * 10}px)`;
      el.style.pointerEvents = show ? 'auto' : 'none';
    });

    renderer.render(scene, camera);
  });

  size();
}
