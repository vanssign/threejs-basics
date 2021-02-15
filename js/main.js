let scene,
  camera,
  renderer,
  groundPlane,
  crateTexture,
  crateBumpMap,
  crateNormalMap,
  ambientLight,
  light,
  mesh,
  instructionText,
  clock;

let keyboard = {};
let defaultPlayerSpeed = 0.15;
let player = {
  height: 1.8,
  speed: defaultPlayerSpeed,
  turnSpeed: Math.PI * 0.01,
};

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
let loadingManager = null;
let RESOURCES_LOADED = false;
let WIRE_FRAME = false;

// Models index
var models = {
  tent: {
    obj: "models/Tent_Poles_01.obj",
    mtl: "models/Tent_Poles_01.mtl",
    mesh: null,
  },
  campfire: {
    obj: "models/Campfire_01.obj",
    mtl: "models/Campfire_01.mtl",
    mesh: null,
  },
  pirateship: {
    obj: "models/Pirateship.obj",
    mtl: "models/Pirateship.mtl",
    mesh: null,
  },
  uzi: {
		obj:"models/uziGold.obj",
		mtl:"models/uziGold.mtl",
		mesh: null,
		castShadow:false
	}
};

// Meshes index
var meshes = {};
//bullets array
var bullets=[];

function init() {
  clock = new THREE.Clock();
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

  loadingManager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };

  loadingManager.onLoad = function () {
    console.log("loaded all resources");
    RESOURCES_LOADED = true;
    onResourcesLoad();
  };
  //choosing default renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });

  //kinda bg color
  renderer.setClearColor("#b8e2fc");
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

  const fontLoader = new THREE.FontLoader(loadingManager);

  fontLoader.load("fonts/helvetica.json", function (font) {
    const txtgeometry = new THREE.TextGeometry(
      "WASD: move\nArrow Keys: turn\nLShift: run",
      {
        font: font,
        size: 0.5,
        height: 0.5,
        curveSegments: 12,
      }
    );
    var txt_mat = new THREE.MeshPhongMaterial({
      color: 0x000000,
      wireframe: WIRE_FRAME,
    });
    var txt_mesh = new THREE.Mesh(txtgeometry, txt_mat);
    txt_mesh.position.z = 1;
    txt_mesh.position.y=5;
    txt_mesh.rotation.y = Math.PI;
    scene.add(txt_mesh);
  });
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

  groundTexture = textureLoader.load("textures/Stone_Path_006_basecolor.jpg");
  groundNormalMap = textureLoader.load("textures/Stone_Path_006_normal.jpg");
  groundAOMap = textureLoader.load(
    "textures/Stone_Path_006_ambientOcclusion.jpg"
  );
  groundRoughness = textureLoader.load("textures/Stone_Path_006_roughness.jpg");
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(100, 100);
  groundNormalMap.wrapS = THREE.RepeatWrapping;
  groundNormalMap.wrapT = THREE.RepeatWrapping;
  groundNormalMap.repeat.set(100, 100);
  groundRoughness.wrapS = THREE.RepeatWrapping;
  groundRoughness.wrapT = THREE.RepeatWrapping;
  groundRoughness.repeat.set(100, 100);
  groundAOMap.wrapS = THREE.RepeatWrapping;
  groundAOMap.wrapT = THREE.RepeatWrapping;
  groundAOMap.repeat.set(100, 100);

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

  const groundGeometry = new THREE.PlaneGeometry(800, 800, 800, 800);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: groundTexture,
    normalMap: groundNormalMap,
    aoMap: groundAOMap,
    rougnessMap: groundRoughness,
  });
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x -= Math.PI / 2;
  // Floor can have shadows cast onto it
  groundPlane.receiveShadow = true;

  
  // REMEMBER: Loading in Javascript is asynchronous, so you need
  // to wrap the code in a function and pass it the index. If you
  // don't, then the index '_key' can change while the model is being
  // downloaded, and so the wrong model will be matched with the wrong
  // index key.
  for (var _key in models) {
    (function (key) {
      var mtlLoader = new THREE.MTLLoader(loadingManager);
      mtlLoader.load(models[key].mtl, function (materials) {
        materials.preload();

        var objLoader = new THREE.OBJLoader(loadingManager);

        objLoader.setMaterials(materials);
        objLoader.load(models[key].obj, function (mesh) {
          mesh.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
              if('castShadow' in models[key])
								node.castShadow = models[key].castShadow;
							else
								node.castShadow = true;
							
							if('receiveShadow' in models[key])
								node.receiveShadow = models[key].receiveShadow;
							else
								node.receiveShadow = true;
            }
          });
          models[key].mesh = mesh;
        });
      });
    })(_key);
  }

  scene.add(light);
  scene.add(groundPlane);
  scene.add(crate);
  scene.add(instructionText);
  camera.position.set(0, player.height, -5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
}

function onResourcesLoad() {
  // Clone models into meshes.
  meshes["tent1"] = models.tent.mesh.clone();
  meshes["tent2"] = models.tent.mesh.clone();
  meshes["campfire1"] = models.campfire.mesh.clone();
  meshes["campfire2"] = models.campfire.mesh.clone();
  meshes["pirateship"] = models.pirateship.mesh.clone();

  // Reposition individual meshes, then add meshes to scene
  meshes["tent1"].position.set(-5, 0, 4);
  scene.add(meshes["tent1"]);

  meshes["tent2"].position.set(-8, 0, 4);
  scene.add(meshes["tent2"]);

  meshes["campfire1"].position.set(-5, 0, 1);
  meshes["campfire2"].position.set(-8, 0, 1);

  scene.add(meshes["campfire1"]);
  scene.add(meshes["campfire2"]);

  meshes["pirateship"].position.set(-11, -1, 1);
  meshes["pirateship"].rotation.set(0, Math.PI, 0); // Rotate it to face the other way.
  scene.add(meshes["pirateship"]);

  // player weapon
	meshes["playerweapon"] = models.uzi.mesh.clone();
	meshes["playerweapon"].position.set(0,2,-4);
	meshes["playerweapon"].scale.set(10,10,10);
	scene.add(meshes["playerweapon"]);
}

function animate() {

  if (RESOURCES_LOADED == false) {
    requestAnimationFrame(animate);
    renderer.render(loadingScreen.scene, loadingScreen.camera);
    return;
  }
  requestAnimationFrame(animate);
  let time = Date.now()*0.0005;
  let delta=clock.getDelta();

  // go through bullets array and update position
	// remove bullets when appropriate
	for(var index=0; index<bullets.length; index+=1){
		if( bullets[index] === undefined ) continue;
		if( bullets[index].alive == false ){
			bullets.splice(index,1);
			continue;
		}
		
		bullets[index].position.add(bullets[index].velocity);
	}

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
  if (keyboard[16]) {
    //shiftkey
    player.speed = defaultPlayerSpeed * 1.8;
  }
  if (player.speed != defaultPlayerSpeed) {
    if (!keyboard[16]) player.speed = defaultPlayerSpeed;
  }
  
  if(keyboard[32]){
    var bullet = new THREE.Mesh(
			new THREE.SphereGeometry(0.05,8,8),
			new THREE.MeshBasicMaterial({color:0xffffff})
		);
    // position the bullet to come from the player's weapon
		bullet.position.set(
			meshes["playerweapon"].position.x,
			meshes["playerweapon"].position.y + 0.15,
			meshes["playerweapon"].position.z
		);
		
		// set the velocity of the bullet
		bullet.velocity = new THREE.Vector3(
			-Math.sin(camera.rotation.y),
			0,
			Math.cos(camera.rotation.y)
		);
    bullet.alive=true;
    setTimeout(function(){
      bullet.alive=false;
      scene.remove(bullet);
    },1000)
    // add to scene, array, and set the delay to 10 frames
		bullets.push(bullet);
		scene.add(bullet);
  }

  // position the gun in front of the camera
	meshes["playerweapon"].position.set(
		camera.position.x - Math.sin(camera.rotation.y + Math.PI/6) * 0.75,
		camera.position.y - 0.5+
    + Math.sin(time*4 + camera.position.x + camera.position.z)*0.01,
		camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75
	);
	meshes["playerweapon"].rotation.set(
		camera.rotation.x,
		camera.rotation.y - Math.PI,
		camera.rotation.z
	);
	
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
