import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BarChart3, Building2, Layers, Plus } from 'lucide-react';
import type {
  AvancePartida,
  CameraPreset,
  IngenieriaDoc,
  ProcedimientoKimal,
  ViewMode3D,
  ZonaBim3D,
} from '../types/kimal';

interface ThreeKimalSceneProps {
  viewMode3D: ViewMode3D;
  setViewMode3D: (mode: ViewMode3D) => void;
  zonasBim: ZonaBim3D[];
  avanceData: AvancePartida[];
  ingenieriaData: IngenieriaDoc[];
  procedimientosData: ProcedimientoKimal[];
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  selectedPartida: AvancePartida;
  setSelectedPartida: (partida: AvancePartida) => void;
  wireframe: boolean;
  isNightMode: boolean;
  autoRotate: boolean;
  cameraPreset: CameraPreset;
  onOpenNewStructureModal?: () => void;
}

type HoveredPayload =
  | { tipo: 'zonaBIM'; zona: ZonaBim3D; subtitulo: string; docsCount: number }
  | { tipo: 'barraAvance'; partida: AvancePartida; subtitulo: string }
  | { tipo: 'docCivil3D'; doc: IngenieriaDoc; subtitulo: string }
  | { tipo: 'docProc3D'; proc: ProcedimientoKimal; subtitulo: string };

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ThreeKimalScene({
  viewMode3D,
  setViewMode3D,
  zonasBim,
  avanceData,
  ingenieriaData,
  procedimientosData,
  selectedZoneId,
  setSelectedZoneId,
  selectedPartida,
  setSelectedPartida,
  wireframe,
  isNightMode,
  autoRotate,
  cameraPreset,
  onOpenNewStructureModal,
}: ThreeKimalSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<HoveredPayload | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [contextLost, setContextLost] = useState(false);

  const interactablesRef = useRef<THREE.Object3D[]>([]);
  const callbacksRef = useRef({
    setSelectedZoneId,
    setSelectedPartida,
    autoRotate,
  });
  callbacksRef.current = { setSelectedZoneId, setSelectedPartida, autoRotate };

  const orbitRef = useRef({
    theta: 0.62,
    phi: 0.96,
    radius: 35,
    targetX: 0,
    targetY: 1.5,
    targetZ: 0,
    desiredTheta: 0.62,
    desiredPhi: 0.96,
    desiredRadius: 35,
    desiredTargetX: 0,
    desiredTargetY: 1.5,
    desiredTargetZ: 0,
    transitionActive: false,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    particles: null as THREE.Points | null,
    pulsingRings: [] as THREE.Mesh[],
  });

  // Smooth camera preset transitions
  useEffect(() => {
    const st = orbitRef.current;
    if (cameraPreset === 'isometric') {
      st.desiredTheta = 0.62;
      st.desiredPhi = 0.96;
      st.desiredRadius = 35;
      st.desiredTargetX = 0;
      st.desiredTargetZ = 0;
    } else if (cameraPreset === 'top') {
      st.desiredTheta = 0;
      st.desiredPhi = 0.16;
      st.desiredRadius = 40;
      st.desiredTargetX = 0;
      st.desiredTargetZ = 0;
    } else if (cameraPreset === 'front') {
      st.desiredTheta = 0;
      st.desiredPhi = 1.32;
      st.desiredRadius = 32;
      st.desiredTargetX = 0;
      st.desiredTargetZ = 0;
    } else if (cameraPreset === 'side') {
      st.desiredTheta = 1.56;
      st.desiredPhi = 1.25;
      st.desiredRadius = 34;
      st.desiredTargetX = 0;
      st.desiredTargetZ = 0;
    }
    st.transitionActive = true;
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const scene = new THREE.Scene();
    const bgHex = isNightMode ? 0x060b16 : 0x0f172a;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.01);

    const width = container.clientWidth || 860;
    const height = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Procedural Studio Environment Reflection for industrial steel & transformers
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Three-point + Hemisphere industrial lighting rig
    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x7dd3fc : 0xe0f2fe,
      isNightMode ? 0x0f172a : 0x1e293b,
      isNightMode ? 0.65 : 0.9
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, isNightMode ? 1.35 : 1.75);
    keyLight.position.set(24, 38, 22);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.left = -24;
      keyLight.shadow.camera.right = 24;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-22, 16, -18);
    scene.add(rimLight);

    // Ground platform & survey grid (aligned with Mecánica de Suelos ITC-E-0001)
    const groundGeo = new THREE.BoxGeometry(46, 0.6, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0b1220 : 0x172033,
      roughness: 0.88,
      metalness: 0.12,
      wireframe,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(46, 46, 0x06b6d4, isNightMode ? 0x162238 : 0x26344d);
    grid.position.y = 0.02;
    scene.add(grid);

    interactablesRef.current = [];
    orbitRef.current.pulsingRings = [];
    orbitRef.current.particles = null;

    // ========================================================================
    // MODE 1: GEMELO DIGITAL 3D SUBESTACIÓN CONVERTIDORA KIMAL (COMPOSITE BIM)
    // ========================================================================
    if (viewMode3D === 'bim3d') {
      const hvdcNodes: THREE.Vector3[] = [];

      zonasBim.forEach((z) => {
        const group = new THREE.Group();
        group.position.set(z.pos.x, 0, z.pos.z);

        const isSelected = selectedZoneId === z.zonaId;
        const docsZona = ingenieriaData.filter((d) => d.zona3d === z.zonaId);
        const tipoGeo =
          z.tipoGeometria ||
          (z.zonaId.includes('Transformadores')
            ? 'transformador'
            : z.zonaId.includes('Patio')
            ? 'torre_hvdc'
            : z.zonaId.includes('Canaletas')
            ? 'canaleta'
            : 'edificio');

        // Concrete foundation slab + containment bevel curb
        const slabGeo = new THREE.BoxGeometry(z.size.w + 0.9, 0.34, z.size.d + 0.9);
        const slabMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x0891b2 : 0x334155,
          roughness: 0.85,
          metalness: 0.1,
          wireframe,
        });
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.y = 0.17;
        slab.receiveShadow = true;
        group.add(slab);

        if (tipoGeo === 'transformador') {
          const numUnits = z.zonaId === 'Patio de Transformadores' ? 5 : 3;
          const step = z.size.w / (numUnits + 0.45);
          for (let i = 0; i < numUnits; i++) {
            const txOffset = -((numUnits - 1) * step) / 2 + i * step;

            // Main steel transformer tank
            const txGeo = new THREE.BoxGeometry(1.05, 2.0, 2.2);
            const txMat = new THREE.MeshStandardMaterial({
              color: z.colorHex || 0x10b981,
              metalness: 0.72,
              roughness: 0.28,
              emissive: z.colorHex || 0x10b981,
              emissiveIntensity: isSelected ? 0.38 : 0.14,
              wireframe,
            });
            const txMesh = new THREE.Mesh(txGeo, txMat);
            txMesh.position.set(txOffset, 1.34, 0);
            txMesh.castShadow = true;
            txMesh.userData = {
              tipo: 'zonaBIM',
              zona: z,
              subtitulo: `${z.titulo} · Unidad #${i + 1} (${docsZona.length} Docs ACONEX)`,
              docsCount: docsZona.length,
            };
            group.add(txMesh);
            interactablesRef.current.push(txMesh);

            // Radiator fin blocks (left & right)
            const radGeo = new THREE.BoxGeometry(0.18, 1.5, 1.4);
            const radMat = new THREE.MeshStandardMaterial({
              color: 0x64748b,
              metalness: 0.8,
              roughness: 0.3,
              wireframe,
            });
            const radL = new THREE.Mesh(radGeo, radMat);
            radL.position.set(txOffset - 0.62, 1.25, 0);
            const radR = new THREE.Mesh(radGeo, radMat);
            radR.position.set(txOffset + 0.62, 1.25, 0);
            group.add(radL, radR);

            // Overhead conservator cylinder
            const drumGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.3, 12);
            const drum = new THREE.Mesh(drumGeo, radMat);
            drum.rotation.x = Math.PI / 2;
            drum.position.set(txOffset, 2.62, -0.35);
            group.add(drum);

            // Dual HV/DC porcelain bushings
            const bushGeo = new THREE.CylinderGeometry(0.07, 0.13, 1.45, 10);
            const bushMat = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              roughness: 0.2,
              metalness: 0.35,
            });
            const bush1 = new THREE.Mesh(bushGeo, bushMat);
            bush1.position.set(txOffset - 0.2, 2.95, 0.65);
            bush1.rotation.x = 0.35;
            const bush2 = new THREE.Mesh(bushGeo, bushMat);
            bush2.position.set(txOffset + 0.2, 2.95, 0.65);
            bush2.rotation.x = 0.35;
            group.add(bush1, bush2);
          }
          hvdcNodes.push(new THREE.Vector3(z.pos.x, 3.6, z.pos.z));
        } else if (tipoGeo === 'torre_hvdc' || tipoGeo === 'patio_ac') {
          const cols = [-z.size.w / 3, z.size.w / 3];
          cols.forEach((cx) => {
            const towerGeo = new THREE.CylinderGeometry(0.2, 0.68, z.size.h, 4);
            const towerMat = new THREE.MeshStandardMaterial({
              color: z.colorHex,
              emissive: z.colorHex,
              emissiveIntensity: isSelected ? 0.45 : 0.2,
              metalness: 0.75,
              roughness: 0.35,
              wireframe: true,
            });
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(cx, z.size.h / 2 + 0.34, 0);
            tower.rotation.y = Math.PI / 4;
            group.add(tower);

            // Concrete pier pedestal
            const pierGeo = new THREE.BoxGeometry(1.1, 0.5, 1.1);
            const pierMat = new THREE.MeshStandardMaterial({
              color: 0x475569,
              roughness: 0.85,
              metalness: 0.05,
            });
            const pier = new THREE.Mesh(pierGeo, pierMat);
            pier.position.set(cx, 0.55, 0);
            group.add(pier);
          });

          // Main gantry cross-arm beam
          const beamGeo = new THREE.BoxGeometry(z.size.w * 0.92, 0.32, 0.34);
          const beamMat = new THREE.MeshStandardMaterial({
            color: z.colorHex,
            metalness: 0.75,
            roughness: 0.28,
            wireframe,
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.set(0, z.size.h + 0.18, 0);
          group.add(beam);

          // Suspended insulator strings & filter equipment cans
          const insMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.2, metalness: 0.4 });
          [-z.size.w / 4, 0, z.size.w / 4].forEach((ix) => {
            const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), insMat);
            ins.position.set(ix, z.size.h - 0.5, 0);
            group.add(ins);

            const eqPed = new THREE.Mesh(
              new THREE.BoxGeometry(0.75, 1.4, 0.75),
              new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
            );
            eqPed.position.set(ix, 1.04, 0.9);
            group.add(eqPed);
          });

          const hitGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const hitMat = new THREE.MeshStandardMaterial({
            color: z.colorHex,
            transparent: true,
            opacity: isSelected ? 0.28 : 0.13,
            depthWrite: false,
          });
          const hitBox = new THREE.Mesh(hitGeo, hitMat);
          hitBox.position.y = z.size.h / 2 + 0.34;
          hitBox.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s) Ingeniería`,
            docsCount: docsZona.length,
          };
          group.add(hitBox);
          interactablesRef.current.push(hitBox);

          hvdcNodes.push(new THREE.Vector3(z.pos.x, z.size.h + 0.2, z.pos.z));
        } else if (tipoGeo === 'canaleta') {
          const canalGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const canalMat = new THREE.MeshStandardMaterial({
            color: z.colorHex || 0x06b6d4,
            emissive: z.colorHex || 0x06b6d4,
            emissiveIntensity: isSelected ? 0.55 : 0.28,
            roughness: 0.25,
            metalness: 0.55,
            wireframe,
          });
          const canalMesh = new THREE.Mesh(canalGeo, canalMat);
          canalMesh.position.y = 0.42;
          canalMesh.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s)`,
            docsCount: docsZona.length,
          };
          group.add(canalMesh);
          interactablesRef.current.push(canalMesh);

          // Metallic trench grate ribs
          const ribMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
          const numRibs = 12;
          for (let r = 0; r < numRibs; r++) {
            const rx = -z.size.w / 2 + 1.2 + (r * (z.size.w - 2.4)) / (numRibs - 1);
            const rib = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, z.size.d + 0.1), ribMat);
            rib.position.set(rx, 0.68, 0);
            group.add(rib);
          }
        } else {
          // Composite Industrial Building (Valves Hall, Control Building, STATCOM, Guardhouse)
          const bldgGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const bldgMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.52,
            roughness: 0.36,
            emissive: z.colorHex,
            emissiveIntensity: isSelected ? 0.42 : 0.18,
            wireframe,
          });
          const bldg = new THREE.Mesh(bldgGeo, bldgMat);
          bldg.position.y = z.size.h / 2 + 0.34;
          bldg.castShadow = true;
          bldg.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s) en ACONEX`,
            docsCount: docsZona.length,
          };
          group.add(bldg);
          interactablesRef.current.push(bldg);

          // Roof parapet & status cornice
          const roofGeo = new THREE.BoxGeometry(z.size.w + 0.24, 0.22, z.size.d + 0.24);
          const roofMat = new THREE.MeshStandardMaterial({
            color: z.colorHex,
            emissive: z.colorHex,
            emissiveIntensity: 0.35,
            metalness: 0.65,
            roughness: 0.25,
          });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.y = z.size.h + 0.44;
          group.add(roof);

          // Rooftop HVAC / Cooling condenser units
          const hvacMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.78, roughness: 0.3 });
          [-z.size.w * 0.22, z.size.w * 0.22].forEach((hx) => {
            const hvac = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.9), hvacMat);
            hvac.position.set(hx, z.size.h + 0.78, 0);
            group.add(hvac);
          });

          // Exterior structural pilasters
          const colMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 });
          [-z.size.w / 2, z.size.w / 2].forEach((px) => {
            [-z.size.d / 2, z.size.d / 2].forEach((pz) => {
              const col = new THREE.Mesh(new THREE.BoxGeometry(0.26, z.size.h + 0.1, 0.26), colMat);
              col.position.set(px, z.size.h / 2 + 0.34, pz);
              group.add(col);
            });
          });

          hvdcNodes.push(new THREE.Vector3(z.pos.x, z.size.h + 0.5, z.pos.z));
        }

        // Base perimeter indicator ring
        const ringGeo = new THREE.RingGeometry(
          Math.max(z.size.w, z.size.d) * 0.58,
          Math.max(z.size.w, z.size.d) * 0.63,
          36
        );
        const ringMat = new THREE.MeshBasicMaterial({
          color: z.colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.92 : 0.38,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.08;
        group.add(ring);
        orbitRef.current.pulsingRings.push(ring);

        scene.add(group);
      });

      // Overhead HVDC interconnection conductors + energized particle pulse
      if (hvdcNodes.length > 1) {
        const allCurvePts: THREE.Vector3[] = [];
        for (let i = 0; i < hvdcNodes.length - 1; i++) {
          const p1 = hvdcNodes[i];
          const p2 = hvdcNodes[i + 1];
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
          mid.y += 1.35;
          const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
          const pts = curve.getPoints(20);
          allCurvePts.push(...pts);

          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
          scene.add(new THREE.Line(lineGeo, lineMat));
        }

        const pCount = 45;
        const pGeo = new THREE.BufferGeometry();
        const posArr = new Float32Array(pCount * 3);
        pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.38 });
        const particles = new THREE.Points(pGeo, pMat);
        particles.userData = { curvePoints: allCurvePts };
        scene.add(particles);
        orbitRef.current.particles = particles;
      }
    }

    // ========================================================================
    // MODE 2: BARRAS 3D AVANCE SE KIMAL (RESTORED & ENHANCED!)
    // ========================================================================
    else if (viewMode3D === 'avance3d') {
      const maxProy = Math.max(...avanceData.map((p) => p.proyectado), 100);
      const count = avanceData.length;
      const spacing = Math.min(5.2, 34 / Math.max(count, 1));
      const startX = -((count - 1) * spacing) / 2;

      avanceData.forEach((p, idx) => {
        const xPos = startX + idx * spacing;
        const isSel = selectedPartida?.id === p.id;
        const hProy = Math.max(1.2, (p.proyectado / maxProy) * 11.5);
        const hCerrado = Math.max(0.25, (p.cerrado_protocolizado / maxProy) * 11.5);
        const hExec = Math.max(0.2, (p.ejecutados_sp / maxProy) * 11.5);
        const hPct = Math.max(0.35, (p.protocolizado_pct / 100) * 9.0);

        // Plinth pad
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(3.4, 0.25, 4.4),
          new THREE.MeshStandardMaterial({
            color: isSel ? 0x06b6d4 : 0x1e293b,
            roughness: 0.8,
            metalness: 0.2,
          })
        );
        pad.position.set(xPos, 0.125, 0);
        scene.add(pad);

        // Proyectado column (blue)
        const proyMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, hProy, 1.4),
          new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            emissive: 0x2563eb,
            emissiveIntensity: isSel ? 0.35 : 0.14,
            metalness: 0.35,
            roughness: 0.35,
            transparent: true,
            opacity: 0.86,
            wireframe,
          })
        );
        proyMesh.position.set(xPos - 0.75, hProy / 2 + 0.25, -0.7);
        proyMesh.castShadow = true;
        proyMesh.userData = {
          tipo: 'barraAvance',
          partida: p,
          subtitulo: `Proyectado: ${p.proyectado.toLocaleString()} · Protocolizado: ${p.protocolizado_pct}%`,
        };
        scene.add(proyMesh);
        interactablesRef.current.push(proyMesh);

        // Cerrado Protocolizado column (emerald)
        const cerrMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.25, hCerrado, 1.25),
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: isSel ? 0.5 : 0.24,
            metalness: 0.45,
            roughness: 0.25,
            wireframe,
          })
        );
        cerrMesh.position.set(xPos + 0.75, hCerrado / 2 + 0.25, -0.7);
        cerrMesh.castShadow = true;
        cerrMesh.userData = {
          tipo: 'barraAvance',
          partida: p,
          subtitulo: `Cerrado Protocolizado: ${p.cerrado_protocolizado.toLocaleString()} (${p.protocolizado_pct}%)`,
        };
        scene.add(cerrMesh);
        interactablesRef.current.push(cerrMesh);

        // Ejecutados SP indicator (amber)
        const execMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, hExec, 0.85),
          new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.25,
            metalness: 0.5,
            roughness: 0.3,
          })
        );
        execMesh.position.set(xPos - 0.75, hExec / 2 + 0.25, 1.1);
        execMesh.userData = {
          tipo: 'barraAvance',
          partida: p,
          subtitulo: `Ejecutados (SP): ${p.ejecutados_sp} · En ITO: ${p.en_ito}%`,
        };
        scene.add(execMesh);
        interactablesRef.current.push(execMesh);

        // % Protocolizado Beacon Cylinder (cyan)
        const pctMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, hPct, 18),
          new THREE.MeshStandardMaterial({
            color: 0x22d3ee,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.45,
            metalness: 0.65,
            roughness: 0.2,
          })
        );
        pctMesh.position.set(xPos + 0.75, hPct / 2 + 0.25, 1.1);
        pctMesh.userData = {
          tipo: 'barraAvance',
          partida: p,
          subtitulo: `Avance Protocolización: ${p.protocolizado_pct}% (${p.cerrado_protocolizado}/${p.proyectado})`,
        };
        scene.add(pctMesh);
        interactablesRef.current.push(pctMesh);
      });
    }

    // ========================================================================
    // MODE 3: MATRIZ 3D ACONEX (DOCUMENTOS INGENIERÍA + PROCEDIMIENTOS)
    // ========================================================================
    else if (viewMode3D === 'aconex3d') {
      ingenieriaData.forEach((doc, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const xPos = -14 + col * 4.0;
        const zPos = -7.0 + row * 3.8;

        const revNum = parseInt(doc.rev, 10) || 1;
        const height = Math.max(1.2, revNum * 1.15);

        const colorByStatus =
          doc.estatus === 'Toma de Conocimiento'
            ? 0x10b981
            : doc.estatus === 'Toma de Conocimiento con Pendientes'
            ? 0x38bdf8
            : doc.estatus === 'Recibido'
            ? 0x3b82f6
            : doc.estatus === 'Revisado con comentarios'
            ? 0xf59e0b
            : 0xef4444;

        const boxGeo = new THREE.BoxGeometry(1.7, height, 1.7);
        const boxMat = new THREE.MeshStandardMaterial({
          color: colorByStatus,
          emissive: colorByStatus,
          emissiveIntensity: 0.24,
          metalness: 0.55,
          roughness: 0.28,
          wireframe,
        });
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.set(xPos, height / 2, zPos);
        mesh.castShadow = true;
        mesh.userData = {
          tipo: 'docCivil3D',
          doc,
          subtitulo: `${doc.disciplina || '01 Ingeniería - Civil'} · Rev. ${doc.rev} · ${doc.estatus}`,
        };
        scene.add(mesh);
        interactablesRef.current.push(mesh);
      });

      procedimientosData.forEach((proc, idx) => {
        const col = idx % 11;
        const row = Math.floor(idx / 11);
        const xPos = -15 + col * 3.0;
        const zPos = 5.5 + row * 3.2;
        const revNum = parseInt(proc.rev, 10) || 0;
        const height = proc.estatus === 'ELIMINADO' ? 1.2 : Math.max(2.2, (revNum + 1) * 1.8);

        const procColor =
          proc.estatus === 'APROBADO'
            ? 0x10b981
            : proc.estatus === 'ACONEX' || proc.estatus === 'EN REVISIÓN'
            ? 0x06b6d4
            : 0xef4444;

        const cylGeo = new THREE.CylinderGeometry(0.85, 0.85, height, 6);
        const cylMat = new THREE.MeshStandardMaterial({
          color: procColor,
          emissive: procColor,
          emissiveIntensity: 0.28,
          metalness: 0.62,
          roughness: 0.24,
          wireframe,
        });
        const mesh = new THREE.Mesh(cylGeo, cylMat);
        mesh.position.set(xPos, height / 2, zPos);
        mesh.castShadow = true;
        mesh.userData = {
          tipo: 'docProc3D',
          proc,
          subtitulo: `Procedimiento ${proc.area} · ${proc.estatus} (Rev. ${proc.rev || '-'})`,
        };
        scene.add(mesh);
        interactablesRef.current.push(mesh);
      });
    }

    // ========================================================================
    // INTERACTION, SMOOTH DAMPING & RAYCASTING
    // ========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastRaycast = 0;

    const updateCamera = () => {
      const st = orbitRef.current;
      camera.position.x = st.targetX + st.radius * Math.sin(st.phi) * Math.sin(st.theta);
      camera.position.y = st.targetY + st.radius * Math.cos(st.phi);
      camera.position.z = st.targetZ + st.radius * Math.sin(st.phi) * Math.cos(st.theta);
      camera.lookAt(st.targetX, st.targetY, st.targetZ);
    };

    const onMouseDown = (e: MouseEvent) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.transitionActive = false;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      orbitRef.current.isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const st = orbitRef.current;

      if (st.isDragging) {
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.theta -= dx * 0.008;
        st.phi = Math.max(0.14, Math.min(Math.PI / 2 - 0.06, st.phi - dy * 0.008));
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        return;
      }

      const now = performance.now();
      if (now - lastRaycast < 40) return;
      lastRaycast = now;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(interactablesRef.current, false);
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredInfo(hits[0].object.userData as HoveredPayload);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredInfo(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(interactablesRef.current, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData as HoveredPayload;
        if (data.tipo === 'zonaBIM' && data.zona) {
          callbacksRef.current.setSelectedZoneId(data.zona.zonaId);
        } else if (data.tipo === 'barraAvance' && data.partida) {
          callbacksRef.current.setSelectedPartida(data.partida);
        } else if (data.tipo === 'docCivil3D' && data.doc) {
          callbacksRef.current.setSelectedZoneId(data.doc.zona3d);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.transitionActive = false;
      orbitRef.current.radius = Math.max(14, Math.min(68, orbitRef.current.radius + e.deltaY * 0.025));
    };

    const dom = renderer.domElement;
    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };

    dom.addEventListener('webglcontextlost', onContextLost);
    dom.addEventListener('webglcontextrestored', onContextRestored);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('click', onClick);
    dom.addEventListener('wheel', onWheel, { passive: false });

    let frameId = 0;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl.fenceSync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const st = orbitRef.current;

      if (st.transitionActive) {
        st.theta = THREE.MathUtils.damp(st.theta, st.desiredTheta, 6, delta);
        st.phi = THREE.MathUtils.damp(st.phi, st.desiredPhi, 6, delta);
        st.radius = THREE.MathUtils.damp(st.radius, st.desiredRadius, 6, delta);
        st.targetX = THREE.MathUtils.damp(st.targetX, st.desiredTargetX, 6, delta);
        st.targetZ = THREE.MathUtils.damp(st.targetZ, st.desiredTargetZ, 6, delta);
        if (
          Math.abs(st.theta - st.desiredTheta) < 0.005 &&
          Math.abs(st.phi - st.desiredPhi) < 0.005 &&
          Math.abs(st.radius - st.desiredRadius) < 0.05
        ) {
          st.transitionActive = false;
        }
      } else if (callbacksRef.current.autoRotate && !st.isDragging && !isSoftwareGl) {
        st.theta += delta * 0.14;
      }

      st.pulsingRings.forEach((r, idx) => {
        const s = 1 + Math.sin(t * 2.4 + idx) * 0.05;
        r.scale.set(s, s, 1);
      });

      if (st.particles && st.particles.userData.curvePoints) {
        const pts = st.particles.userData.curvePoints as THREE.Vector3[];
        const attr = st.particles.geometry.attributes.position as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        const total = arr.length / 3;
        for (let i = 0; i < total; i++) {
          const pIdx = Math.floor(((t * 0.22 + i / total) % 1) * (pts.length - 1));
          const pt = pts[pIdx] || pts[0];
          arr[i * 3] = pt.x;
          arr[i * 3 + 1] = pt.y;
          arr[i * 3 + 2] = pt.z;
        }
        attr.needsUpdate = true;
      }

      updateCamera();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(animate);
      else frameId = requestAnimationFrame(animate);
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('webglcontextlost', onContextLost);
      dom.removeEventListener('webglcontextrestored', onContextRestored);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      envTarget.dispose();
      renderer.dispose();
    };
  }, [
    viewMode3D,
    zonasBim,
    avanceData,
    ingenieriaData,
    procedimientosData,
    selectedZoneId,
    selectedPartida,
    wireframe,
    isNightMode,
  ]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mountRef} className="w-full h-full min-h-[500px]" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 text-slate-300 text-sm">
          Contexto WebGL suspendido temporalmente. Restaurando visor 3D...
        </div>
      )}

      {/* Top Mode Switcher + Add 3D Structure CTA */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 bg-[#0b1222]/95 p-1 rounded-lg border border-slate-700/80">
          <button
            onClick={() => setViewMode3D('bim3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              viewMode3D === 'bim3d'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            1. Gemelo 3D Kimal ({zonasBim.length})
          </button>
          <button
            onClick={() => setViewMode3D('avance3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              viewMode3D === 'avance3d'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            2. Barras 3D Avance ({avanceData.length})
          </button>
          <button
            onClick={() => setViewMode3D('aconex3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              viewMode3D === 'aconex3d'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Matriz 3D ACONEX ({ingenieriaData.length + procedimientosData.length})
          </button>
        </div>

        {onOpenNewStructureModal && (
          <button
            onClick={onOpenNewStructureModal}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Estructura 3D
          </button>
        )}
      </div>

      {/* Bottom Legend Bar (clean static indicators, no pulsing dots or backdrop-blur over WebGL) */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-[#0b1222]/95 px-3.5 py-2 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
        {viewMode3D === 'bim3d' && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Toma de Conocimiento / Recibido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Revisado con Comentarios
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Devuelto con Comentarios
            </span>
          </div>
        )}
        {viewMode3D === 'avance3d' && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Azul: Total Proyectado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Verde: Cerrado Protocolizado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Ámbar: Ejecutados SP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Cilindro Cian: % Protocolizado
            </span>
          </div>
        )}
        {viewMode3D === 'aconex3d' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Aprobado / Toma Conoc.
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Recibido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Revisado c/Comentarios
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Devuelto / Eliminado
            </span>
            <span className="text-cyan-300 font-medium">Altura = N° Revisión</span>
          </div>
        )}
        <span className="text-slate-400 font-mono text-[10px]">
          Arrastra para orbitar · Rueda para zoom · Clic para inspeccionar
        </span>
      </div>

      {/* Hover Raycast Tooltip */}
      {hoveredInfo && (
        <div
          style={{
            left: Math.min(tooltipPos.x + 15, 480),
            top: Math.max(tooltipPos.y - 20, 15),
          }}
          className="pointer-events-none absolute z-30 bg-[#0b1222]/95 border border-cyan-400/70 rounded-lg p-3 shadow-xl text-xs max-w-xs"
        >
          {hoveredInfo.tipo === 'zonaBIM' && (
            <>
              <p className="font-bold text-cyan-400">{hoveredInfo.zona.titulo}</p>
              <p className="text-[11px] text-white mt-0.5">{hoveredInfo.subtitulo}</p>
              <p className="text-[11px] text-slate-300 mt-1">{hoveredInfo.zona.resumen}</p>
              <p className="text-[10px] text-cyan-300 mt-1.5">
                Clic para filtrar documentos vinculados
              </p>
            </>
          )}
          {hoveredInfo.tipo === 'barraAvance' && (
            <>
              <p className="font-bold text-emerald-400">
                {hoveredInfo.partida.item} {hoveredInfo.partida.nombre}
              </p>
              <p className="text-[11px] text-white mt-1">{hoveredInfo.subtitulo}</p>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-[11px] text-slate-300 tabular-nums">
                <span>
                  Proyectado: <strong>{hoveredInfo.partida.proyectado}</strong>
                </span>
                <span>
                  Protocolizado: <strong>{hoveredInfo.partida.cerrado_protocolizado}</strong>
                </span>
                <span>
                  Ejecutados SP: <strong>{hoveredInfo.partida.ejecutados_sp}</strong>
                </span>
                <span>
                  En ITO: <strong>{hoveredInfo.partida.en_ito}%</strong>
                </span>
              </div>
            </>
          )}
          {hoveredInfo.tipo === 'docCivil3D' && (
            <>
              <p className="font-mono font-bold text-cyan-400">{hoveredInfo.doc.codigo}</p>
              <p className="text-white font-semibold mt-0.5">{hoveredInfo.doc.nombre}</p>
              <p className="text-[11px] text-amber-300 mt-1">{hoveredInfo.subtitulo}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Transmittal: {hoveredInfo.doc.recibido_en || 'N/A'}
              </p>
            </>
          )}
          {hoveredInfo.tipo === 'docProc3D' && (
            <>
              <p className="font-mono font-bold text-amber-400">{hoveredInfo.proc.codigo}</p>
              <p className="text-white font-semibold mt-0.5">{hoveredInfo.proc.nombre}</p>
              <p className="text-[11px] text-cyan-300 mt-1">{hoveredInfo.subtitulo}</p>
              {hoveredInfo.proc.observaciones && (
                <p className="text-[10px] text-slate-300 mt-1">{hoveredInfo.proc.observaciones}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
