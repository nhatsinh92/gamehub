// three.js drawing only. Game rules live in game-logic.ts.
import {
  AmbientLight,
  BoxGeometry,
  Color,
  FogExp2,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SLOTS } from "./game-logic.ts";
import type { Game, Hit } from "./game-logic.ts";

export interface Aim {
  yaw: number;
  pitch: number;
}

export interface SniperScene {
  resize(width: number, height: number): void;
  /** `dt` is game time, so rain slows down in bullet-time */
  render(game: Game, aim: Aim, zoom: boolean, dt: number): void;
  /** what the centre of the screen points at */
  pick(): Hit;
  dispose(): void;
}

export const FOV_WIDE = 62;
export const FOV_ZOOM = 14;
const RAIN_COUNT = 500;
const RAIN_TOP = 16;
const NEON = [0xff2d95, 0x28e0ff, 0xffa02e, 0x9b5cff];

function neonSign(x: number, y: number, z: number, w: number, h: number, i: number): Mesh {
  const color = NEON[i % NEON.length] ?? 0xffffff;
  const sign = new Mesh(
    new BoxGeometry(0.15, h, w),
    new MeshBasicMaterial({ color: new Color(color).multiplyScalar(2.2) }),
  );
  sign.position.set(x, y, z);
  return sign;
}

function buildAlley(scene: Scene): void {
  const wall = new MeshStandardMaterial({ color: 0x14141f, roughness: 0.8 });
  for (const side of [-1, 1]) {
    const building = new Mesh(new BoxGeometry(4, 26, 50), wall);
    building.position.set(side * 7, 13, -14);
    scene.add(building);
  }
  const end = new Mesh(new BoxGeometry(20, 26, 1), wall);
  end.position.set(0, 13, -40);
  scene.add(end);

  const road = new Mesh(
    new PlaneGeometry(10, 60),
    new MeshStandardMaterial({
      color: 0x0a0a12,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.82,
    }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -20);
  scene.add(road);

  // dark window frames at every enemy slot, plus neon signs and their wet-road reflections
  const frame = new MeshBasicMaterial({ color: 0x05050a });
  SLOTS.forEach((slot, i) => {
    if (slot.kind !== "window") return;
    const f = new Mesh(new BoxGeometry(0.1, 1.9, 1.5), frame);
    f.position.set(Math.sign(slot.x) * 4.95, slot.y + 0.9, slot.z);
    scene.add(f);
    const sign = neonSign(Math.sign(slot.x) * 4.9, slot.y + 2.4, slot.z + 1.8, 1.8, 0.25, i);
    scene.add(sign);
    const mirrored = neonSign(sign.position.x, -sign.position.y, sign.position.z, 1.8, 0.25, i);
    (mirrored.material as MeshBasicMaterial).opacity = 0.5;
    (mirrored.material as MeshBasicMaterial).transparent = true;
    scene.add(mirrored);
  });

  const lights: [number, number, number, number][] = [
    [NEON[0] ?? 0, -3.5, 5, -6],
    [NEON[1] ?? 0, 3.5, 6, -16],
    [NEON[2] ?? 0, 0, 4, -26],
  ];
  for (const [color, x, y, z] of lights) {
    const light = new PointLight(color, 120, 40, 1.6);
    light.position.set(x, y, z);
    scene.add(light);
  }
  scene.add(new AmbientLight(0x303060, 0.8));
}

interface EnemyMesh {
  group: Group;
  body: Mesh;
  head: Mesh;
}

function buildEnemies(scene: Scene): EnemyMesh[] {
  const bodyGeo = new BoxGeometry(0.6, 0.9, 0.4);
  const headGeo = new SphereGeometry(0.2, 10, 8);
  const mat = new MeshBasicMaterial({ color: new Color(0xff5a2e).multiplyScalar(1.6) });
  return SLOTS.map((slot, slotIndex) => {
    const group = new Group();
    const body = new Mesh(bodyGeo, mat);
    body.position.y = 0.45;
    body.userData = { slot: slotIndex, part: "body" };
    const head = new Mesh(headGeo, mat);
    head.position.y = 1.15;
    head.userData = { slot: slotIndex, part: "head" };
    group.add(body, head);
    group.position.set(slot.x, slot.y, slot.z);
    group.visible = false;
    scene.add(group);
    return { group, body, head };
  });
}

function buildRain(scene: Scene): { update(dt: number): void } {
  const mesh = new InstancedMesh(
    new BoxGeometry(0.02, 0.5, 0.02),
    new MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.5 }),
    RAIN_COUNT,
  );
  const drops = Array.from({ length: RAIN_COUNT }, () => ({
    x: (Math.random() - 0.5) * 12,
    y: Math.random() * RAIN_TOP,
    z: 8 - Math.random() * 40,
  }));
  const m = new Matrix4();
  const write = (): void => {
    drops.forEach((d, i) => mesh.setMatrixAt(i, m.makeTranslation(d.x, d.y, d.z)));
    mesh.instanceMatrix.needsUpdate = true;
  };
  write();
  scene.add(mesh);
  return {
    update(dt) {
      for (const d of drops) {
        d.y -= 14 * dt;
        if (d.y < 0) d.y += RAIN_TOP;
      }
      write();
    },
  };
}

function buildComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  width: number,
  height: number,
): { composer: EffectComposer; bokeh: BokehPass } {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new Vector2(width, height), 0.9, 0.6, 0.2));
  const bokeh = new BokehPass(scene, camera, { focus: 28, aperture: 0.0004, maxblur: 0.008 });
  bokeh.enabled = false;
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
  composer.setSize(width, height);
  return { composer, bokeh };
}

function buildWorld(width: number, height: number): { scene: Scene; camera: PerspectiveCamera } {
  const scene = new Scene();
  scene.background = new Color(0x05050c);
  scene.fog = new FogExp2(0x0a0a1c, 0.028);
  const camera = new PerspectiveCamera(FOV_WIDE, width / height, 0.1, 80);
  camera.position.set(0, 1.7, 8);
  camera.rotation.order = "YXZ";
  buildAlley(scene);
  return { scene, camera };
}

export function createScene(canvas: HTMLCanvasElement, width: number, height: number): SniperScene {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  const { scene, camera } = buildWorld(width, height);
  const enemies = buildEnemies(scene);
  const rain = buildRain(scene);
  const { composer, bokeh } = buildComposer(renderer, scene, camera, width, height);

  const raycaster = new Raycaster();
  const centre = new Vector2(0, 0);
  const aimAt = (aim: Aim, zoom: boolean): void => {
    camera.rotation.set(aim.pitch, aim.yaw, 0);
    const fov = zoom ? FOV_ZOOM : FOV_WIDE;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };
  let current: Aim = { yaw: 0, pitch: 0 };
  let zoomed = false;

  return {
    resize(w, h) {
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    render(game, aim, zoom, dt) {
      current = aim;
      zoomed = zoom;
      aimAt(aim, zoom);
      const present = new Set(game.enemies.map((e) => e.slot));
      enemies.forEach((e, i) => {
        e.group.visible = present.has(i);
      });
      rain.update(dt);
      bokeh.enabled = zoom;
      composer.render();
    },
    pick() {
      aimAt(current, zoomed);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(centre, camera);
      const targets: Object3D[] = [];
      for (const e of enemies) if (e.group.visible) targets.push(e.head, e.body);
      const first = raycaster.intersectObjects(targets, false)[0];
      const data = first?.object.userData as { slot: number; part: "head" | "body" } | undefined;
      return data ? { slot: data.slot, part: data.part } : null;
    },
    dispose() {
      composer.dispose();
      renderer.dispose();
    },
  };
}
