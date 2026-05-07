


import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initThreeScene() {
  

  
    const container = document.getElementById("three-scene");
  if (!container) return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  canvas.style.opacity = "0";
  container.appendChild(canvas);
    
    // We only enable 3D over mobile breakpoint for performance (simulating original logic)
    if (window.innerWidth <= 480) return;

    
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);

    // Environment matching the luminous light purple background
    const envScene = new THREE.Scene();
    const envCvs = document.createElement('canvas');
    envCvs.width = 512;
    envCvs.height = 512;
    const envCtx = envCvs.getContext('2d')!;
    const bgGrad = envCtx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#F7F5FF');
    bgGrad.addColorStop(1, '#EBE5FC');
    envCtx.fillStyle = bgGrad;
    envCtx.fillRect(0, 0, 512, 512);

    const envTex = new THREE.CanvasTexture(envCvs);
    const envBg = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide }));
    envScene.add(envBg);

    const envRenderTarget = new THREE.WebGLCubeRenderTarget(256, { minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true });
    const cubeCam = new THREE.CubeCamera(0.1, 100, envRenderTarget);
    cubeCam.update(renderer, envScene);
    scene.environment = envRenderTarget.texture;

    // Soft radiant ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    // Using purple split from design: Core, mid, highlight
    const coreLight = new THREE.PointLight(0xffffff, 1.0); // Neutralized core
    coreLight.position.set(0, -3, 2);
    scene.add(coreLight);

    const highlightLight = new THREE.PointLight(0x00E3FF, 1.2); // Cyan accent
    highlightLight.position.set(-3, 2, 3);
    scene.add(highlightLight);

    const midLight = new THREE.PointLight(0xffffff, 0.5); // Neutralized mid
    midLight.position.set(3, 4, 1);
    scene.add(midLight);

    const parallaxGroup = new THREE.Group();
    // Default position and tilt for Hero section
    parallaxGroup.position.set(1.6, 0, 0); 
    parallaxGroup.rotation.set(0.6, 0.25, 0);
    parallaxGroup.scale.set(0.6, 0.6, 0.6);
    scene.add(parallaxGroup);

    const stackGroup = new THREE.Group();
    parallaxGroup.add(stackGroup);

    const yOffsetGroup = new THREE.Group();
    stackGroup.add(yOffsetGroup);

    // Perfectly round puck/disc geometry via ExtrudeGeometry
    const rrShape = new THREE.Shape();
    const radius = 1.4;
    rrShape.moveTo(radius, 0);
    rrShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    
    // Increased bevel thickness/size softly rounds the top/bottom edges
    // creating a pillowed look around the perimeter without losing the overall structural flatness.
    const geometry = new THREE.ExtrudeGeometry(rrShape, {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.25,
      bevelSize: 0.2, bevelSegments: 24
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.center();

    function createGlassMat(tint: string) {
      return new THREE.MeshPhysicalMaterial({
        color: tint,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9, 
        transparent: true,
        opacity: 1.0,
        thickness: 0.5,
        ior: 1.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        side: THREE.DoubleSide
      });
    }

    // Material colors mapped to Vibrant Theme
    const matBottom = createGlassMat('#00E3FF');  // Bright Cyan
    const matMiddle = createGlassMat('#9333ea');  // Vibrant Purple
    const matTop = createGlassMat('#ffffff');     // Bright White/Glass

    // Engraved Icons

    function drawIconTex(type: string) {
      const cvs = document.createElement('canvas');
      cvs.width = 512; cvs.height = 512;
      const ctx = cvs.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 512);

      let strokeBase = 'rgba(255,255,255,0.75)';
      if (type === 'patient') strokeBase = 'rgba(255, 255, 255, 0.9)';
      if (type === 'stats') strokeBase = 'rgba(240, 220, 255, 0.8)';
      if (type === 'ai') strokeBase = 'rgba(220, 180, 255, 0.8)';

      const shadowColor = 'rgba(0,0,0,0.1)';

      function drawShape(isShadow: boolean) {
        ctx.save();
        if (isShadow) {
          ctx.translate(2, 2);
          ctx.strokeStyle = shadowColor;
          ctx.fillStyle = shadowColor;
        } else {
          ctx.strokeStyle = strokeBase;
          ctx.fillStyle = strokeBase;
        }
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (type === 'patient') {
          const cx = 256, cy = 256;
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Earpieces
          ctx.beginPath(); ctx.arc(cx - 50, cy - 100, 15, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + 50, cy - 100, 15, 0, Math.PI * 2); ctx.fill();

          // Y-tubes
          ctx.beginPath();
          ctx.moveTo(cx - 50, cy - 100);
          ctx.lineTo(cx - 50, cy - 20);
          ctx.quadraticCurveTo(cx - 50, cy + 40, cx, cy + 40);
          ctx.quadraticCurveTo(cx + 50, cy + 40, cx + 50, cy - 20);
          ctx.lineTo(cx + 50, cy - 100);
          ctx.stroke();

          // Main long tube
          ctx.beginPath();
          ctx.moveTo(cx, cy + 40);
          ctx.lineTo(cx, cy + 80);
          ctx.bezierCurveTo(cx, cy + 180, cx + 110, cy + 180, cx + 110, cy + 100);
          ctx.stroke();
          
          // Chest piece
          ctx.beginPath();
          ctx.arc(cx + 110, cy + 75, 25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + 110, cy + 75, 8, 0, Math.PI * 2);
          ctx.fill();

        } else if (type === 'stats') {
          const cx = 256, cy = 256, outerR = 100, innerR = 45;
          const slices = [0.2, 0.3, 0.15, 0.1, 0.25];
          let startA = -Math.PI / 2;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          slices.forEach((pct, idx) => {
            const endA = startA + pct * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startA, endA);
            ctx.arc(cx, cy, innerR, endA, startA, true);
            ctx.closePath();
            
            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = isShadow ? oldAlpha : 0.2 + (idx * 0.15);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            ctx.globalAlpha = oldAlpha;
            ctx.stroke();
            startA = endA;
          });
        } else if (type === 'ai') {
          const cx = 256, cy = 256, cs = 70;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.rect(cx - cs, cy - cs, cs * 2, cs * 2);
          ctx.stroke();
          
          const pins = 4, pinLen = 30, gap = (cs * 2) / (pins + 1);
          for (let i = 1; i <= pins; i++) {
            const off = -cs + gap * i;
            // top
            ctx.beginPath(); ctx.moveTo(cx + off, cy - cs); ctx.lineTo(cx + off, cy - cs - pinLen); ctx.stroke();
            // bottom
            ctx.beginPath(); ctx.moveTo(cx + off, cy + cs); ctx.lineTo(cx + off, cy + cs + pinLen); ctx.stroke();
            // left
            ctx.beginPath(); ctx.moveTo(cx - cs, cy + off); ctx.lineTo(cx - cs - pinLen, cy + off); ctx.stroke();
            // right
            ctx.beginPath(); ctx.moveTo(cx + cs, cy + off); ctx.lineTo(cx + cs + pinLen, cy + off); ctx.stroke();
          }

          ctx.font = 'bold 50px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('AI', cx, cy + 2);
        }
        ctx.restore();
      }
      drawShape(true); drawShape(false);
      const tex = new THREE.CanvasTexture(cvs);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    const planeGeo = new THREE.PlaneGeometry(1.8, 1.8);
    planeGeo.rotateX(-Math.PI / 2);

    function createTier(type: string, yInit: number, edgeColor: string, lightColor: number, tileMat: THREE.Material) {
      const mesh = new THREE.Mesh(geometry, tileMat);

      const yRotGroup = new THREE.Group();
      yRotGroup.position.set(0, yInit, 0);
      yRotGroup.add(mesh);

      let donutGroup: THREE.Group | null = null; // Keep null var so it doesn't break other code

      const tex = drawIconTex(type);
      const pMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.65, depthWrite: false, side: THREE.FrontSide });
      const plane = new THREE.Mesh(planeGeo, pMat);
      plane.position.y = 0.226; 
      
      const backPlane = new THREE.Mesh(planeGeo, pMat);
      backPlane.position.y = -0.226;
      backPlane.rotation.x = Math.PI;
      backPlane.rotation.z = Math.PI;

      if (type === 'stats') {
        plane.visible = false;
        backPlane.visible = false;
        
        donutGroup = new THREE.Group();
        donutGroup.position.y = 0.230;
        donutGroup.rotation.x = -Math.PI / 2;
        
        const slices = [
          { pct: 0.30, color: '#ffffff' },
          { pct: 0.20, color: '#d8b4fe' },
          { pct: 0.35, color: '#c084fc' },
          { pct: 0.15, color: '#9333ea' }
        ];

        donutGroup.userData = { progress: 0, slices };

        slices.forEach((slice, i) => {
          const sliceMat = new THREE.MeshBasicMaterial({ color: slice.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
          const sliceMesh = new THREE.Mesh(new THREE.BufferGeometry(), sliceMat);
          sliceMesh.userData = { pct: slice.pct, idx: i, mat: sliceMat };
          donutGroup?.add(sliceMesh);
        });

        mesh.add(donutGroup);
      } else {
        mesh.add(plane);
        mesh.add(backPlane);
      }

      let crossPlane: THREE.Mesh | null = null;
      if (type === 'patient' && false) { // disable the original cross
        const crossTex = drawIconTex('cross');
        const crossMat = new THREE.MeshBasicMaterial({ map: crossTex, transparent: true, opacity: 0.65, depthWrite: false });
        crossPlane = new THREE.Mesh(planeGeo, crossMat);
        crossPlane.position.y = 0.29;
        mesh.add(crossPlane);
      }

      yOffsetGroup.add(yRotGroup);
      return { mesh, yRotGroup, pMat, glowLight: null, tileMat, iconPlane: plane, crossPlane, donutGroup };
    }

    // Solar Dust glowing purples
    const tierBottom = createTier('ai', -0.65, '#5b21b6', 0x5b21b6, matBottom);
    const tierMiddle = createTier('stats', 0, '#9333ea', 0x9333ea, matMiddle);
    const tierTop = createTier('patient', 0.65, '#d8b4fe', 0xd8b4fe, matTop);

    const tileBottom = tierBottom.mesh;
    const tileMiddle = tierMiddle.mesh;
    const tileTop = tierTop.mesh;

    // ----- PARTICLES (Tech/AI Neural Network Plexus) -----
    const createTechTexture = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 64; cvs.height = 64;
      const ctx = cvs.getContext('2d')!;
      
      // Draw crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 16); ctx.lineTo(32, 48);
      ctx.moveTo(16, 32); ctx.lineTo(48, 32);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(32, 32, 2, 0, Math.PI * 2);
      ctx.fill();

      // Subtle brackets
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, 20); ctx.lineTo(16, 16); ctx.lineTo(20, 16);
      ctx.moveTo(48, 20); ctx.lineTo(48, 16); ctx.lineTo(44, 16);
      ctx.moveTo(16, 44); ctx.lineTo(16, 48); ctx.lineTo(20, 48);
      ctx.moveTo(48, 44); ctx.lineTo(48, 48); ctx.lineTo(44, 48);
      ctx.stroke();

      return new THREE.CanvasTexture(cvs);
    };

    const techGroup = new THREE.Group();

    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = window.innerWidth < 768 ? 100 : 250; // reduced to avoid jumbling
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);
    
    for(let i=0; i<particleCount*3; i+=3) {
      posArray[i] = (Math.random() - 0.5) * 8;
      posArray[i+1] = (Math.random() - 0.5) * 8;
      posArray[i+2] = (Math.random() - 0.5) * 6 - 2;
      
      velArray[i] = (Math.random() - 0.5) * 0.002;
      velArray[i+1] = Math.random() * 0.004 + 0.002;
      velArray[i+2] = (Math.random() - 0.5) * 0.002;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('velocity', new THREE.BufferAttribute(velArray, 3));
    
    const offsetArray = new Float32Array(particleCount);
    for(let i=0; i<particleCount; i++) offsetArray[i] = Math.random() * Math.PI * 2;
    particlesGeo.setAttribute('aOffset', new THREE.BufferAttribute(offsetArray, 1));
    
    const particlesMat = new THREE.PointsMaterial({
      size: 0.35, // larger to show tech glyphs
      color: 0xffffff, 
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      map: createTechTexture(),
      depthWrite: false
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    techGroup.add(particlesMesh);

    // Plexus lines
    const maxLines = (particleCount * (particleCount - 1)) / 2;
    const linesGeo = new THREE.BufferGeometry();
    const linesPos = new Float32Array(maxLines * 6); // 2 vertices per line, 3 components per vertex
    const linesCol = new Float32Array(maxLines * 8); // 2 vertices per line, 4 components per vertex
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linesPos, 3));
    linesGeo.setAttribute('color', new THREE.BufferAttribute(linesCol, 4));
    const linesMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    techGroup.add(linesMesh);

    scene.add(techGroup);

    // Interaction vars
    let isHovered = false;
    let mouseX = 0, mouseY = 0;
    let gsapScrollActive = false;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      if (gsapScrollActive) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stackGroup.children, true);
      
      if (intersects.length > 0) {
        isHovered = true;
        mouseX = mouse.x;
        mouseY = mouse.y;
      } else {
        isHovered = false;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    
    const onMouseLeave = () => { isHovered = false; };
    document.addEventListener('mouseleave', onMouseLeave);

    const onResize = () => {
      if (window.innerWidth > 480) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let currentRotSpeed = 0.0015;
    let currentAngleY = 0; // Starts facing straight ahead naturally
    let currentAngleX = 0;

    tileBottom.position.y = -0.15;
    tileMiddle.position.y = 0;
    tileTop.position.y = 0.15;

    function getShortestAngle(a0: number, a1: number) {
      let d = (a1 - a0) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    }

    // Single grand timeline aligning with scrolly steps
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        endTrigger: '.scrolly-wrapper',
        end: 'bottom bottom',
        scrub: 1,
        snap: {
          snapTo: [0, 10/41, 23/41, 35/41],
          duration: 0.5,
          delay: 0.1,
          ease: "power2.inOut"
        },
        onUpdate: (self) => {
          gsapScrollActive = self.progress > 0.01 && self.progress < 0.99;
        }
      }
    });

    // We use a timeline from 0 to 41 to map perfectly onto the 410vh total scroll length exactly.
    // 10 units = 100vh.
    
    // 0 to 1H (T = 0 to 10): Scroll past Hero, bring first slab into full view
    tl.to(parallaxGroup.position, { x: -2.14, y: -0.29, z: -0.56, duration: 10, ease: 'power2.inOut' }, 0);
    tl.to(parallaxGroup.rotation, { x: 1.1, y: 0.25, z: 0, duration: 10, ease: 'power2.inOut' }, 0);
    tl.to(parallaxGroup.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 10, ease: 'power2.inOut' }, 0); 

    // Hide middle & bottom completely initially (at 0 to 5)
    tl.to(matMiddle, { opacity: 0.0, transmission: 0.0, duration: 5 }, 0);
    tl.to(matBottom, { opacity: 0.0, transmission: 0.0, duration: 5 }, 0);
    tl.to(tierMiddle.pMat, { opacity: 0, duration: 5 }, 0);
    tl.to(tierBottom.pMat, { opacity: 0, duration: 5 }, 0);

    // Spread them out out of view
    tl.to(tileMiddle.position, { y: -10, duration: 5 }, 0);
    tl.to(tileBottom.position, { y: -20, duration: 5 }, 0);
    
    // Bring top item forward
    tl.to(tileTop.position, { y: 0, duration: 10 }, 0);

    // --- STEP 1 visible --- T=10 to T=19
    // TRANSITION S1 -> S2 at T=19 to 23

    tl.to(matTop, { opacity: 0.0, transmission: 0.0, duration: 4 }, 19);
    tl.to(tierTop.pMat, { opacity: 0, duration: 4 }, 19);
    tl.to(tileTop.position, { y: 10, duration: 4 }, 19);

    tl.to(tileMiddle.position, { y: 0, duration: 4 }, 19);
    tl.to(parallaxGroup.position, { x: -2.0, y: 0.0, z: 0.0, duration: 4 }, 19);
    tl.to(matMiddle, { opacity: 0.95, transmission: 0.2, duration: 4 }, 19);
    tl.to(tierMiddle.pMat, { opacity: 0.65, duration: 4 }, 19);
    if (tierMiddle.donutGroup) {
      tl.to(tierMiddle.donutGroup.userData, { progress: 1.0, duration: 8, ease: 'power2.out' }, 20);
    }

    // --- STEP 2 visible --- T=23 to T=31
    // TRANSITION S2 -> S3 at T=31 to 35

    tl.to(matMiddle, { opacity: 0.0, transmission: 0.0, duration: 4 }, 31);
    tl.to(tierMiddle.pMat, { opacity: 0, duration: 4 }, 31);
    tl.to(tileMiddle.position, { y: 10, duration: 4 }, 31);
    if (tierMiddle.donutGroup) {
      tl.to(tierMiddle.donutGroup.userData, { progress: 0.0, duration: 4, ease: 'power2.in' }, 31);
    }

    tl.to(tileBottom.position, { y: 0, duration: 4 }, 31);
    tl.to(parallaxGroup.position, { x: -1.86, y: 0.29, z: 0.56, duration: 4 }, 31);
    tl.to(matBottom, { opacity: 0.95, transmission: 0.2, duration: 4 }, 31);
    tl.to(tierBottom.pMat, { opacity: 0.65, duration: 4 }, 31);

    // --- STEP 3 visible --- T=35 to T=39
    // END ANIMATION - Fade out and return to hero transform at T=39 to 41

    tl.to(parallaxGroup.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 2 }, 39);
    tl.to(parallaxGroup.position, { x: 1.6, y: 0, z: 0, duration: 2 }, 39);
    tl.to(parallaxGroup.rotation, { x: 0.6, y: 0.25, z: 0, duration: 2 }, 39);

    tl.to(tileBottom.position, { y: -0.15, duration: 2 }, 39);
    tl.to(tileMiddle.position, { y: 0, duration: 2 }, 39);
    tl.to(tileTop.position, { y: 0.15, duration: 2 }, 39);

    tl.to(matBottom, { opacity: 0.95, transmission: 0.2, duration: 2 }, 39);
    tl.to(matMiddle, { opacity: 0.95, transmission: 0.2, duration: 2 }, 39);
    tl.to(matTop, { opacity: 0.95, transmission: 0.2, duration: 2 }, 39);

    tl.to(tierMiddle.pMat, { opacity: 0.65, duration: 2 }, 39);
    if (tierMiddle.donutGroup) {
      tl.to(tierMiddle.donutGroup.userData, { progress: 0.0, duration: 1 }, 39);
    }
    tl.to(tierBottom.pMat, { opacity: 0.65, duration: 2 }, 39);
    tl.to(tierTop.pMat, { opacity: 0.65, duration: 2 }, 39);
    
    // Fade out canvas so it disappears when we leave the section
    tl.to(canvas, { opacity: 0, duration: 2 }, 39);

    let animationFrameId: number;

    function render() {
      animationFrameId = requestAnimationFrame(render);
      const clockTime = clock.getElapsedTime();

      // Particle & Tech Network update
      const positions = particlesMesh.geometry.attributes.position.array as Float32Array;
      const velocities = particlesMesh.geometry.attributes.velocity.array as Float32Array;
      const offsets = particlesMesh.geometry.attributes.aOffset.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i3];
        positions[i3+1] += velocities[i3+1];
        positions[i3+2] += velocities[i3+2];

        // Add subtle sine wash for techy suspended-in-liquid feel
        positions[i3] += Math.sin(clockTime * 0.5 + offsets[i]) * 0.001;

        // Reset if it floats too high
        if (positions[i3+1] > 6) {
          positions[i3] = (Math.random() - 0.5) * 8;
          positions[i3+1] = -5;
          positions[i3+2] = (Math.random() - 0.5) * 6 - 2;
        }
      }
      particlesMesh.geometry.attributes.position.needsUpdate = true;
      
      // Update plexus lines
      let lineIndex = 0;
      let colIndex = 0;
      const linePositions = linesMesh.geometry.attributes.position.array as Float32Array;
      const lineColors = linesMesh.geometry.attributes.color.array as Float32Array;
      
      for(let i=0; i<particleCount; i++) {
        const i3 = i*3;
        for(let j=i+1; j<particleCount; j++) {
           const j3 = j*3;
           const dx = positions[i3] - positions[j3];
           const dy = positions[i3+1] - positions[j3+1];
           const dz = positions[i3+2] - positions[j3+2];
           const distSq = dx*dx + dy*dy + dz*dz;
           
           if(distSq < 2.5) { // distance threshold 
              // Fade out based on distance
              const dist = Math.sqrt(distSq);
              const alpha = Math.max(0, 1.0 - (dist / 1.58));
              
              linePositions[lineIndex++] = positions[i3];
              linePositions[lineIndex++] = positions[i3+1];
              linePositions[lineIndex++] = positions[i3+2];
              linePositions[lineIndex++] = positions[j3];
              linePositions[lineIndex++] = positions[j3+1];
              linePositions[lineIndex++] = positions[j3+2];

              // vertex 1
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = alpha * 0.4; // Fade max opacity to 0.4
              
              // vertex 2
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = 1.0;
              lineColors[colIndex++] = alpha * 0.4;
           }
        }
      }
      
      linesMesh.geometry.attributes.position.needsUpdate = true;
      linesMesh.geometry.attributes.color.needsUpdate = true;
      linesMesh.geometry.setDrawRange(0, lineIndex / 3);

      // Slight slow rotation of network
      techGroup.rotation.y = clockTime * 0.02;

      // Update Donut Chart Geometries
      if (tierMiddle.donutGroup) {
        const prog = tierMiddle.donutGroup.userData.progress || 0;
        let currentArc = 0;
        tierMiddle.donutGroup.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          const targetPct = mesh.userData.pct || 0;
          const mat = mesh.userData.mat as THREE.MeshBasicMaterial;
          
          if (prog > 0.001) {
            const currentPct = targetPct * prog;
            const thetaLength = currentPct * Math.PI * 2;
            
            if (mesh.geometry) mesh.geometry.dispose();
            mesh.geometry = new THREE.RingGeometry(0.5, 1.2, 32, 1, currentArc, thetaLength);
            mesh.visible = true;
            mat.opacity = 0.9 * prog;
            currentArc += thetaLength; // keeps them tightly connected while sweeping
          } else {
            if (mesh.geometry) mesh.geometry.dispose();
            mesh.geometry = new THREE.BufferGeometry();
            mesh.visible = false;
          }
        });
      }

      // Earth-style consistent spinning
      const rotSpeed = gsapScrollActive ? 0.0005 : 0.002;
      tierTop.yRotGroup.rotation.y += rotSpeed;
      tierMiddle.yRotGroup.rotation.y += rotSpeed;
      tierBottom.yRotGroup.rotation.y += rotSpeed;

      if (!gsapScrollActive) {
        if (isHovered) {
          currentRotSpeed += (0 - currentRotSpeed) * 0.1;
          const targetAngleY = (mouseX * 0.5);
          currentAngleY += getShortestAngle(currentAngleY, targetAngleY) * 0.1;
          const targetAngleX = -(mouseY * 0.4);
          currentAngleX += (targetAngleX - currentAngleX) * 0.1;
          
          particlesMat.opacity += (1.0 - particlesMat.opacity) * 0.1;
        } else {
          currentRotSpeed += (0.0015 - currentRotSpeed) * 0.02;
          currentAngleY += currentRotSpeed;
          currentAngleX += (0 - currentAngleX) * 0.02;
          
          particlesMat.opacity += (0.4 - particlesMat.opacity) * 0.05;
        }

        stackGroup.rotation.x = currentAngleX;
        stackGroup.rotation.y = currentAngleY;
      }

      yOffsetGroup.position.y = Math.sin(clockTime * 0.6) * 0.15;

      renderer.render(scene, camera);
    }
    render();
    
    gsap.to(canvas, { opacity: 1, duration: 1 });

    // --- DOM Animations utilizing bundled GSAP ---
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.fromTo(el, 
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out'
        }
      );
    });

    document.querySelectorAll('.step-content-right').forEach(card => {
      ScrollTrigger.create({
        trigger: card.closest('.scrolly-step'),
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => card.classList.add('opacity-100', 'translate-y-0'),
        onLeave: () => card.classList.remove('opacity-100', 'translate-y-0'),
        onEnterBack: () => card.classList.add('opacity-100', 'translate-y-0'),
        onLeaveBack: () => card.classList.remove('opacity-100', 'translate-y-0'),
      });
    });

    const nodes = document.querySelectorAll('.pipeline-node');
    const segments = document.querySelectorAll('.pipeline-progress-segment');

    nodes.forEach((node, i) => {
      const nodeTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: 'top 65%',
          end: 'top 45%',
          scrub: true,
        }
      });
      nodeTimeline.to(node, {
        backgroundColor: '#ffffff',
        color: '#0A051E',
        borderColor: '#ffffff',
      });

      if (i < segments.length) {
        const parent = segments[i].parentElement;
        if (parent) {
          const segmentTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: parent,
              start: 'top 50%',
              end: 'bottom 50%',
              scrub: true,
            }
          });
          segmentTimeline.to(segments[i], {
            scaleY: 1,
            ease: 'none'
          });
        }
      }
    });

    }
document.addEventListener('DOMContentLoaded', initThreeScene);