
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ---------- SCENE & CAMERA ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.position.setZ(120);
camera.position.setY(40);
camera.lookAt(0, 0, 0);
//nm
// ---------- LIGHTING ----------
// subtle ambient for general brightness
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// strong sun for bloom/stars
const sunLight = new THREE.PointLight(0xffeecc, 2, 600);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// subtle fill light for planets/pfp
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(50, 50, 50);
scene.add(fillLight);

// ---------- RENDERER ----------
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

// ---------- POSTPROCESSING (BLOOM) ----------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.11, // strength
    1.0, // radius
    0.1  // threshold
);
composer.addPass(bloomPass);

// ---------- CONTROLS ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 20;
controls.maxDistance = 400;

// ---------- TEXTURE LOADER ----------
const loader = new THREE.TextureLoader();

// ---------- BACKGROUND ----------
const spaceTexture = loader.load('space.jpg');
scene.background = spaceTexture;

// Dim overlay
const overlay = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 0x223355,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
    })
);
scene.add(overlay);

// ---------- PROFILE SPHERE ----------
const ashTexture = loader.load('ashpfp (2).jpg');
const ash = new THREE.Mesh(
    new THREE.SphereGeometry(20, 140, 140),
    new THREE.MeshBasicMaterial({
        map: ashTexture,
        roughness: 0.3,
        metalness: 0.1,
    })
);
scene.add(ash);

// ---------- MOON ----------
const moonTexture = loader.load('purp.jpg');
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 64, 64),
    new THREE.MeshBasicMaterial({
        map: moonTexture,
        roughness: 0.3,
        metalness: 0.05,
    })
);
moon.position.set(-30, 0, -50);
scene.add(moon);

// ---------- SOFT STAR CREATOR ----------
function createSoftStar(spikes = 5, outerR = 6, innerR = 4) {
    const shape = new THREE.Shape();
    for (let i = 0; i <= spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerR : innerR;
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    const hole = new THREE.Shape();
    for (let i = 0; i <= spikes * 2; i++) {
        const radius = i % 2 === 0 ? innerR * 0.9 : innerR * 0.7;
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
    }
    hole.closePath();
    shape.holes.push(hole);
    return shape;
}

// ---------- PLANETS ----------
const planetTextures = ['mod.webp', 'pink.webp', 'gas.png', 'purp.jpg', 'pink.webp'];
function createPlanet(size = 4) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const tex = loader.load(planetTextures[Math.floor(Math.random() * planetTextures.length)]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const material = new THREE.MeshBasicMaterial({ map: tex, roughness: 0.3, metalness: 0.05 });
    return new THREE.Mesh(geometry, material);
}

// ---------- BUBBLE STAR ----------
function createBubbleStar(size = 3) {
    const shape = createSoftStar(5, size, size * 0.45);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps: 2,
        depth: 2.2,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 6,
    });
    const colorOptions = [0xfffa8c, 0xfad4d8, 0xd6e6f2, 0xf4b7c8, 0xffef99];
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2, // glow only for bloom
        transparent: true,
        opacity: 0.9,
    });
    return new THREE.Mesh(geometry, material);
}

// ---------- ORBITS ----------
const orbitConfigs = [
    { radius: 35, numObjects: 4 },
    { radius: 55, numObjects: 5 },
    { radius: 75, numObjects: 4 },
    { radius: 95, numObjects: 3 },
    { radius: 115, numObjects: 2 },
];

const orbitGroup = new THREE.Group();
scene.add(orbitGroup);

// ---------- SUN ----------
const sun = new THREE.Mesh(
    new THREE.SphereGeometry(10, 64, 64),
    new THREE.MeshStandardMaterial({
        color: 0xffd580,
        emissive: 0xffa200,
        emissiveIntensity: 1.5, // bloom effect
    })
);
scene.add(sun);

// ---------- PLANETS & ORBITS ----------
orbitConfigs.forEach((config) => {
    const ringGroup = new THREE.Group();
    orbitGroup.add(ringGroup);

    for (let i = 0; i < config.numObjects; i++) {
        const obj = Math.random() < 0.6 ? createPlanet(3 + Math.random() * 5) : createBubbleStar(1.5 + Math.random() * 3);
        const angle = (i / config.numObjects) * Math.PI * 2;
        obj.userData = {
            orbitRadius: config.radius,
            baseAngle: angle,
            orbitSpeed: 0.001 + Math.random() * 0.002,
            rotationSpeedX: 0.001 + Math.random() * 0.002,
            rotationSpeedY: 0.001 + Math.random() * 0.002,
        };
        ringGroup.add(obj);
    }

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(config.radius - 0.1, config.radius + 0.1, 128),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
});

// ---------- STAR SYSTEM ----------
const starGroup = new THREE.Group();
scene.add(starGroup);

const SPHERE_STAR_COUNT = 250;
const BUBBLE_STAR_COUNT = 40;
const bubbleStars = [];

function createSphereStar() {
    const size = 0.15 + Math.random();
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.9,
    });
    const star = new THREE.Mesh(geometry, material);
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 250;
    const y = (Math.random() - 0.5) * 50;
    star.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    star.userData = { baseY: star.position.y, floatSpeed: 0.02 + Math.random() * 0.05, floatOffset: Math.random() * Math.PI * 2, twinkleSpeed: 0.5 + Math.random() };
    starGroup.add(star);
}

function createFloatingBubbleStar() {
    const star = createBubbleStar(2.5 + Math.random() * 2.5);
    const orbitRadii = orbitConfigs.map((cfg) => cfg.radius);
    let chosenRadius, baseAngle, x, z;
    let attempts = 0;
    let tooClose = true;

    while (tooClose && attempts < 50) {
        chosenRadius = orbitRadii[Math.floor(Math.random() * orbitRadii.length)];
        baseAngle = Math.random() * Math.PI * 2;
        x = Math.cos(baseAngle) * chosenRadius;
        z = Math.sin(baseAngle) * chosenRadius;
        tooClose = bubbleStars.some((b) => Math.sqrt((b.position.x - x) ** 2 + (b.position.z - z) ** 2) < 6);
        attempts++;
    }

    star.position.set(x, (Math.random() - 0.5) * 15, z);
    star.userData = {
        orbitRadius: chosenRadius,
        baseAngle,
        orbitSpeed: 0.0005 + Math.random() * 0.0015,
        floatSpeed: 0.05 + Math.random() * 0.15,
        floatOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 1.0,
        rotationSpeed: 0.002 + Math.random() * 0.004,
    };
    star.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    starGroup.add(star);
    bubbleStars.push(star);
}

// ---------- GENERATE STARS ----------
for (let i = 0; i < SPHERE_STAR_COUNT; i++) createSphereStar();
for (let i = 0; i < BUBBLE_STAR_COUNT; i++) createFloatingBubbleStar();

// ---------- ANIMATION ----------
function animateStars(time) {
    starGroup.children.forEach((star) => {
        const s = star.userData;
        if (!s) return;
        star.position.y = (s.baseY || 0) + Math.sin(time * s.floatSpeed + s.floatOffset) * 1.5;
        if (star.material) star.material.opacity = 0.7 + Math.sin(time * s.twinkleSpeed + s.floatOffset) * 0.25;
        if (star.geometry.type !== 'SphereGeometry') {
            star.rotation.x += s.rotationSpeed;
            star.rotation.y += s.rotationSpeed * 0.8;
        }
        if (s.orbitRadius) {
            const angle = s.baseAngle + time * s.orbitSpeed;
            const y = star.position.y;
            star.position.x = Math.cos(angle) * s.orbitRadius;
            star.position.z = Math.sin(angle) * s.orbitRadius;
            star.position.y = y;
        }
    });
}

function animateOrbits(time) {
    orbitGroup.children.forEach((group) => {
        group.children.forEach((obj) => {
            const d = obj.userData;
            const angle = d.baseAngle + time * d.orbitSpeed;
            obj.position.set(Math.cos(angle) * d.orbitRadius, 0, Math.sin(angle) * d.orbitRadius);
            obj.rotation.x += d.rotationSpeedX;
            obj.rotation.y += d.rotationSpeedY;
        });
    });
}
document.querySelectorAll(".carousel-item").forEach(item => {
    item.addEventListener("click", () => {
        modalTitle.textContent = item.dataset.title;

        // Split description and link block if <br><br> is used
        const descParts = item.dataset.description.split("<br><br>");
        modalDesc.innerHTML = descParts[0]; // text only
        document.getElementById("modal-links").innerHTML = descParts.slice(1).join("<br><br>"); // links only

        modalImagesContainer.innerHTML = "";

        const images = item.dataset.images ? item.dataset.images.split(",") : [item.dataset.image];
        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src.trim();
            img.alt = item.dataset.title;
            modalImagesContainer.appendChild(img);
        });


        // Special case: HyperDrift Hazard YouTube embed
        if (item.dataset.title === "HyperDrift Hazard") {
            const iframe = document.createElement("iframe");
            iframe.src = "https://www.youtube.com/embed/Qate7ukXu78";
            iframe.width = "560";
            iframe.height = "315";
            iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.style.borderRadius = "12px";
            iframe.style.marginTop = "1.5rem";
            modalImagesContainer.appendChild(iframe);
        }

        modal.style.display = "block";
    });
});


// ---------- SCROLL CAMERA ----------
function updateCameraFromScroll() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const t = docHeight > 0 ? scrollTop / docHeight : 0;
    const revolutions = 1.5;
    const angle = t * Math.PI * 2 * revolutions;
    const radius = 160;
    camera.position.set(Math.cos(angle) * radius, 50 - t * 100, Math.sin(angle) * radius);
    camera.lookAt(0, 0, 0);
}

window.addEventListener('scroll', () => requestAnimationFrame(updateCameraFromScroll));
updateCameraFromScroll();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- MAIN LOOP ----------
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    animateStars(time);
    animateOrbits(time);

    sun.rotation.y += 0.002;
    moon.rotation.y += 0.002;
    ash.rotation.y += 0.002;

    controls.update();
    updateCameraFromScroll();
    composer.render();
}
animate();
