import * as THREE from 'three';

const $ = (selector) => document.querySelector(selector);
const keys = Object.create(null);
const landmarks = [];
let scene, camera, renderer, car, wheels = [], clock;
let active = false, ready = false, speed = 0, credits = 0, found = 0;
let animationId = 0;

const mat = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(parent, x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addLandmark(name, x, z, color, kind = 'tower') {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.14, 10, 36),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  group.add(ring);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 9, 10),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 })
  );
  beam.position.y = 4.5;
  group.add(beam);

  if (kind === 'charminar') {
    addBox(group, 0, 4, 0, 8, 8, 7, mat(0xbba98c));
    for (const px of [-3, 3]) for (const pz of [-2.5, 2.5]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 10, 14), mat(0xd2c1a0));
      tower.position.set(px, 8, pz);
      group.add(tower);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), mat(0xe9a844));
      dome.position.set(px, 13, pz);
      group.add(dome);
    }
  } else {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 15, 14), mat(color));
    tower.position.y = 7.5;
    group.add(tower);
  }
  landmarks.push({ name, x, z, found: false, group, ring });
}

function addBuilding(x, z, w, d, h, index) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  const colors = [0x777d80, 0x9b8c7c, 0x6d7a80, 0xb09d83, 0x59636c];
  addBox(group, 0, h / 2, 0, w, h, d, mat(colors[index % colors.length]));
  const windowMat = mat(0x294657, 0.3, 0.25);
  for (let floor = 0; floor < Math.floor(h / 3); floor++) {
    for (const side of [-1, 1]) {
      for (let col = -1; col <= 1; col++) {
        addBox(group, col * w * 0.27, 1.2 + floor * 2.5, side * (d / 2 + 0.025), w * 0.13, 1.1, 0.05, windowMat);
      }
    }
  }
}

function createWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9db3c2);
  scene.fog = new THREE.Fog(0x9db3c2, 85, 245);

  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 600);
  renderer = new THREE.WebGLRenderer({
    canvas: $('#view'), antialias: true, powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xd8edff, 0x555044, 2.1));
  const sun = new THREE.DirectionalLight(0xffe1b3, 2.0);
  sun.position.set(-30, 65, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  addBox(scene, 0, -0.45, 0, 250, 0.5, 250, mat(0x65745e));
  const roadMat = mat(0x252c32);
  const lineMat = mat(0xe5c879);
  for (let i = -4; i <= 4; i++) {
    addBox(scene, i * 30, -0.08, 0, 12, 0.16, 240, roadMat);
    addBox(scene, 0, -0.08, i * 30, 240, 0.16, 12, roadMat);
    for (let j = -9; j <= 9; j++) {
      addBox(scene, i * 30, 0.02, j * 12, 0.15, 0.03, 4, lineMat);
      addBox(scene, j * 12, 0.02, i * 30, 4, 0.03, 0.15, lineMat);
    }
  }

  let index = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    if ((i + j) % 3 === 0) continue;
    addBuilding(
      i * 30 + (i % 2 ? 10 : -10), j * 30 + (j % 2 ? 10 : -10),
      10 + Math.abs(i * 3 + j) % 5, 10 + Math.abs(j * 2 + i) % 5,
      12 + Math.abs(i * j) % 7 * 3, index++
    );
  }

  landmarks.length = 0;
  addLandmark('CHARMINAR', 0, 0, 0xe9a844, 'charminar');
  addLandmark('HITEC CITY', 58, -58, 0x65c7ff);
  addLandmark('HUSSAIN SAGAR', -58, 58, 0x69d7d1);
  addLandmark('GOLCONDA FORT', 58, 58, 0xd9a56d);
  addLandmark('DURGAM CHERUVU', -58, -58, 0x8ad4ff);

  car = new THREE.Group();
  scene.add(car);
  const body = mat(0xc64b32, 0.4, 0.2);
  addBox(car, 0, 0.85, 0, 2.3, 0.75, 4.2, body);
  addBox(car, 0, 1.45, -0.25, 1.8, 0.75, 2.1, body);
  addBox(car, 0, 1.48, -0.25, 1.65, 0.58, 1.95, mat(0x243c4a, 0.2, 0.3));
  wheels = [];
  for (const x of [-1.16, 1.16]) for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.28, 18), mat(0x101214));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, z);
    car.add(wheel);
    wheels.push(wheel);
  }
  resetCar();
  clock = new THREE.Clock();
  ready = true;
}

function resetCar() {
  if (!car) return;
  car.position.set(0, 0, 14);
  car.rotation.set(0, 0, 0);
  speed = 0;
  if (camera) {
    camera.position.set(0, 5, 4);
    camera.lookAt(car.position.x, car.position.y + 1, car.position.z);
  }
}

function notify(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => element.classList.remove('show'), 1900);
}

function update(dt) {
  if (!car || !camera) return;
  const forward = keys.w || keys.arrowup;
  const reverse = keys.s || keys.arrowdown;
  const left = keys.a || keys.arrowleft;
  const right = keys.d || keys.arrowright;
  const braking = keys[' '];

  if (forward) speed += 25 * dt;
  else if (reverse) speed -= 18 * dt;
  speed *= Math.pow(braking ? 0.86 : 0.985, dt * 60);
  if (keys.shift && forward) speed += 16 * dt;
  speed = THREE.MathUtils.clamp(speed, -12, 45);

  const steering = (right ? 1 : 0) - (left ? 1 : 0);
  if (Math.abs(speed) > 0.3) {
    car.rotation.y -= steering * dt * (0.9 + Math.abs(speed) * 0.025) * (speed < 0 ? -1 : 1);
  }
  const direction = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  car.position.addScaledVector(direction, speed * dt);
  car.position.x = THREE.MathUtils.clamp(car.position.x, -116, 116);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -116, 116);
  wheels.forEach(wheel => { wheel.rotation.x += speed * dt * 1.7; });

  const cameraOffset = new THREE.Vector3(0, 5, -11).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
  const cameraTarget = car.position.clone().add(cameraOffset);
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt));
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  $('#speed').textContent = String(Math.round(Math.abs(speed) * 2.3)).padStart(3, '0');
  for (const point of landmarks) {
    if (!point.found && Math.hypot(car.position.x - point.x, car.position.z - point.z) < 10) {
      point.found = true;
      found++;
      credits += 100;
      $('#credits').textContent = String(credits).padStart(3, '0');
      $('#progress').style.width = `${(found / landmarks.length) * 100}%`;
      $('#count').textContent = `${found} / ${landmarks.length} LANDMARKS DISCOVERED`;
      $('#mission').textContent = found >= landmarks.length ? 'CITY LEGEND' : 'LANDMARK DISCOVERED';
      $('#missionText').textContent = found >= landmarks.length
        ? 'You explored every featured landmark. Keep cruising!'
        : `You discovered ${point.name}. Find another glowing landmark.`;
      notify(`${point.name} DISCOVERED  +100 CREDITS`);
    }
    point.ring.rotation.z += dt * 0.7;
  }

  const distance = Math.hypot(car.position.x, car.position.z);
  $('#district').textContent = distance < 38 ? 'OLD CITY DISTRICT'
    : car.position.x > 25 && car.position.z < 0 ? 'HITEC CITY'
    : car.position.z > 25 ? 'HUSSAIN SAGAR' : 'HYDERABAD OUTSKIRTS';
}

function frame() {
  if (!active) return;
  animationId = requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
}

function showGameError(error) {
  console.error('HYDERABAD 2.0 startup error:', error);
  active = false;
  cancelAnimationFrame(animationId);
  const message = error?.message || 'Unknown graphics error';
  const panel = $('#startupError');
  if (panel) {
    panel.textContent = `The game could not start: ${message}. Try Chrome or Edge with hardware acceleration enabled, then reload.`;
    panel.classList.remove('hidden');
  }
}

function startGame() {
  $('#startupError')?.classList.add('hidden');
  $('#landing').classList.add('hidden');
  $('#game').classList.remove('hidden');
  try {
    if (!ready) createWorld();
    active = true;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    clock.start();
    renderer.render(scene, camera); // Draw a frame immediately so the screen is never blank.
    cancelAnimationFrame(animationId);
    frame();
    $('#loading').style.opacity = '0';
    setTimeout(() => $('#loading').classList.add('hidden'), 450);
    notify('WELCOME TO HYDERABAD. DRIVE TO THE GLOWING LANDMARKS.');
  } catch (error) {
    $('#game').classList.add('hidden');
    $('#landing').classList.remove('hidden');
    showGameError(error);
  }
}

function exitGame() {
  active = false;
  cancelAnimationFrame(animationId);
  Object.keys(keys).forEach(key => { keys[key] = false; });
  $('#game').classList.add('hidden');
  $('#landing').classList.remove('hidden');
  $('#loading').classList.remove('hidden');
  $('#loading').style.opacity = '1';
}

['navPlay', 'heroPlay', 'bottomPlay'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', startGame);
});
$('#exit').addEventListener('click', exitGame);

addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  if (key === 'r' && car && active) {
    resetCar();
    notify('VEHICLE RESET');
  }
});
addEventListener('keyup', event => { keys[event.key.toLowerCase()] = false; });

// Touch controls use pointer capture so a finger can slide off a button without leaving it stuck.
document.querySelectorAll('.touch-controls [data-key]').forEach(button => {
  const key = button.dataset.key;
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    button.setPointerCapture?.(event.pointerId);
    keys[key] = true;
    button.classList.add('pressed');
  });
  const release = event => {
    event.preventDefault();
    event.stopPropagation();
    keys[key] = false;
    button.classList.remove('pressed');
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, release));
});

function clearKeys() { Object.keys(keys).forEach(key => { keys[key] = false; }); }
addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeys(); });
addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
});
