let scene,
  camera,
  renderer,
  cube,
  groundPlane,
  crateTexture,
  crateBumpMap,
  crateNormalMap,
  ambientLight,
  light,
  tent;
let keyboard = {};
let player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };

let loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  ),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0, 5),
    new THREE.MeshBasicMaterial({ color: 0x444444 })
  ),
};
let loadingManager=null;
let RESOURCES_LOADED = false;
let WIRE_FRAME = false;

// Models index
var models = {
	tent: {
		obj:"models/Tent_Poles_01.obj",
		mtl:"models/Tent_Poles_01.mtl",
		mesh: null
	},
	campfire: {
		obj:"models/Campfire_01.obj",
		mtl:"models/Campfire_01.mtl",
		mesh: null
	},
	pirateship: {
		obj:"models/Pirateship.obj",
		mtl:"models/Pirateship.mtl",
		mesh: null
	}
};

// Meshes index
var meshes = {}

function init() {
  scene = new THREE.Scene();
  //arguments
  //FOV,aspectRatio,nearClippingPlane,farClippingPlane
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Set up the loading screen's scene.
  // It can be treated just like our main scene.
  loadingScreen.box.position.set(0, 0, 5);
  loadingScreen.camera.lookAt(loadingScreen.box.position);
  loadingScreen.scene.add(loadingScreen.box);

  // Create a loading manager to set RESOURCES_LOADED when appropriate.
	// Pass loadingManager to all resource loaders.
	loadingManager = new THREE.LoadingManager();
	
	loadingManager.onProgress = function(item, loaded, total){
		console.log(item, loaded, total);
	};
	
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
		RESOURCES_LOADED = true;
	};
  //choosing default renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });

  //kinda bg color
  renderer.setClearColor("#87ceeb");
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap, (type = THREE.PCFSoftShadowMap);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshPhongMaterial({
    color: 0xff8c00,
    wireframe: WIRE_FRAME,
  });
  cube = new THREE.Mesh(geometry, material);
  cube.position.y = 1;
  // The cube can have shadows cast onto it, and it can cast shadows
  cube.receiveShadow = true;
  cube.castShadow = true;

  // LIGHTS
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  light = new THREE.PointLight(0xffffff, 0.8, 180);
  light.position.set(-3, 6, -3);
  light.castShadow = true;
  // Will not light anything closer than 0.1 units or further than 25 units
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 25;

  // Texture Loading
  var textureLoader = new THREE.TextureLoader(loadingManager);
  crateTexture = textureLoader.load("textures/crate0_diffuse.png");
  crateBumpMap = textureLoader.load("textures/crate0_bump.png");
  crateNormalMap = textureLoader.load("textures/crate0_normal.png");

  groundTexture=textureLoader.load('textures/Stone_Path_006_basecolor.jpg');
  groundNormalMap=textureLoader.load("textures/Stone_Path_006_normal.jpg");
  groundAOMap=textureLoader.load("textures/Stone_Path_006_ambientOcculsion.jpg")
  groundRoughness=textureLoader.load("textures/Stone_Path_006_roughness.jpg")
  


  // Create mesh with these textures
  crate = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: crateTexture,
      bumpMap: crateBumpMap,
      normalMap: crateNormalMap,
    })
  );
  crate.position.set(2.5, 3 / 2, 2.5);
  crate.receiveShadow = true;
  crate.castShadow = true;

  const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 1000, 1000);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    // map:groundTexture,
    // normalMap:groundNormalMap,
    // aoMap :groundAOMap,
    // rougnessMap:groundRoughness
  });
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x -= Math.PI / 2;
  // Floor can have shadows cast onto it
  groundPlane.receiveShadow = true;

  // Model/material loading!
  var mtlLoader = new THREE.MTLLoader(loadingManager);
  mtlLoader.load("../models/Tent_Poles_01.mtl", function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);

    objLoader.load("../models/Tent_Poles_01.obj", function (tent) {
      //adding shadows to models objects
      tent.traverse(function (node) {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      scene.add(tent);
      tent.position.set(-5, 0, 4);
      tent.rotation.y = -Math.PI / 4;
    });
  });
  scene.add(light);
  scene.add(groundPlane);
  scene.add(cube);
  scene.add(crate);
  camera.position.set(0, player.height, -5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
}

function animate() {
  if(RESOURCES_LOADED==false){
    requestAnimationFrame(animate);
    renderer.render(loadingScreen.scene,loadingScreen.camera);
    return;
  }
  requestAnimationFrame(animate);

  // const cubeTime = 0.01;
  // cube.rotation.x += cubeTime;
  // cube.rotation.y += cubeTime;
  // Keyboard movement inputs
  if (keyboard[87]) {
    // W key
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[83]) {
    // S key
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[65]) {
    // A key
    // Redirect motion by 90 degrees
    camera.position.x +=
      Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
    camera.position.z +=
      -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
  }
  if (keyboard[68]) {
    // D key
    camera.position.x +=
      Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
    camera.position.z +=
      -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
  }

  // Keyboard turn inputs
  if (keyboard[37]) {
    // left arrow key
    camera.rotation.y -= player.turnSpeed;
  }
  if (keyboard[39]) {
    // right arrow key
    camera.rotation.y += player.turnSpeed;
  }
  renderer.render(scene, camera);
}

//responsiveness
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function keydown(e) {
  keyboard[e.keyCode] = true;
}

function keyup(e) {
  keyboard[e.keyCode] = false;
}

window.addEventListener("resize", onWindowResize, false);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

init();
animate();
