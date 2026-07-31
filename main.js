import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e2022);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 7, 7);
scene.add(camera);

const canvas = document.querySelector('#webgl');
if (!canvas) {
  console.error("Canvas element #webgl not found!");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.1;

const calcGroup = new THREE.Group();

const bodyGeo = new THREE.BoxGeometry(3.6, 0.4, 4.8);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x22252d, roughness: 0.4 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = -0.2;
calcGroup.add(bodyMesh);

const screenGeo = new THREE.BoxGeometry(3.1, 0.05, 0.9);
const screenMat = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.2 });
const screenMesh = new THREE.Mesh(screenGeo, screenMat);
screenMesh.position.set(0, 0.03, -1.6);
calcGroup.add(screenMesh);

const textCanvas = document.createElement('canvas');
textCanvas.width = 512;
textCanvas.height = 128;
const ctx = textCanvas.getContext('2d');

const screenTexture = new THREE.CanvasTexture(textCanvas);
const textGeo = new THREE.PlaneGeometry(3.0, 0.8);
const textMat = new THREE.MeshBasicMaterial({ map: screenTexture, transparent: true });
const textMesh = new THREE.Mesh(textGeo, textMat);
textMesh.rotation.x = -Math.PI / 2;
textMesh.position.set(0, 0.061, -1.6);
calcGroup.add(textMesh);

let currentInput = "0";

function updateDisplay() {
  ctx.fillStyle = "#17181a";
  ctx.fillRect(0, 0, 512, 128);
  
  ctx.fillStyle = "#00ff88";
  ctx.font = "Bold 64px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(currentInput, 490, 64);
  
  screenTexture.needsUpdate = true;
}
updateDisplay();

const buttonsData = [
  ['C', '(', ')', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '=']
];

const buttonMeshes = [];
const btnWidth = 0.65;
const btnHeight = 0.2;
const btnDepth = 0.65;

const startX = -1.15;
const startZ = -0.6;
const gapX = 0.78;
const gapZ = 0.78;

buttonsData.forEach((row, rIdx) => {
  row.forEach((val, cIdx) => {
    let span = 1;
    let color = 0x292d36;
    
    if (['/', '*', '-', '+', '='].includes(val)) {
      color = 0x00ff88;
    } else if (['C', '(', ')'].includes(val)) {
      color = 0x61677a;
    }

    if (val === '=') {
      span = 2;
    }

    const geo = new THREE.BoxGeometry(btnWidth * span + (span > 1 ? (gapX - btnWidth) : 0), btnHeight, btnDepth);
    const mat = new THREE.MeshStandardMaterial({ 
      color: color, 
      roughness: 0.3,
      metalness: 0.1 
    });
    const btnMesh = new THREE.Mesh(geo, mat);

    const xPos = startX + cIdx * gapX + (span > 1 ? (gapX - btnWidth) / 2 : 0);
    const zPos = startZ + rIdx * gapZ;

    btnMesh.position.set(xPos, 0.1, zPos);
    btnMesh.userData = { value: val, originalY: 0.1, color: color };

    const btnCanvas = document.createElement('canvas');
    btnCanvas.width = 128;
    btnCanvas.height = 128;
    const bCtx = btnCanvas.getContext('2d');
    bCtx.fillStyle = (color === 0x00ff88) ? '#121214' : '#ffffff';
    bCtx.font = 'Bold 70px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText(val, 64, 64);

    const btnTex = new THREE.CanvasTexture(btnCanvas);
    const labelGeo = new THREE.PlaneGeometry(btnWidth * span, btnDepth);
    const labelMat = new THREE.MeshBasicMaterial({ map: btnTex, transparent: true });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.y = btnHeight / 2 + 0.001;
    btnMesh.add(labelMesh);

    calcGroup.add(btnMesh);
    buttonMeshes.push(btnMesh);
  });
});

scene.add(calcGroup);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buttonMeshes, false);

  if (intersects.length > 0) {
    const clickedBtn = intersects[0].object;
    const val = clickedBtn.userData.value;

    clickedBtn.position.y = 0.03;
    setTimeout(() => {
      clickedBtn.position.y = clickedBtn.userData.originalY;
    }, 120);

    handleInput(val);
  }
});

function handleInput(val) {
  if (val === 'C') {
    currentInput = '0';
  } else if (val === '=') {
    try {
      const formattedInput = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
      currentInput = String(eval(formattedInput));
    } catch {
      currentInput = 'Error';
    }
  } else {
    if (currentInput === '0' || currentInput === 'Error') {
      currentInput = val;
    } else {
      currentInput += val;
    }
  }
  updateDisplay();
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
