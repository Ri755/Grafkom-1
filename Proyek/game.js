// Deklarasi variabel dasar
let isFireOn = true;
let fireIntensityLevel = 2; // Mulai dengan api normal
let timeState = 1; // Set waktu awal ke sore hari
let isBurning = false;
let burnTimer = null;
let playerLight = null;
let playerFireParticles = [];
let isFlashlightOn = false;
let flashlightLight = null;
let activeSlotIndex = 0;
let stickInventory = 0;
let flashlightInventory = 0;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isRunning = false;
let mouseX = 0;
let mouseY = 0;
let cameraRotationX = 0;
let cameraRotationY = 0;
let isJumping = false;
let isCrouching = false;
let jumpVelocity = 0;
let isInLeaves = false;
let isInBush = false;
let audioUnlocked = false;
let chocoCharacter = null;
let dollModel = null;
let hasWon = false;

// Tambahkan variabel untuk health system
let chocoSpeed = 0.05; // Kecepatan Choco Character
let isChocoAttacking = false; // Status serangan Choco
let playerHealth = 100; // Health point player
let lastAttackTime = 0; // Waktu serangan terakhir
let attackCooldown = 2000; // Cooldown serangan (2 detik)
let isGameOver = false; // Status game over
let totalHealth = 100; // Total health maksimum

// Variabel untuk backpack
let hasBackpack = false;
const backpackSlots = [];
const backpackSlotSize = '50px';

// Inisialisasi scene, camera, dan renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Batasi pixel ratio
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Tambahkan FBXLoader
const fbxLoader = new THREE.FBXLoader();
const textureLoader = new THREE.TextureLoader();

// Inisialisasi audio
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Membuat audio untuk pagi, malam/sore, dan horror
const morningSound = new THREE.Audio(audioListener);
const nightSound = new THREE.Audio(audioListener);
const horrorSound = new THREE.Audio(audioListener);
const chocoSound = new THREE.Audio(audioListener);
let isChocoSoundLoaded = false;

// Tambahkan logging untuk status AudioContext
console.log('Status AudioContext awal:', audioListener.context.state);

// Fungsi untuk memastikan audio context sudah diaktifkan
function initAudioContext() {
    if (audioListener.context.state === 'suspended') {
        audioListener.context.resume();
    }
}

// Event listener untuk mengaktifkan audio context saat ada interaksi pengguna
document.addEventListener('click', initAudioContext);
document.addEventListener('keydown', initAudioContext);

// Membuat elemen kontrol audio
const audioControlDiv = document.createElement('div');
audioControlDiv.style.position = 'absolute';
audioControlDiv.style.top = '10px';
audioControlDiv.style.right = '10px';
audioControlDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
audioControlDiv.style.padding = '10px';
audioControlDiv.style.borderRadius = '5px';
audioControlDiv.style.color = 'white';
audioControlDiv.innerHTML = `
    <div>Kontrol Audio</div>
    <button id="playAudio">Play Audio</button>
    <input type="range" id="volumeControl" min="0" max="1" step="0.1" value="0.5">
    <span id="volumeValue">50%</span>
    <div id="audioStatus">Loading...</div>
`;
document.body.appendChild(audioControlDiv);

// Modifikasi fungsi untuk memainkan audio
function playAudioForCurrentTime() {
    try {
        // Hentikan semua audio yang sedang diputar
        if (morningSound.isPlaying) morningSound.stop();
        if (nightSound.isPlaying) nightSound.stop();
        if (horrorSound.isPlaying) horrorSound.stop();
        
        // Cek status audio context
        if (audioListener.context.state === 'suspended') {
            console.log('Mencoba mengaktifkan audio context...');
            audioListener.context.resume().then(() => {
                console.log('Audio context berhasil diaktifkan');
                playAudioBasedOnTime();
            });
        } else {
            playAudioBasedOnTime();
        }
    } catch (error) {
        console.error('Error saat memainkan audio:', error);
    }
}

// Fungsi untuk memainkan audio berdasarkan waktu
function playAudioBasedOnTime() {
    try {
        const volume = parseFloat(document.getElementById('volumeControl').value);
        
        if (timeState === 0) { // Pagi
            if (morningSound.buffer) {
                morningSound.setVolume(volume);
                morningSound.play();
                console.log('Memainkan audio pagi');
            }
        } else if (timeState === 1 || timeState === 2) { // Sore atau Malam
            if (timeState === 2 && !isFireOn) { // Malam dan api mati
                if (horrorSound.buffer) {
                    horrorSound.setVolume(volume);
                    horrorSound.play();
                    console.log('Memainkan audio horror');
                }
            } else {
                if (nightSound.buffer) {
                    nightSound.setVolume(volume);
                    nightSound.play();
                    console.log('Memainkan audio malam');
                }
            }
        }
    } catch (error) {
        console.error('Error dalam playAudioBasedOnTime:', error);
    }
}

// Event listener untuk tombol play audio
document.getElementById('playAudio').addEventListener('click', function() {
    playAudioForCurrentTime();
    this.textContent = 'Pause Audio';
});

// Event listener untuk kontrol volume
document.getElementById('volumeControl').addEventListener('input', function(e) {
    const volume = parseFloat(e.target.value);
    document.getElementById('volumeValue').textContent = Math.round(volume * 100) + '%';
    
    // Update volume untuk semua audio
    morningSound.setVolume(volume);
    nightSound.setVolume(volume);
    horrorSound.setVolume(volume);
});

// Modifikasi fungsi changeTime untuk menangani audio dengan lebih baik
function changeTime() {
    const previousTime = timeState;
    timeState = (timeState + 1) % 3;
    
    // Update scene berdasarkan waktu
    switch(timeState) {
        case 0: // Siang
            scene.background = new THREE.Color(0x87CEEB);
            sun.position.set(0, 20, -5);
            sunMaterial.color.set(0xffff00);
            sunLight.intensity = 1;
            sunLight.color.set(0xffffff);
            ambientLight.intensity = 0.5;
            fireLight.intensity = 1.5;
            fireLight.distance = 20;
            floorMaterial.color.set(0x00ff00);
            break;
            
        case 1: // Sore
            scene.background = new THREE.Color(0xff7f50);
            sun.position.set(30, 10, -50);
            sunMaterial.color.set(0xff4500);
            sunLight.intensity = 0.5;
            sunLight.color.set(0xffa500);
            ambientLight.intensity = 0.3;
            fireLight.intensity = 2.5;
            fireLight.distance = 25;
            floorMaterial.color.set(0x006400);
            break;
            
        case 2: // Malam
            scene.background = new THREE.Color(0x000033);
            sun.position.set(0, -20, -5);
            sunMaterial.color.set(0x000000);
            sunLight.intensity = 0;
            ambientLight.intensity = 0.1;
            fireLight.intensity = 3.5;
            fireLight.distance = 30;
            floorMaterial.color.set(0x003300);
            break;
    }
    
    // Update audio hanya jika waktu berubah
    if (previousTime !== timeState) {
        playAudioForCurrentTime();
    }
    
    // Update visibilitas Choco Character
    updateChocoVisibility();
}

// ... existing code ...

// Load audio files
const audioLoader = new THREE.AudioLoader();
const audioStatus = document.getElementById('audioStatus');

// Tambahkan variabel untuk melacak status loading audio
let isMorningSoundLoaded = false;
let isNightSoundLoaded = false;
let isHorrorSoundLoaded = false;

// Modifikasi loading audio pagi
audioLoader.load('Asset/sound/sound_hutan_based_daylight/hutan_pagi.mp3', 
    function(buffer) {
        morningSound.setBuffer(buffer);
        morningSound.setLoop(true);
        morningSound.setVolume(0.5);
        isMorningSoundLoaded = true;
        audioStatus.innerHTML = '<div style="color: green;">Audio pagi siap</div>';
        checkAllAudioLoaded();
    },
    function(xhr) {
        audioStatus.innerHTML = `Loading audio pagi: ${Math.round(xhr.loaded / xhr.total * 100)}%`;
    },
    function(error) {
        console.error('Error loading audio pagi:', error);
        audioStatus.innerHTML = '<div style="color: red;">Error loading audio pagi</div>';
    }
);

// Modifikasi loading audio malam/sore
audioLoader.load('Asset/sound/sound_hutan_based_daylight/hutan_malam_or_sore.mp3', 
    function(buffer) {
        nightSound.setBuffer(buffer);
        nightSound.setLoop(true);
        nightSound.setVolume(0.5);
        isNightSoundLoaded = true;
        audioStatus.innerHTML += '<br/><div style="color: green;">Audio malam/sore siap</div>';
        checkAllAudioLoaded();
    },
    function(xhr) {
        audioStatus.innerHTML += `<br/>Loading audio malam/sore: ${Math.round(xhr.loaded / xhr.total * 100)}%`;
    },
    function(error) {
        console.error('Error loading audio malam/sore:', error);
        audioStatus.innerHTML += '<br/><div style="color: red;">Error loading audio malam/sore</div>';
    }
);

// Modifikasi loading audio horror
audioLoader.load('Asset/sound/horror.mp3', 
    function(buffer) {
        horrorSound.setBuffer(buffer);
        horrorSound.setLoop(true);
        horrorSound.setVolume(0.5);
        isHorrorSoundLoaded = true;
        audioStatus.innerHTML += '<br/><div style="color: green;">Audio horror siap</div>';
        checkAllAudioLoaded();
    },
    function(xhr) {
        audioStatus.innerHTML += `<br/>Loading audio horror: ${Math.round(xhr.loaded / xhr.total * 100)}%`;
    },
    function(error) {
        console.error('Error loading audio horror:', error);
        audioStatus.innerHTML += '<br/><div style="color: red;">Error loading audio horror</div>';
    }
);

// Modifikasi loading audio untuk Choco Character
audioLoader.load('Asset/sound/tung-tung-jadi.mp3',
    function(buffer) {
        chocoSound.setBuffer(buffer);
        chocoSound.setVolume(0.5);
        chocoSound.setLoop(true); // Mengaktifkan loop
        isChocoSoundLoaded = true;
        console.log('Audio Choco Character berhasil dimuat');
    },
    function(xhr) {
        console.log('Loading Choco audio:', (xhr.loaded / xhr.total * 100) + '%');
    },
    function(error) {
        console.error('Error loading Choco audio:', error);
    }
);

let loadedCount = 0;
function checkAllAudioLoaded() {
    loadedCount++;
    if (loadedCount === 4) {
        audioStatus.innerHTML = '<div style="color: green;">Semua audio siap</div>';
    }
}

// Membuat elemen untuk menampilkan koordinat dan opacity
const coordDiv = document.createElement('div');
coordDiv.style.position = 'absolute';
coordDiv.style.top = '10px';
coordDiv.style.left = '10px';
coordDiv.style.color = 'white';
coordDiv.style.fontFamily = 'Arial';
coordDiv.style.fontSize = '14px';
coordDiv.style.textShadow = '1px 1px 1px black';
document.body.appendChild(coordDiv);

// Membuat crosshair di tengah layar
const crosshairDiv = document.createElement('div');
crosshairDiv.style.position = 'absolute';
crosshairDiv.style.top = '50%';
crosshairDiv.style.left = '50%';
crosshairDiv.style.transform = 'translate(-50%, -50%)';
crosshairDiv.style.width = '20px';
crosshairDiv.style.height = '20px';
crosshairDiv.style.pointerEvents = 'none';
crosshairDiv.innerHTML = `
    <div style="position: absolute; width: 2px; height: 20px; background-color: red; left: 9px; top: 0;"></div>
    <div style="position: absolute; width: 20px; height: 2px; background-color: red; left: 0; top: 9px;"></div>
`;
document.body.appendChild(crosshairDiv);

// Membuat elemen untuk keterangan api unggun
const campfireInfoDiv = document.createElement('div');
campfireInfoDiv.style.position = 'absolute';
campfireInfoDiv.style.top = '40px';
campfireInfoDiv.style.left = '10px';
campfireInfoDiv.style.color = 'white';
campfireInfoDiv.style.fontFamily = 'Arial';
campfireInfoDiv.style.fontSize = '14px';
campfireInfoDiv.style.textShadow = '1px 1px 1px black';
campfireInfoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
campfireInfoDiv.style.padding = '10px';
campfireInfoDiv.style.borderRadius = '5px';
campfireInfoDiv.style.maxWidth = '300px';
document.body.appendChild(campfireInfoDiv);

// Membuat elemen untuk efek blur
const blurDiv = document.createElement('div');
blurDiv.style.position = 'absolute';
blurDiv.style.top = '0';
blurDiv.style.left = '0';
blurDiv.style.width = '100%';
blurDiv.style.height = '100%';
blurDiv.style.pointerEvents = 'none';
blurDiv.style.transition = 'opacity 0.3s';
blurDiv.style.opacity = '0';
blurDiv.style.backdropFilter = 'blur(8px)';
blurDiv.style.backgroundColor = 'rgba(34, 139, 34, 0.3)';
document.body.appendChild(blurDiv);

// Membuat elemen untuk efek terbakar
const burnDiv = document.createElement('div');
burnDiv.style.position = 'absolute';
burnDiv.style.top = '0';
burnDiv.style.left = '0';
burnDiv.style.width = '100%';
burnDiv.style.height = '100%';
burnDiv.style.pointerEvents = 'none';
burnDiv.style.transition = 'opacity 0.3s';
burnDiv.style.opacity = '0';
burnDiv.style.backgroundColor = 'rgba(255, 68, 0, 0.3)';
document.body.appendChild(burnDiv);

// Membuat lantai (rumput) dengan pola kotak
const floorSize = 100;
const gridSize = 1;

// Load texture dirt
const dirtTexture = textureLoader.load('Asset/2d asset/dirt_texture.jpg');
dirtTexture.wrapS = THREE.RepeatWrapping;
dirtTexture.wrapT = THREE.RepeatWrapping;
dirtTexture.repeat.set(20, 20); // Mengulang texture untuk menutupi seluruh lantai

// Layer 1: Lantai dengan texture dirt
const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
const floorMaterial = new THREE.MeshPhongMaterial({ 
    map: dirtTexture,
    side: THREE.DoubleSide,
    shininess: 0
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Menambahkan ambient light untuk pencahayaan keseluruhan
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Membuat api unggun
const campfireGroup = new THREE.Group();

// Membuat kayu bakar
const logGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
const logMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const log1 = new THREE.Mesh(logGeometry, logMaterial);
log1.rotation.x = Math.PI / 2;
log1.position.y = 0.2;
campfireGroup.add(log1);

const log2 = new THREE.Mesh(logGeometry, logMaterial);
log2.rotation.x = Math.PI / 2;
log2.rotation.z = Math.PI / 3;
log2.position.y = 0.2;
campfireGroup.add(log2);

const log3 = new THREE.Mesh(logGeometry, logMaterial);
log3.rotation.x = Math.PI / 2;
log3.rotation.z = -Math.PI / 3;
log3.position.y = 0.2;
campfireGroup.add(log3);

// Membuat partikel api
const particleCount = 50;
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.8
});

for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 0.5
    );
    particle.userData = {
        speed: Math.random() * 0.02 + 0.01,
        offset: Math.random() * Math.PI * 2
    };
    campfireGroup.add(particle);
    particles.push(particle);
}

// Menambahkan efek api
const fireGeometry = new THREE.ConeGeometry(0.5, 1, 8);
const fireMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff4400,
    transparent: true,
    opacity: 0.8,
    emissive: 0xff4400,
    emissiveIntensity: 0.5
});
const fire = new THREE.Mesh(fireGeometry, fireMaterial);
fire.position.y = 0.8;
campfireGroup.add(fire);

// Menambahkan cahaya api
const fireLight = new THREE.PointLight(0xffaa00, 2, 15);
fireLight.position.y = 0.5;
campfireGroup.add(fireLight);

// Menambahkan api unggun ke scene
campfireGroup.position.set(0, 0, -5);
scene.add(campfireGroup);

// Mengatur warna langit
scene.background = new THREE.Color(0x87CEEB);

// Posisi awal kamera
camera.position.set(0, 2, 5);
camera.lookAt(0, 2, 0);

// Variabel untuk kontrol
const moveSpeed = 0.1;
const runSpeed = 0.2; // Kecepatan lari
const mouseSensitivity = 0.0005;

// Variabel untuk loncat dan jongkok
const jumpForce = 0.15;
const gravity = 0.008;
const normalHeight = 2;
const crouchHeight = 1;

// Variabel untuk collision detection
const playerRadius = 0.5;

// Cahaya matahari
const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Cahaya matahari
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sunLight);

// Variabel untuk kunang-kunang
const fireflies = [];
const fireflyCount = 20;

// Membuat elemen inventori
const inventoryDiv = document.createElement('div');
inventoryDiv.style.position = 'fixed';
inventoryDiv.style.bottom = '20px';
inventoryDiv.style.left = '50%';
inventoryDiv.style.transform = 'translateX(-50%)';
inventoryDiv.style.display = 'flex';
inventoryDiv.style.gap = '5px'; // Jarak antar slot
inventoryDiv.style.zIndex = '100'; // Pastikan di atas elemen lain
document.body.appendChild(inventoryDiv);

// Membuat 9 slot inventori
const inventorySlots = [];
const slotSize = '50px';
const activeSlotBorder = '3px solid yellow'; // Border untuk slot aktif

for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.style.width = slotSize;
    slot.style.height = slotSize;
    slot.style.backgroundColor = 'rgba(128, 128, 128, 0.7)'; // Abu-abu transparan
    slot.style.border = '2px solid rgba(255, 255, 255, 0.8)'; // Border putih semi-transparan
    slot.style.boxSizing = 'border-box'; // Sertakan border dalam ukuran
    slot.style.display = 'flex';
    slot.style.justifyContent = 'center';
    slot.style.alignItems = 'center';
    slot.style.color = 'white';
    slot.style.fontSize = '12px';
    slot.textContent = i + 1; // Nomor slot
    inventoryDiv.appendChild(slot);
    inventorySlots.push(slot);
}

// Tambahkan variabel untuk melacak inventory yang aktif
let isInBackpack = false;

// Modifikasi event listener untuk roda mouse
document.addEventListener('wheel', (event) => {
    // Mencegah halaman ikut menggulir
    event.preventDefault();

    // Menentukan arah guliran
    if (event.deltaY > 0) {
        // Gulir ke bawah
        if (!isInBackpack) {
            // Di inventory utama
            if (activeSlotIndex < inventorySlots.length - 1) {
                activeSlotIndex++;
            } else if (hasBackpack) {
                // Pindah ke inventory backpack
                isInBackpack = true;
                activeSlotIndex = 0;
            }
        } else {
            // Di inventory backpack
            if (activeSlotIndex < backpackSlots.length - 1) {
                activeSlotIndex++;
            } else {
                // Kembali ke inventory utama
                isInBackpack = false;
                activeSlotIndex = 0;
            }
        }
    } else if (event.deltaY < 0) {
        // Gulir ke atas
        if (!isInBackpack) {
            // Di inventory utama
            if (activeSlotIndex > 0) {
                activeSlotIndex--;
            } else if (hasBackpack) {
                // Pindah ke inventory backpack
                isInBackpack = true;
                activeSlotIndex = backpackSlots.length - 1;
            }
        } else {
            // Di inventory backpack
            if (activeSlotIndex > 0) {
                activeSlotIndex--;
            } else {
                // Kembali ke inventory utama
                isInBackpack = false;
                activeSlotIndex = inventorySlots.length - 1;
            }
        }
    }

    // Update tampilan
    updateActiveSlotDisplay();
});

// Modifikasi fungsi updateActiveSlotDisplay
function updateActiveSlotDisplay() {
    // Update inventory utama
    inventorySlots.forEach((slot, index) => {
        if (index === activeSlotIndex && !isInBackpack) {
            slot.style.border = activeSlotBorder;
        } else {
            slot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        }
    });

    // Update inventory backpack
    if (hasBackpack) {
        backpackSlots.forEach((slot, index) => {
            if (index === activeSlotIndex && isInBackpack) {
                slot.style.border = activeSlotBorder;
            } else {
                slot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            }
        });
    }
}

// Event listeners untuk keyboard
document.addEventListener('keydown', (event) => {
    if (isGameOver) return; // Jika game over, jangan proses input

    switch(event.key.toLowerCase()) {
        case 'w': 
            moveForward = true; 
            if (!isFootstepPlaying && footstepSound.isPlaying === false) {
                footstepSound.play();
                isFootstepPlaying = true;
            }
            break;
        case 's': 
            moveBackward = true; 
            if (!isFootstepPlaying && footstepSound.isPlaying === false) {
                footstepSound.play();
                isFootstepPlaying = true;
            }
            break;
        case 'a': 
            moveLeft = true; 
            if (!isFootstepPlaying && footstepSound.isPlaying === false) {
                footstepSound.play();
                isFootstepPlaying = true;
            }
            break;
        case 'd': 
            moveRight = true; 
            if (!isFootstepPlaying && footstepSound.isPlaying === false) {
                footstepSound.play();
                isFootstepPlaying = true;
            }
            break;
        case '1': changeTime(); break;
        case '2': 
            fireIntensityLevel = (fireIntensityLevel + 1) % 4;
            changeFireIntensity();
            break;
        case ' ': 
            if (!isJumping) {
                isJumping = true;
                jumpVelocity = jumpForce;
            }
            break;
        case 'shift':
            if (!isCrouching) {
                isCrouching = true;
                camera.position.y = crouchHeight;
            }
            break;
        case 'control':
            isRunning = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.key.toLowerCase()) {
        case 'w': 
            moveForward = false; 
            if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
                footstepSound.stop();
                isFootstepPlaying = false;
            }
            break;
        case 's': 
            moveBackward = false; 
            if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
                footstepSound.stop();
                isFootstepPlaying = false;
            }
            break;
        case 'a': 
            moveLeft = false; 
            if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
                footstepSound.stop();
                isFootstepPlaying = false;
            }
            break;
        case 'd': 
            moveRight = false; 
            if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
                footstepSound.stop();
                isFootstepPlaying = false;
            }
            break;
        case 'shift':
            if (isCrouching) {
                isCrouching = false;
                camera.position.y = normalHeight;
            }
            break;
        case 'control':
            isRunning = false;
            break;
    }
});

// Event listener untuk mouse
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        mouseX = event.movementX * mouseSensitivity;
        mouseY = event.movementY * mouseSensitivity;
        
        // Rotasi horizontal (kiri-kanan)
        cameraRotationY -= mouseX;
        
        // Rotasi vertikal (atas-bawah) - dibalik sumbunya
        cameraRotationX -= mouseY; // Mengubah kembali ke minus untuk arah yang benar
        
        // Batasi rotasi vertikal
        cameraRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotationX));
    }
});

// Lock pointer saat mengklik canvas
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Variabel untuk ranting pohon
const sticks = [];
const stickCount = 30; // Menambah jumlah ranting

// Membuat elemen untuk menampilkan nama item
const itemNameDiv = document.createElement('div');
itemNameDiv.style.position = 'absolute';
itemNameDiv.style.top = 'calc(50% + 20px)';
itemNameDiv.style.left = '50%';
itemNameDiv.style.transform = 'translate(-50%, -50%)';
itemNameDiv.style.color = 'white';
itemNameDiv.style.fontFamily = 'Arial';
itemNameDiv.style.fontSize = '14px';
itemNameDiv.style.textShadow = '1px 1px 1px black';
itemNameDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
itemNameDiv.style.padding = '5px 10px';
itemNameDiv.style.borderRadius = '5px';
itemNameDiv.style.display = 'none';
document.body.appendChild(itemNameDiv);

// Membuat elemen untuk menampilkan jumlah stick
const stickCountDiv = document.createElement('div');
stickCountDiv.style.position = 'absolute';
stickCountDiv.style.bottom = '10px';
stickCountDiv.style.right = '10px';
stickCountDiv.style.color = 'white';
stickCountDiv.style.fontFamily = 'Arial';
stickCountDiv.style.fontSize = '14px';
stickCountDiv.style.textShadow = '1px 1px 1px black';
stickCountDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
stickCountDiv.style.padding = '5px 10px';
stickCountDiv.style.borderRadius = '5px';
document.body.appendChild(stickCountDiv);

// Tambahkan frustum culling
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

// Fungsi untuk mengecek apakah objek berada dalam frustum
function isInFrustum(object) {
    // Selalu tampilkan floor dan campfire
    if (object === floor || campfireGroup.children.includes(object)) {
        return true;
    }
    
    if (!object.geometry) return true;
    
    // Hitung posisi dunia objek
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    
    // Buat bounding sphere di posisi dunia
    const boundingSphere = new THREE.Sphere(worldPosition, 1);
    
    // Cek apakah objek berada dalam frustum
    return frustum.intersectsSphere(boundingSphere);
}

// Fungsi untuk mengoptimasi objek
function optimizeObject(object) {
    if (object.isMesh) {
        // Aktifkan frustum culling
        object.frustumCulled = true;
        
        // Optimasi geometry
        if (object.geometry) {
            object.geometry.computeBoundingSphere();
            object.geometry.computeBoundingBox();
            
            // Sesuaikan ukuran bounding sphere berdasarkan skala objek
            const scale = object.scale;
            const maxScale = Math.max(scale.x, scale.y, scale.z);
            object.geometry.boundingSphere.radius *= maxScale;
        }
        
        // Optimasi material
        if (object.material) {
            object.material.precision = 'mediump';
            object.material.needsUpdate = true;
        }
    }
}

// Modifikasi fungsi createStick untuk mengoptimasi model
function createStick(x, z) {
    console.log('Membuat stick di posisi:', x, z);
    const stickGroup = new THREE.Group();
    stickGroup.position.set(x, 0, z);
    stickGroup.userData.isStick = true;
    
    // Tambahkan placeholder box sementara
    const placeholderGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const placeholderMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.y = 0.15;
    optimizeObject(placeholder);
    stickGroup.add(placeholder);
    
    // Load model ranting
    console.log('Memulai loading model FBX...');
    fbxLoader.load(
        'Asset/3d asset/ranting/buatkan_saya_ranting__0518141602_texture_fbx/buatkan_saya_ranting__0518141602_texture.fbx',
        function(object) {
            console.log('Model FBX berhasil dimuat');
            // Load texture
            textureLoader.load(
                'Asset/3d asset/ranting/buatkan_saya_ranting__0518141602_texture_fbx/buatkan_saya_ranting__0518141602_texture.png',
                function(texture) {
                    console.log('Texture berhasil dimuat');
                    // Terapkan texture ke semua material dalam model
                    object.traverse(function(child) {
                        if (child.isMesh) {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                            optimizeObject(child);
                        }
                    });
                    
                    // Hapus placeholder
                    stickGroup.remove(placeholder);
                    
                    // Sesuaikan skala dan rotasi
                    object.scale.set(0.005, 0.005, 0.005);
                    object.rotation.y = Math.random() * Math.PI * 2;
                    
                    stickGroup.add(object);
                },
                undefined,
                function(error) {
                    console.error('Error loading texture:', error);
                }
            );
        },
        function(xhr) {
            console.log('Loading FBX:', (xhr.loaded / xhr.total * 100) + '%');
        },
        function(error) {
            console.error('Error loading FBX:', error);
        }
    );
    
    scene.add(stickGroup);
    sticks.push(stickGroup);
    return stickGroup;
}

// Fungsi untuk mengecek apakah crosshair mengarah ke ranting
function isCrosshairOnStick() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    // Ubah untuk mendeteksi semua objek dalam scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Cari objek yang memiliki userData.isStick
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isStick) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isStick) {
            return true;
        }
    }
    return false;
}

// Fungsi untuk mengambil ranting
function collectStick() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    // Ubah untuk mendeteksi semua objek dalam scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Cari objek yang memiliki userData.isStick
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isStick) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isStick) {
            // Hapus stick dari scene
            scene.remove(obj);
            const index = sticks.indexOf(obj);
            if (index > -1) {
                sticks.splice(index, 1);
            }
            
            // Tambahkan ke inventory
            stickInventory++;
            addItemToInventory('stick', stickInventory);
            updateStickCount();
            break;
        }
    }
}

// Fungsi untuk update tampilan inventori
function updateInventory() {
    // Cari slot pertama yang kosong
    let emptySlot = -1;
    for (let i = 0; i < inventorySlots.length; i++) {
        if (!inventorySlots[i].querySelector('img')) {
            emptySlot = i;
            break;
        }
    }
    
    if (emptySlot !== -1) {
        const slot = inventorySlots[emptySlot];
        slot.innerHTML = ''; // Bersihkan slot
        
        // Tambahkan gambar item
        const img = document.createElement('img');
        if (stickInventory > 0) {
            img.src = 'Asset/2d asset/Item Icon/stick.png';
        } else if (flashlightInventory > 0) {
            img.src = 'Asset/2d asset/Item Icon/senter.png';
        }
        img.style.width = '80%';
        img.style.height = '80%';
        img.style.objectFit = 'contain';
        slot.appendChild(img);
        
        // Tambahkan jumlah
        const count = document.createElement('div');
        count.style.position = 'absolute';
        count.style.bottom = '2px';
        count.style.right = '2px';
        count.style.color = 'white';
        count.style.fontSize = '12px';
        count.style.textShadow = '1px 1px 1px black';
        count.textContent = stickInventory > 0 ? stickInventory : flashlightInventory;
        slot.appendChild(count);
    }
}

// Fungsi untuk update tampilan jumlah stick
function updateStickCount() {
    stickCountDiv.textContent = `Stick: ${stickInventory} | Flashlight: ${flashlightInventory}`;
}

// Fungsi untuk mengecek apakah slot aktif berisi stick
function isActiveSlotStick() {
    const activeSlot = inventorySlots[activeSlotIndex];
    const img = activeSlot.querySelector('img');
    return img && img.src.includes('stick.png');
}

// Fungsi untuk menghapus stick dari slot aktif
function removeStickFromActiveSlot() {
    const activeSlot = inventorySlots[activeSlotIndex];
    activeSlot.innerHTML = ''; // Hapus semua konten
    stickInventory--; // Kurangi jumlah stick
    updateStickCount(); // Update tampilan jumlah stick
}

// Modifikasi fungsi isCrosshairOnCampfire
function isCrosshairOnCampfire() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(campfireGroup.children);
    const campfirePos = new THREE.Vector3(0, 0, -5);
    const distance = camera.position.distanceTo(campfirePos);
    
    return intersects.length > 0 && distance < 10;
}

// Variabel untuk senter
const flashlights = [];

// Fungsi untuk mengecek apakah crosshair mengarah ke senter
function isCrosshairOnFlashlight() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isFlashlight) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isFlashlight) {
            return true;
        }
    }
    return false;
}

// Fungsi untuk mengambil senter
function collectFlashlight() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isFlashlight) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isFlashlight) {
            // Hapus senter dari scene
            scene.remove(obj);
            const index = flashlights.indexOf(obj);
            if (index > -1) {
                flashlights.splice(index, 1);
            }
            
            // Tambahkan ke inventory
            flashlightInventory++;
            addItemToInventory('flashlight', flashlightInventory);
            updateFlashlightCount();
            break;
        }
    }
}

// Fungsi untuk update tampilan jumlah senter
function updateFlashlightCount() {
    stickCountDiv.textContent = `Stick: ${stickInventory} | Flashlight: ${flashlightInventory}`;
}

// Fungsi untuk mengecek apakah slot aktif berisi senter
function isActiveSlotFlashlight() {
    const activeSlot = inventorySlots[activeSlotIndex];
    const img = activeSlot.querySelector('img');
    return img && img.src.includes('senter.png');
}

// Tambahkan variabel untuk suara klik
const clickSound = new THREE.Audio(audioListener);

// Load suara klik
audioLoader.load('Asset/sound/clicking_sound.mp3', 
    function(buffer) {
        clickSound.setBuffer(buffer);
        clickSound.setVolume(0.5);
    },
    undefined,
    function(error) {
        console.error('Error loading click sound:', error);
    }
);

// Modifikasi fungsi toggleFlashlight
function toggleFlashlight() {
    console.log('Toggle flashlight dipanggil');
    console.log('Slot aktif:', activeSlotIndex);
    console.log('Is active slot flashlight:', isActiveSlotFlashlight());
    
    if (!isActiveSlotFlashlight()) {
        console.log('Slot aktif bukan senter');
        return;
    }
    
    // Putar suara klik
    if (clickSound.isPlaying) {
        clickSound.stop();
    }
    clickSound.play();
    
    isFlashlightOn = !isFlashlightOn;
    console.log('Status senter:', isFlashlightOn ? 'Menyala' : 'Mati');
    
    if (isFlashlightOn) {
        // Buat cahaya senter
        if (!flashlightLight) {
            console.log('Membuat cahaya senter baru');
            flashlightLight = new THREE.SpotLight(0xffffff, 2);
            flashlightLight.angle = Math.PI / 6; // 30 derajat untuk cahaya lebih fokus
            flashlightLight.penumbra = 0.1; // Lebih tajam
            flashlightLight.distance = 30;
            
            // Buat target untuk cahaya
            const target = new THREE.Object3D();
            flashlightLight.target = target;
            scene.add(target);
            
            // Tambahkan cahaya ke scene
            scene.add(flashlightLight);
            
            console.log('Cahaya senter berhasil dibuat dan ditambahkan ke scene');
        }
        flashlightLight.visible = true;
    } else {
        if (flashlightLight) {
            console.log('Mematikan cahaya senter');
            flashlightLight.visible = false;
        }
    }
}

// Modifikasi event listener untuk klik mouse
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Klik kiri
        // Cek apakah crosshair mengarah ke boneka
        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(center, camera);
        
        if (dollModel) {
            const intersects = raycaster.intersectObject(dollModel, true);
            if (intersects.length > 0) {
                showWinScreen();
                return;
            }
        }
        
        // Cek objek lainnya
        if (isCrosshairOnStick()) {
            collectStick();
        } else if (isCrosshairOnCampfire()) {
            if (isActiveSlotStick()) {
                if (fireIntensityLevel < 3) {
                    fireIntensityLevel++;
                }
                changeFireIntensity();
                removeStickFromActiveSlot();
            }
        } else if (isCrosshairOnFlashlight()) {
            collectFlashlight();
        } else if (isCrosshairOnBackpack()) {
            collectBackpack();
        }
    } else if (event.button === 2) { // Klik kanan
        toggleFlashlight();
    }
});

// Mencegah menu konteks default saat klik kanan
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Modifikasi fungsi animate untuk menangani pre-render dan optimasi
function animate() {
    requestAnimationFrame(animate);

    // Jika sudah menang, hanya render scene
    if (hasWon) {
        renderer.render(scene, camera);
        return;
    }

    // Update frustum setiap frame
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Optimasi rendering untuk objek yang terlihat
    scene.traverse(function(object) {
        if (object.isMesh) {
            // Skip frustum culling untuk floor dan campfire
            if (object === floor || campfireGroup.children.includes(object)) {
                object.visible = true;
                return;
            }
            
            // Hitung posisi dunia objek
            const worldPosition = new THREE.Vector3();
            object.getWorldPosition(worldPosition);
            
            // Buat bounding sphere di posisi dunia
            const boundingSphere = new THREE.Sphere(worldPosition, 1);
            
            // Cek apakah objek berada dalam frustum
            object.visible = frustum.intersectsSphere(boundingSphere);
        }
    });

    // Mengatur rotasi kamera dengan benar menggunakan quaternion
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(cameraRotationX, cameraRotationY, 0, 'YXZ'));
    camera.quaternion.copy(quaternion);

    // Gerakan kamera berdasarkan input keyboard
    const direction = new THREE.Vector3();
    
    // Menggunakan vektor arah kamera untuk pergerakan
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    // Vektor untuk gerakan ke samping
    const sideDirection = new THREE.Vector3(1, 0, 0);
    sideDirection.applyQuaternion(camera.quaternion);
    sideDirection.y = 0;
    sideDirection.normalize();

    if (moveForward) {
        direction.add(cameraDirection);
    }
    if (moveBackward) {
        direction.sub(cameraDirection);
    }
    if (moveLeft) {
        direction.sub(sideDirection);
    }
    if (moveRight) {
        direction.add(sideDirection);
    }

    // Normalisasi dan terapkan kecepatan
    if (direction.length() > 0) {
        direction.normalize();
        // Gunakan kecepatan lari jika sedang lari
        const currentSpeed = isRunning ? runSpeed : moveSpeed;
        direction.multiplyScalar(currentSpeed);
    }

    // Cek collision sebelum bergerak
    const newPosition = camera.position.clone().add(direction);
    if (!checkCollision(newPosition)) {
        camera.position.add(direction);
    }

    // Cek apakah player di dalam daun
    isInLeaves = checkInLeaves(camera.position);
    
    // Terapkan efek blur jika di dalam daun
    if (isInLeaves) {
        blurDiv.style.opacity = '1';
    } else {
        blurDiv.style.opacity = '0';
    }

    // Animasi api dan partikel
    fire.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    
    // Animasi intensitas cahaya api berdasarkan waktu
    const baseIntensity = timeState === 0 ? 1.5 : (timeState === 1 ? 2.5 : 3.5);
    fireLight.intensity = baseIntensity + Math.sin(Date.now() * 0.003) * 0.5;

    // Animasi partikel api
    particles.forEach((particle, index) => {
        const time = Date.now() * 0.001;
        particle.position.y += particle.userData.speed;
        particle.position.x += Math.sin(time + particle.userData.offset) * 0.01;
        particle.position.z += Math.cos(time + particle.userData.offset) * 0.01;
        
        // Reset partikel jika terlalu tinggi
        if (particle.position.y > 1.5) {
            particle.position.y = 0;
            particle.position.x = (Math.random() - 0.5) * 0.5;
            particle.position.z = (Math.random() - 0.5) * 0.5;
        }
        
        // Mengubah opacity berdasarkan ketinggian
        particle.material.opacity = 0.8 * (1 - particle.position.y / 1.5);
    });

    // Update posisi cahaya player jika sedang terbakar
    if (playerLight) {
        playerLight.position.copy(camera.position);
    }

    // Animasi partikel api player
    if (isBurning) {
        const time = Date.now() * 0.001;
        playerFireParticles.forEach((particle, index) => {
            // Update posisi partikel relatif terhadap kamera
            particle.position.copy(camera.position);
            particle.position.y += particle.userData.initialY + Math.sin(time + particle.userData.offset) * 0.2;
            particle.position.x += Math.sin(time + particle.userData.offset) * 0.3;
            particle.position.z += Math.cos(time + particle.userData.offset) * 0.3;
            
            // Animasi opacity
            particle.material.opacity = 0.8 * (1 - particle.position.y / 2);
        });
    }

    // Cek apakah player di dalam api unggun
    const isInFire = checkInCampfire(camera.position);
    handleBurning(isInFire);

    // Update koordinat dan opacity
    const distanceFromFire = Math.sqrt(
        Math.pow(camera.position.x, 2) + 
        Math.pow(camera.position.z + 5, 2)
    );
    
    let opacity = 1;
    if (timeState === 2) { // Malam hari
        opacity = Math.max(0.2, 1 - (distanceFromFire / 20));
    } else if (timeState === 1) { // Sore hari
        opacity = Math.max(0.4, 1 - (distanceFromFire / 30));
    }
    
    coordDiv.textContent = `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)} | Opacity: ${opacity.toFixed(2)}`;

    // Update informasi api unggun
    let timeText = '';
    switch(timeState) {
        case 0: timeText = 'Siang'; break;
        case 1: timeText = 'Sore'; break;
        case 2: timeText = 'Malam'; break;
    }

    let intensityText = '';
    if (!isFireOn) {
        intensityText = 'Mati';
    } else {
        switch(fireIntensityLevel) {
            case 0: intensityText = 'Redup'; break;
            case 1: intensityText = 'Normal'; break;
            case 2: intensityText = 'Terang'; break;
        }
    }

    const isNearFire = distanceFromFire < 3;
    const fireStatus = isNearFire ? 'Anda berada di dekat api unggun' : 'Anda jauh dari api unggun';
    const fireDistance = `Jarak dari api: ${distanceFromFire.toFixed(1)} unit`;
    
    campfireInfoDiv.innerHTML = `
        <strong>Api Unggun</strong><br>
        Waktu: ${timeText}<br>
        Intensitas: ${intensityText}<br>
        Status: ${fireStatus}<br>
        ${fireDistance}<br>
        <small>Tekan 1 untuk mengubah waktu</small><br>
        <small>Tekan 2 untuk mengubah intensitas api</small>
    `;

    // Update warna lantai berdasarkan jarak dari api
    if (timeState === 2) { // Malam hari
        const darkGreen = new THREE.Color(0x003300);
        const darkerGreen = new THREE.Color(0x001100);
        floorMaterial.color.lerpColors(darkGreen, darkerGreen, Math.min(1, distanceFromFire / 20));
    } else if (timeState === 1) { // Sore hari
        const mediumGreen = new THREE.Color(0x006400);
        const darkGreen = new THREE.Color(0x003300);
        floorMaterial.color.lerpColors(mediumGreen, darkGreen, Math.min(1, distanceFromFire / 30));
    }

    // Animasi kunang-kunang
    if (timeState === 2) {
        const time = Date.now() * 0.001;
        fireflies.forEach((firefly, index) => {
            const data = firefly.userData;
            firefly.position.y = data.initialY + Math.sin(time + data.offset) * 0.5;
            firefly.position.x += Math.sin(time + data.offset) * 0.02;
            firefly.position.z += Math.cos(time + data.offset) * 0.02;
            
            // Batasi area pergerakan
            if (firefly.position.x > 10) firefly.position.x = -10;
            if (firefly.position.x < -10) firefly.position.x = 10;
            if (firefly.position.z > 10) firefly.position.z = -10;
            if (firefly.position.z < -10) firefly.position.z = 10;
            
            // Animasi opacity
            firefly.material.opacity = 0.3 + Math.sin(time * 2 + data.offset) * 0.2;
        });
    }

    // Handle loncat
    if (isJumping) {
        camera.position.y += jumpVelocity;
        jumpVelocity -= gravity;
        
        if (camera.position.y <= normalHeight) {
            camera.position.y = normalHeight;
            isJumping = false;
            jumpVelocity = 0;
        }
    }

    // Cek apakah player di dalam semak
    isInBush = checkInBush(camera.position);
    
    // Terapkan efek blur jika di dalam semak dan jongkok
    if (isInBush && isCrouching) {
        blurDiv.style.opacity = '1';
    } else if (!isInLeaves) {
        blurDiv.style.opacity = '0';
    }

    // Cek apakah crosshair mengarah ke ranting atau campfire
    if (isCrosshairOnStick()) {
        itemNameDiv.style.display = 'block';
        itemNameDiv.textContent = 'Stick';
    } else if (isCrosshairOnCampfire()) {
        itemNameDiv.style.display = 'block';
        itemNameDiv.textContent = 'Campfire';
    } else if (isCrosshairOnFlashlight()) {
        itemNameDiv.style.display = 'block';
        itemNameDiv.textContent = 'Senter';
    } else if (isCrosshairOnBackpack()) {
        itemNameDiv.style.display = 'block';
        itemNameDiv.textContent = 'Backpack';
    } else {
        itemNameDiv.style.display = 'none';
    }

    // Update posisi cahaya senter
    if (flashlightLight && isFlashlightOn && isActiveSlotFlashlight()) {
        // Update posisi cahaya dan target
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        // Update posisi cahaya
        flashlightLight.position.copy(camera.position);
        
        // Update posisi target
        const targetPosition = new THREE.Vector3();
        targetPosition.copy(camera.position).add(direction.multiplyScalar(10));
        flashlightLight.target.position.copy(targetPosition);
        
        // Sesuaikan intensitas cahaya berdasarkan waktu
        if (timeState === 0) { // Pagi
            flashlightLight.intensity = 0.5;
        } else if (timeState === 1) { // Sore
            flashlightLight.intensity = 1;
        } else { // Malam
            flashlightLight.intensity = 2;
        }
        
        console.log('Cahaya senter aktif, intensitas:', flashlightLight.intensity);
    } else if (flashlightLight && isFlashlightOn) {
        // Jika tidak memegang senter tapi cahaya masih menyala, matikan
        console.log('Tidak memegang senter, mematikan cahaya');
        flashlightLight.visible = false;
        isFlashlightOn = false;
    }

    // Cek apakah player menginjak ranting
    if (isPlayerOnStick()) {
        if (!isPlayingStickSound && !stickSound.isPlaying) {
            stickSound.play();
            isPlayingStickSound = true;
        }
    } else {
        isPlayingStickSound = false;
    }

    // Update rotasi Choco Character untuk menghadap kamera
    if (chocoCharacter && chocoCharacter.visible) {
        // Dapatkan posisi kamera dan choco dalam koordinat world
        const cameraPosition = camera.position.clone();
        const chocoPosition = chocoCharacter.position.clone();
        
        // Hitung arah dari choco ke kamera (hanya pada sumbu XZ)
        const direction = new THREE.Vector3();
        direction.subVectors(cameraPosition, chocoPosition);
        direction.y = 0; // Abaikan perbedaan ketinggian
        
        // Hitung sudut rotasi yang dibutuhkan
        const angle = Math.atan2(direction.x, direction.z);
        
        // Terapkan rotasi dengan lerp untuk pergerakan yang lebih halus
        const currentRotation = chocoCharacter.rotation.y;
        const targetRotation = angle; // Hapus +Math.PI agar model menghadap kamera
        
        // Interpolasi linear untuk rotasi yang lebih halus
        chocoCharacter.rotation.y = currentRotation + (targetRotation - currentRotation) * 0.1;
    }

    // Deklarasi audio (tambahkan di dekat deklarasi audio lainnya)
    const tungTungSound = new THREE.Audio(audioListener);
    let isTungTungPlaying = false;

    // Load audio Tung-tung (tambahkan setelah loading audio lainnya)
    audioLoader.load('./Asset/sound/tung-tung-jadi.mp3', function(buffer) {
        tungTungSound.setBuffer(buffer);
        tungTungSound.setVolume(0.5);
        tungTungSound.setLoop(true);
        console.log('Audio Tung-tung berhasil dimuat');
    }, undefined, function(error) {
        console.error('Error loading Tung-tung audio:', error);
    });

    // Fungsi untuk mengecek jarak ke Choco Character
    function checkDistanceToChoco(playerPosition, chocoPosition) {
        return playerPosition.distanceTo(chocoPosition);
    }

    // Update di fungsi animate, tambahkan sebelum renderer.render:
        // Update audio Tung-tung berdasarkan jarak ke Choco Character
        if (chocoCharacter && chocoCharacter.visible) {
            const distanceToChoco = checkDistanceToChoco(camera.position, chocoCharacter.position);
            const maxDistance = 10; // Jarak maksimal untuk mendengar audio (dalam unit)
            
            if (distanceToChoco < maxDistance) {
                // Atur volume berdasarkan jarak
                const volume = Math.max(0, 1 - (distanceToChoco / maxDistance));
                
                if (!isTungTungPlaying) {
                    tungTungSound.setVolume(volume);
                    tungTungSound.play();
                    isTungTungPlaying = true;
                    console.log('Memulai audio Tung-tung, jarak:', distanceToChoco.toFixed(2));
                } else {
                    tungTungSound.setVolume(volume);
                }
            } else if (isTungTungPlaying) {
                tungTungSound.stop();
                isTungTungPlaying = false;
                console.log('Menghentikan audio Tung-tung, terlalu jauh');
            }
        } else if (isTungTungPlaying) {
            tungTungSound.stop();
            isTungTungPlaying = false;
            console.log('Menghentikan audio Tung-tung, Choco tidak terlihat');
        }

    // Modifikasi fungsi updateChocoVisibility menjadi lebih sederhana
    function updateChocoVisibility() {
        if (!chocoCharacter) {
            console.log('Choco Character belum diinisialisasi');
            return;
        }
        
        // Model hanya muncul saat malam dan api unggun mati
        const shouldBeVisible = timeState === 2 && fireIntensityLevel === 0;
        chocoCharacter.visible = shouldBeVisible;
    }

    // Di dalam fungsi animate, tambahkan sebelum renderer.render:
        // Update audio Choco Character berdasarkan jarak
        if (chocoCharacter && chocoCharacter.visible && isChocoSoundLoaded) {
            // Hitung jarak ke Choco Character
            const distance = Math.sqrt(
                Math.pow(camera.position.x - chocoCharacter.position.x, 2) +
                Math.pow(camera.position.z - chocoCharacter.position.z, 2)
            );

            const maxDistance = 10;
            
            if (distance < maxDistance) {
                // Mainkan audio jika dalam jangkauan
                if (!chocoSound.isPlaying) {
                    chocoSound.play();
                    console.log('Mulai mainkan audio Choco, jarak:', distance.toFixed(2));
                }
                // Update volume berdasarkan jarak
                const volume = Math.max(0, 1 - (distance / maxDistance));
                chocoSound.setVolume(volume);
            } else if (chocoSound.isPlaying) {
                // Hentikan audio jika terlalu jauh
                chocoSound.stop();
                console.log('Hentikan audio Choco, terlalu jauh:', distance.toFixed(2));
            }
        } else if (chocoSound.isPlaying) {
            // Hentikan audio jika Choco tidak terlihat
            chocoSound.stop();
            console.log('Hentikan audio Choco, tidak terlihat');
        }

    // Fungsi untuk mengecek apakah crosshair mengarah ke boneka
    function isCrosshairOnDoll() {
        if (!dollModel) return false;
        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObject(dollModel, true);
        return intersects.length > 0;
    }

    // ... existing code ...

    // Di dalam fungsi animate, sebelum renderer.render(scene, camera);
        // Cek apakah crosshair mengarah ke objek
        if (isCrosshairOnDoll()) {
            itemNameDiv.style.display = 'block';
            itemNameDiv.textContent = 'Benda Keramat';
        } else if (isCrosshairOnStick()) {
            itemNameDiv.style.display = 'block';
            itemNameDiv.textContent = 'Stick';
        } else if (isCrosshairOnCampfire()) {
            itemNameDiv.style.display = 'block';
            itemNameDiv.textContent = 'Campfire';
        } else if (isCrosshairOnFlashlight()) {
            itemNameDiv.style.display = 'block';
            itemNameDiv.textContent = 'Senter';
        } else if (isCrosshairOnBackpack()) {
            itemNameDiv.style.display = 'block';
            itemNameDiv.textContent = 'Backpack';
        } else {
            itemNameDiv.style.display = 'none';
        }

    // Tambahkan variabel untuk Choco Character
    let isChocoAttacking = false; // Status serangan Choco

    // Tambahkan Xolonium font
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        @font-face {
            font-family: 'Xolonium';
            src: url('Asset/fonts/Xolonium.ttf') format('truetype');
        }
    `;
    document.head.appendChild(fontStyle);

    // Hapus health bar yang sudah ada jika ada
    const existingHealthBar = document.querySelector('.health-bar-container');
    if (existingHealthBar) {
        existingHealthBar.remove();
    }

    // Tambahkan health bar UI
    const healthBarContainer = document.createElement('div');
    healthBarContainer.className = 'health-bar-container';
    healthBarContainer.style.position = 'fixed';
    healthBarContainer.style.top = '20px';
    healthBarContainer.style.left = '50%';
    healthBarContainer.style.transform = 'translateX(-50%)';
    healthBarContainer.style.width = '200px';
    healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    healthBarContainer.style.border = '2px solid white';
    healthBarContainer.style.padding = '3px';
    healthBarContainer.style.borderRadius = '5px';
    healthBarContainer.style.zIndex = '9999';
    healthBarContainer.style.opacity = '1';
    document.body.appendChild(healthBarContainer);

    // Bar health yang berubah
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    healthBar.style.width = '100%';
    healthBar.style.height = '20px';
    healthBar.style.backgroundColor = 'red';
    healthBar.style.transition = 'width 0.3s ease-out';
    healthBar.style.borderRadius = '3px';
    healthBar.style.opacity = '1';
    healthBarContainer.appendChild(healthBar);

    // Label health (hanya satu label)
    const healthLabel = document.createElement('div');
    healthLabel.className = 'health-label';
    healthLabel.style.position = 'absolute';
    healthLabel.style.width = '100%';
    healthLabel.style.textAlign = 'center';
    healthLabel.style.color = 'white';
    healthLabel.style.fontFamily = 'Arial';
    healthLabel.style.fontSize = '14px';
    healthLabel.style.fontWeight = 'bold';
    healthLabel.style.textShadow = '2px 2px 2px black';
    healthLabel.style.bottom = '-25px';
    healthLabel.style.opacity = '1';
    healthLabel.textContent = `Health Bar: ${playerHealth}/${totalHealth}`;
    healthBarContainer.appendChild(healthLabel);

    // Fungsi untuk update health bar
    function updateHealthBar() {
        const healthBar = document.querySelector('.health-bar');
        const healthLabel = document.querySelector('.health-label');
        if (!healthBar || !healthLabel) return;
        
        const currentHealth = Math.max(0, playerHealth);
        healthBar.style.width = `${currentHealth}%`;
        healthLabel.textContent = `Health Bar: ${currentHealth}/${totalHealth}`;
    }

    // Fungsi untuk damage player
    function damagePlayer() {
        if (isGameOver || playerHealth <= 0) return;
        
        playerHealth = Math.max(0, playerHealth - 10);
        updateHealthBar();
        
        // Efek flash merah
        const flashEffect = document.createElement('div');
        flashEffect.style.position = 'fixed';
        flashEffect.style.top = '0';
        flashEffect.style.left = '0';
        flashEffect.style.width = '100%';
        flashEffect.style.height = '100%';
        flashEffect.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flashEffect.style.pointerEvents = 'none';
        flashEffect.style.zIndex = '9997';
        document.body.appendChild(flashEffect);
        
        setTimeout(() => {
            document.body.removeChild(flashEffect);
        }, 100);
        
        if (playerHealth <= 0) {
            gameOver();
        }
    }

    // Fungsi game over
    function gameOver() {
        isGameOver = true;
        
        // Efek blur untuk layar
        const blurOverlay = document.createElement('div');
        blurOverlay.style.position = 'fixed';
        blurOverlay.style.top = '0';
        blurOverlay.style.left = '0';
        blurOverlay.style.width = '100%';
        blurOverlay.style.height = '100%';
        blurOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        blurOverlay.style.backdropFilter = 'blur(5px)';
        blurOverlay.style.zIndex = '9998';
        document.body.appendChild(blurOverlay);
        
        // Container untuk pesan game over
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'fixed';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.display = 'flex';
        gameOverDiv.style.flexDirection = 'column';
        gameOverDiv.style.alignItems = 'center';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.zIndex = '9999';
        
        // Teks Game Over
        const gameOverText = document.createElement('div');
        gameOverText.textContent = 'Game Over';
        gameOverText.style.color = 'red';
        gameOverText.style.fontSize = '48px';
        gameOverText.style.fontFamily = 'Arial';
        gameOverText.style.marginBottom = '20px';
        gameOverDiv.appendChild(gameOverText);
        
        // Teks kematian
        const deathText = document.createElement('div');
        deathText.textContent = 'Anda telah dibunuh oleh Tung Tung Sahur';
        deathText.style.color = 'white';
        deathText.style.fontSize = '24px';
        deathText.style.fontFamily = 'Arial';
        deathText.style.marginBottom = '30px';
        gameOverDiv.appendChild(deathText);
        
        // Tombol Main Lagi
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Main Lagi';
        restartButton.style.padding = '10px 30px';
        restartButton.style.fontSize = '20px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.backgroundColor = 'red';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.transition = 'background-color 0.3s';
        restartButton.onmouseover = () => restartButton.style.backgroundColor = '#ff3333';
        restartButton.onmouseout = () => restartButton.style.backgroundColor = 'red';
        restartButton.onclick = () => location.reload();
        gameOverDiv.appendChild(restartButton);
        
        document.body.appendChild(gameOverDiv);
        
        // Keluar dari pointer lock
        document.exitPointerLock();
    }

    // Set health bar awal
    updateHealthBar();

    // Di dalam fungsi animate()
        if (chocoCharacter && chocoCharacter.visible && !isGameOver) {
            const cameraPosition = camera.position.clone();
            const chocoPosition = chocoCharacter.position.clone();
            
            const direction = new THREE.Vector3();
            direction.subVectors(cameraPosition, chocoPosition);
            direction.y = 0;
            direction.normalize();
            
            const distanceToCamera = chocoPosition.distanceTo(cameraPosition);
            
            if (distanceToCamera > 2) {
                chocoCharacter.position.add(direction.multiplyScalar(chocoSpeed));
                isChocoAttacking = false;
            } else {
                const currentTime = Date.now();
                if (currentTime - lastAttackTime > attackCooldown) {
                    isChocoAttacking = true;
                    damagePlayer();
                    lastAttackTime = currentTime;
                }
            }
            
            const angle = Math.atan2(direction.x, direction.z);
            chocoCharacter.rotation.y = angle;
        }

    renderer.render(scene, camera);
}

// Modifikasi event listener resize untuk mengoptimasi performa
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Fungsi untuk membuat pohon cemara dengan variasi tinggi
function createPineTree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();
    
    // Membuat batang pohon
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.scale.y = scale;
    trunk.userData.isTrunk = true;
    treeGroup.add(trunk);

    // Membuat daun pohon (jumlah lapisan berdasarkan skala)
    const leafMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x006400,
        transparent: false,
        emissive: 0x003300,
        emissiveIntensity: 0.2,
        shininess: 30
    });
    
    const numLayers = Math.floor(3 + scale * 2);
    const layerHeight = 2;
    
    for (let i = 0; i < numLayers; i++) {
        const layerScale = 1 - (i / numLayers) * 0.5;
        const layerGeometry = new THREE.ConeGeometry(1.5 * layerScale, layerHeight, 8);
        const layer = new THREE.Mesh(layerGeometry, leafMaterial);
        layer.position.y = 2.5 + i * layerHeight * 0.8;
        layer.scale.set(scale, scale, scale);
        layer.userData.isLeaves = true;
        treeGroup.add(layer);
    }

    // Puncak pohon
    const topGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const top = new THREE.Mesh(topGeometry, leafMaterial);
    top.position.y = 2.5 + numLayers * layerHeight * 0.8;
    top.scale.set(scale, scale, scale);
    top.userData.isLeaves = true;
    treeGroup.add(top);

    // Rotasi acak untuk variasi
    treeGroup.rotation.y = Math.random() * Math.PI * 2;

    // Posisikan pohon
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    return treeGroup;
}

// Fungsi untuk mengecek collision
function checkCollision(newPosition) {
    const trees = scene.children.filter(child => child instanceof THREE.Group);
    
    for (const tree of trees) {
        const trunk = tree.children.find(child => child.userData.isTrunk);
        if (trunk) {
            const trunkPosition = new THREE.Vector3();
            trunk.getWorldPosition(trunkPosition);
            
            // Hitung jarak ke batang pohon
            const distance = new THREE.Vector2(
                newPosition.x - trunkPosition.x,
                newPosition.z - trunkPosition.z
            ).length();
            
            // Jika terlalu dekat dengan batang, tolak pergerakan
            if (distance < playerRadius + 0.3) {
                return true;
            }
        }
    }
    return false;
}

// Fungsi untuk mengecek apakah player di dalam daun
function checkInLeaves(position) {
    const trees = scene.children.filter(child => child instanceof THREE.Group);
    
    for (const tree of trees) {
        const leaves = tree.children.filter(child => child.userData.isLeaves);
        for (const leaf of leaves) {
            const leafPosition = new THREE.Vector3();
            leaf.getWorldPosition(leafPosition);
            
            const distance = new THREE.Vector2(
                position.x - leafPosition.x,
                position.z - leafPosition.z
            ).length();
            
            if (distance < 1.5 * leaf.scale.x) {
                return true;
            }
        }
    }
    return false;
}

// Fungsi untuk mendapatkan posisi acak dalam radius tertentu
function getRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

// Fungsi untuk membuat batu
function createRock(x, z) {
    const rockGroup = new THREE.Group();
    
    // Variasi ukuran batu
    const scale = 0.5 + Math.random() * 1;
    
    // Variasi warna batu
    const rockColors = [
        0x808080, // Abu-abu
        0x696969, // Abu-abu gelap
        0xA9A9A9, // Abu-abu terang
        0x708090, // Slate
        0x778899  // Light slate
    ];
    const rockColor = rockColors[Math.floor(Math.random() * rockColors.length)];
    
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMaterial = new THREE.MeshPhongMaterial({ 
        color: rockColor,
        shininess: 10
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.scale.set(scale, scale * 0.7, scale);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rockGroup.add(rock);
    
    rockGroup.position.set(x, 0, z);
    scene.add(rockGroup);
    return rockGroup;
}

// Fungsi untuk membuat rumput
function createGrass(x, z) {
    const grassGroup = new THREE.Group();
    
    // Variasi warna rumput
    const grassColors = [
        0x00ff00, // Hijau terang
        0x32CD32, // Lime green
        0x228B22, // Forest green
        0x556B2F, // Dark olive green
        0x8B4513  // Coklat
    ];
    const grassColor = grassColors[Math.floor(Math.random() * grassColors.length)];
    
    // Membuat lebih banyak helai rumput (5-10 helai)
    const grassCount = 5 + Math.floor(Math.random() * 6);
    // Tinggi maksimal 1.5 (3/4 dari tinggi player yang 2)
    const maxHeight = 1.5;
    const minHeight = 0.3;
    
    for (let i = 0; i < grassCount; i++) {
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        const grassGeometry = new THREE.CylinderGeometry(0.02, 0.02, height, 4);
        const grassMaterial = new THREE.MeshPhongMaterial({ 
            color: grassColor,
            shininess: 30
        });
        
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        // Posisi lebih tersebar
        grass.position.set(
            (Math.random() - 0.5) * 0.5,
            height/2, // Posisi Y disesuaikan dengan tinggi
            (Math.random() - 0.5) * 0.5
        );
        // Rotasi lebih bervariasi
        grass.rotation.x = Math.random() * 0.4;
        grass.rotation.z = Math.random() * 0.4;
        grassGroup.add(grass);
    }
    
    grassGroup.position.set(x, 0, z);
    scene.add(grassGroup);
    return grassGroup;
}

// Fungsi untuk membuat semak belukar
function createBush(x, z) {
    const bushGroup = new THREE.Group();
    
    // Variasi ukuran semak
    const scale = 0.8 + Math.random() * 0.4; // Ukuran dasar lebih kecil
    
    // Variasi warna semak
    const bushColors = [
        0x006400, // Dark green
        0x228B22, // Forest green
        0x556B2F, // Dark olive green
        0x8B4513  // Brown
    ];
    const bushColor = bushColors[Math.floor(Math.random() * bushColors.length)];
    
    // Membuat beberapa bagian semak
    const bushParts = 3 + Math.floor(Math.random() * 2); // Jumlah bagian dikurangi
    for (let i = 0; i < bushParts; i++) {
        const bushGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const bushMaterial = new THREE.MeshPhongMaterial({ 
            color: bushColor,
            shininess: 10
        });
        
        const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
        // Posisi vertikal lebih rendah
        bushPart.position.set(
            (Math.random() - 0.5) * 0.8,
            Math.random() * 0.4 + 0.2, // Tinggi dasar 0.2-0.6
            (Math.random() - 0.5) * 0.8
        );
        // Skala vertikal lebih kecil
        bushPart.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.3, // Tinggi lebih kecil
            0.8 + Math.random() * 0.4
        );
        bushGroup.add(bushPart);
    }
    
    // Tambahkan beberapa bagian semak yang sedikit lebih tinggi
    const tallParts = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < tallParts; i++) {
        const bushGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const bushMaterial = new THREE.MeshPhongMaterial({ 
            color: bushColor,
            shininess: 10
        });
        
        const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
        bushPart.position.set(
            (Math.random() - 0.5) * 0.6,
            Math.random() * 0.4 + 0.6, // Tinggi 0.6-1.0
            (Math.random() - 0.5) * 0.6
        );
        bushPart.scale.set(
            0.6 + Math.random() * 0.3,
            0.8 + Math.random() * 0.4, // Tinggi lebih kecil
            0.6 + Math.random() * 0.3
        );
        bushGroup.add(bushPart);
    }
    
    bushGroup.position.set(x, 0, z);
    bushGroup.scale.set(scale, scale, scale);
    bushGroup.userData.isBush = true;
    scene.add(bushGroup);
    return bushGroup;
}

// Fungsi untuk mengecek apakah player di dalam semak
function checkInBush(position) {
    const bushes = scene.children.filter(child => child.userData && child.userData.isBush);
    
    for (const bush of bushes) {
        const bushPosition = new THREE.Vector3();
        bush.getWorldPosition(bushPosition);
        
        const distance = new THREE.Vector2(
            position.x - bushPosition.x,
            position.z - bushPosition.z
        ).length();
        
        if (distance < 1.5 * bush.scale.x) {
            return true;
        }
    }
    return false;
}

// Tambahkan loader untuk senter
const objLoader = new THREE.OBJLoader();
const mtlLoader = new THREE.MTLLoader();

// Fungsi untuk membuat senter
function createFlashlight(x, z) {
    const flashlightGroup = new THREE.Group();
    flashlightGroup.position.set(x, 0.15, z);
    flashlightGroup.userData.isFlashlight = true;
    
    // Tambahkan placeholder box sementara
    const placeholderGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const placeholderMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.y = 0.15;
    flashlightGroup.add(placeholder);
    
    // Load model senter dengan texture yang benar
    mtlLoader.load(
        'Asset/3d asset/senter/make_3d_modle_of_flas_0518140520_texture_obj/make_3d_modle_of_flas_0518140520_texture.mtl',
        function(materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            
            objLoader.load(
                'Asset/3d asset/senter/make_3d_modle_of_flas_0518140520_texture_obj/make_3d_modle_of_flas_0518140520_texture.obj',
                function(object) {
                    // Hapus placeholder
                    flashlightGroup.remove(placeholder);
                    
                    // Load dan terapkan texture senter
                    const texture = textureLoader.load(
                        'Asset/3d asset/senter/make_3d_modle_of_flas_0518140520_texture_obj/make_3d_modle_of_flas_0518140520_texture.png'
                    );
                    
                    object.traverse(function(child) {
                        if (child.isMesh) {
                            // Pastikan material baru dibuat untuk setiap mesh
                            child.material = new THREE.MeshPhongMaterial({
                                map: texture,
                                shininess: 30
                            });
                        }
                    });
                    
                    // Sesuaikan skala dan rotasi
                    object.scale.set(0.3, 0.3, 0.3);
                    object.rotation.y = Math.random() * Math.PI * 2;
                    
                    flashlightGroup.add(object);
                }
            );
        }
    );
    
    scene.add(flashlightGroup);
    flashlights.push(flashlightGroup);
    return flashlightGroup;
}

// Fungsi untuk membuat backpack
function createBackpack(x, z) {
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(x, 0.15, z);
    backpackGroup.userData.isBackpack = true;
    
    // Tambahkan placeholder box sementara
    const placeholderGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const placeholderMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.y = 0.25;
    backpackGroup.add(placeholder);
    
    // Load model backpack dengan texture yang benar
    mtlLoader.load(
        'Asset/3d asset/tasransel/buatkan_saya_ransel_b_0518143252_texture_obj/buatkan_saya_ransel_b_0518143252_texture.mtl',
        function(materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            
            objLoader.load(
                'Asset/3d asset/tasransel/buatkan_saya_ransel_b_0518143252_texture_obj/buatkan_saya_ransel_b_0518143252_texture.obj',
                function(object) {
                    // Hapus placeholder
                    backpackGroup.remove(placeholder);
                    
                    // Load dan terapkan texture backpack
                    const texture = textureLoader.load(
                        'Asset/3d asset/tasransel/buatkan_saya_ransel_b_0518143252_texture_obj/buatkan_saya_ransel_b_0518143252_texture.png'
                    );
                    
                    object.traverse(function(child) {
                        if (child.isMesh) {
                            // Pastikan material baru dibuat untuk setiap mesh
                            child.material = new THREE.MeshPhongMaterial({
                                map: texture,
                                shininess: 30
                            });
                        }
                    });
                    
                    // Sesuaikan skala dan rotasi
                    object.scale.set(1.0, 1.0, 1.0);
                    object.rotation.y = Math.random() * Math.PI * 2;
                    
                    backpackGroup.add(object);
                }
            );
        }
    );
    
    scene.add(backpackGroup);
    return backpackGroup;
}

// Fungsi untuk mengecek apakah crosshair mengarah ke backpack
function isCrosshairOnBackpack() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isBackpack) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isBackpack) {
            return true;
        }
    }
    return false;
}

// Modifikasi fungsi collectBackpack
function collectBackpack() {
    console.log('Mencoba mengambil backpack...');
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isBackpack) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isBackpack) {
            console.log('Backpack ditemukan, memutar suara...');
            
            // Hapus backpack dari scene
            scene.remove(obj);
            
            // Putar suara backpack
            try {
                if (backpackSound.isPlaying) {
                    console.log('Menghentikan suara backpack yang sedang diputar...');
                    backpackSound.stop();
                }
                console.log('Memulai pemutaran suara backpack...');
                backpackSound.setVolume(0.5);
                backpackSound.play();
            } catch (error) {
                console.error('Error saat memutar suara backpack:', error);
            }
            
            // Aktifkan inventory backpack
            hasBackpack = true;
            isInBackpack = false; // Mulai dari inventory utama
            const backpackInventory = document.getElementById('backpackInventory');
            if (backpackInventory) {
                backpackInventory.style.display = 'flex';
            }
            
            // Tampilkan pesan bahwa backpack telah diambil
            const message = document.createElement('div');
            message.style.position = 'fixed';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.color = 'white';
            message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            message.style.padding = '10px 20px';
            message.style.borderRadius = '5px';
            message.style.fontFamily = 'Arial';
            message.style.fontSize = '16px';
            message.textContent = 'Backpack ditemukan! Gunakan scroll mouse untuk mengakses inventory backpack';
            document.body.appendChild(message);
            
            // Hapus pesan setelah 3 detik
            setTimeout(() => {
                document.body.removeChild(message);
            }, 3000);
            
            break;
        }
    }
}

// Modifikasi fungsi collectStick
function collectStick() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isStick) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isStick) {
            // Hapus stick dari scene
            scene.remove(obj);
            const index = sticks.indexOf(obj);
            if (index > -1) {
                sticks.splice(index, 1);
            }
            
            // Tambahkan ke inventory
            stickInventory++;
            addItemToInventory('stick', stickInventory);
            updateStickCount();
            break;
        }
    }
}

// Modifikasi fungsi collectFlashlight
function collectFlashlight() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.isFlashlight) {
            obj = obj.parent;
        }
        if (obj && obj.userData.isFlashlight) {
            // Hapus senter dari scene
            scene.remove(obj);
            const index = flashlights.indexOf(obj);
            if (index > -1) {
                flashlights.splice(index, 1);
            }
            
            // Tambahkan ke inventory
            flashlightInventory++;
            addItemToInventory('flashlight', flashlightInventory);
            updateFlashlightCount();
            break;
        }
    }
}

// Modifikasi fungsi createForest untuk memulai timer api
function createForest() {
    // Pohon-pohon di sekitar api unggun (area aman)
    createPineTree(-10, -10, 1.2);
    createPineTree(10, -10, 0.9);
    createPineTree(-10, -15, 1.1);
    createPineTree(10, -15, 1.3);

    // Membuat grid untuk distribusi pohon yang lebih merata
    const gridSize = 6;
    const mapSize = 100;
    const halfMapSize = mapSize / 2;

    // Membuat pohon di setiap grid dengan variasi posisi
    for (let x = -halfMapSize; x < halfMapSize; x += gridSize) {
        for (let z = -halfMapSize; z < halfMapSize; z += gridSize) {
            // Skip area di sekitar player dan api unggun
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

            // Tambahkan variasi posisi dalam grid
            const offsetX = getRandomPosition(-gridSize/2, gridSize/2);
            const offsetZ = getRandomPosition(-gridSize/2, gridSize/2);
            
            // Variasi ukuran pohon
            const scale = getRandomPosition(0.7, 1.5);
            
            // Probabilitas untuk menempatkan pohon
            if (Math.random() < 0.9) {
                createPineTree(x + offsetX, z + offsetZ, scale);
            }
            
            // Tambahkan batu dengan probabilitas lebih rendah
            if (Math.random() < 0.15) {
                createRock(x + offsetX + getRandomPosition(-2, 2), z + offsetZ + getRandomPosition(-2, 2));
            }
        }
    }

    // Tambahkan rumput dengan grid yang lebih kecil dan probabilitas lebih tinggi
    const grassGridSize = 3;
    for (let x = -halfMapSize; x < halfMapSize; x += grassGridSize) {
        for (let z = -halfMapSize; z < halfMapSize; z += grassGridSize) {
            // Skip area di sekitar player saja
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            // Tambahkan rumput dengan probabilitas lebih tinggi
            if (Math.random() < 0.5) {
                createGrass(
                    x + getRandomPosition(-1, 1),
                    z + getRandomPosition(-1, 1)
                );
            }
        }
    }

    // Tambahkan semak dengan grid yang lebih besar dan area yang lebih luas
    const bushGridSize = 6;
    for (let x = -halfMapSize; x < halfMapSize; x += bushGridSize) {
        for (let z = -halfMapSize; z < halfMapSize; z += bushGridSize) {
            // Skip area di sekitar player dan api unggun
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

            // Tambahkan semak dengan probabilitas lebih tinggi
            if (Math.random() < 0.4) {
                createBush(
                    x + getRandomPosition(-3, 3),
                    z + getRandomPosition(-3, 3)
                );
            }
        }
    }

    // Tambahkan stick di sekitar api unggun
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 2 + Math.random() * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius - 5;
        createStick(x, z);
    }
    
    // Tambahkan stick di seluruh peta
    for (let i = 0; i < 20; i++) {
        const x = getRandomPosition(-40, 40);
        const z = getRandomPosition(-40, 40);
        if (Math.abs(x) > 3 || Math.abs(z + 5) > 3) {
            createStick(x, z);
        }
    }

    // Tambahkan senter di depan api unggun
    createFlashlight(0, -4);

    // Tambahkan backpack di dekat api unggun
    createBackpack(2, -4); // Posisi di sebelah kanan api unggun
}

// Membuat hutan
createForest();

// Fungsi untuk mengecek apakah player di dalam api unggun
function checkInCampfire(position) {
    const campfirePos = new THREE.Vector3(0, 0, -5);
    const distance = new THREE.Vector2(
        position.x - campfirePos.x,
        position.z - campfirePos.z
    ).length();
    
    return distance < 1;
}

// Fungsi untuk membuat partikel api di sekitar player
function createPlayerFireParticles() {
    const particleCount = 30;
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.8
    });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.userData = {
            speed: Math.random() * 0.02 + 0.01,
            offset: Math.random() * Math.PI * 2,
            initialY: Math.random() * 0.5
        };
        playerFireParticles.push(particle);
        scene.add(particle);
    }
}

// Fungsi untuk menghapus partikel api player
function removePlayerFireParticles() {
    playerFireParticles.forEach(particle => {
        scene.remove(particle);
    });
    playerFireParticles = [];
}

// Fungsi untuk menangani efek terbakar
function handleBurning(isInFire) {
    if (isInFire && !isBurning) {
        // Mulai terbakar
        isBurning = true;
        burnDiv.style.opacity = '0.3';
        
        // Tambahkan cahaya ke player
        if (!playerLight) {
            playerLight = new THREE.PointLight(0xffaa00, 1, 10);
            scene.add(playerLight);
        }

        // Buat partikel api
        createPlayerFireParticles();
        
        // Hapus timer jika ada
        if (burnTimer) {
            clearTimeout(burnTimer);
        }
    } else if (!isInFire && isBurning) {
        // Keluar dari api
        isBurning = false;
        
        // Hapus timer jika ada
        if (burnTimer) {
            clearTimeout(burnTimer);
        }
        
        // Set timer untuk menghilangkan efek
        burnTimer = setTimeout(() => {
            burnDiv.style.opacity = '0';
            if (playerLight) {
                scene.remove(playerLight);
                playerLight = null;
            }
            removePlayerFireParticles();
        }, 1000);
    }
}

// Fungsi untuk membuat kunang-kunang
function createFirefly() {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    const firefly = new THREE.Mesh(geometry, material);
    
    // Posisi acak di sekitar api unggun
    firefly.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 20
    );
    
    firefly.userData = {
        speed: Math.random() * 0.02 + 0.01,
        offset: Math.random() * Math.PI * 2,
        initialY: firefly.position.y
    };
    
    scene.add(firefly);
    fireflies.push(firefly);
}

// Modifikasi fungsi changeFireIntensity
function changeFireIntensity() {
    try {
        console.log('changeFireIntensity dipanggil, level:', fireIntensityLevel);
        // Pastikan level tetap dalam rentang 0-3
        fireIntensityLevel = Math.max(0, Math.min(3, fireIntensityLevel));
        
        // Update status api
        isFireOn = fireIntensityLevel !== 0;
        
        // Update informasi api unggun
        let intensityText = '';
        switch(fireIntensityLevel) {
            case 0: intensityText = 'Mati'; break;
            case 1: intensityText = 'Redup'; break;
            case 2: intensityText = 'Normal'; break;
            case 3: intensityText = 'Terang'; break;
            default: intensityText = 'Mati'; break;
        }
        
        if (!isFireOn) {
            console.log('Api mati, memeriksa waktu dan memutar musik yang sesuai');
            // Matikan cahaya api
            if (fireLight) {
                fireLight.intensity = 0;
                fireLight.distance = 0;
                fireLight.visible = false;
            }
            
            // Sembunyikan api
            if (fire) {
                fire.visible = false;
                fire.material.emissiveIntensity = 0;
                fire.material.opacity = 0;
            }
            
            // Hapus partikel api dari campfireGroup
            for (let i = campfireGroup.children.length - 1; i >= 0; i--) {
                const child = campfireGroup.children[i];
                // Hanya hapus objek yang merupakan partikel api
                if (particles.includes(child)) {
                    campfireGroup.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            }
            // Kosongkan array particles
            particles.length = 0;
            
            // Jika malam hari dan api mati, putar musik horror
            if (timeState === 2) {
                console.log('Malam hari dan api mati, memutar musik horror');
                if (morningSound.isPlaying) morningSound.stop();
                if (nightSound.isPlaying) nightSound.stop();
                
                if (!horrorSound.isPlaying) {
                    horrorSound.setVolume(0.5);
                    horrorSound.play();
                }
            }
            
            // Update visibilitas Choco Character
            updateChocoVisibility();
        } else {
            // Nyalakan kembali api dan partikel
            if (fireLight) {
                fireLight.visible = true;
                // Set intensitas berdasarkan level dan waktu
                switch(timeState) {
                    case 0: // Siang
                        fireLight.intensity = fireIntensityLevel === 1 ? 0.8 : (fireIntensityLevel === 2 ? 1.2 : 1.5);
                        fireLight.distance = fireIntensityLevel === 1 ? 15 : (fireIntensityLevel === 2 ? 20 : 25);
                        break;
                    case 1: // Sore
                        fireLight.intensity = fireIntensityLevel === 1 ? 1.2 : (fireIntensityLevel === 2 ? 1.8 : 2.2);
                        fireLight.distance = fireIntensityLevel === 1 ? 20 : (fireIntensityLevel === 2 ? 25 : 30);
                        break;
                    case 2: // Malam
                        fireLight.intensity = fireIntensityLevel === 1 ? 1.5 : (fireIntensityLevel === 2 ? 2.2 : 2.8);
                        fireLight.distance = fireIntensityLevel === 1 ? 25 : (fireIntensityLevel === 2 ? 30 : 35);
                        break;
                }
            }
            
            // Tampilkan api
            if (fire) {
                fire.visible = true;
                fire.material.emissiveIntensity = 0.5;
                fire.material.opacity = 0.8;
            }
            
            // Buat partikel api baru jika array kosong
            if (particles.length === 0) {
                const particleCount = 50;
                const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff4400,
                    transparent: true,
                    opacity: 0.8
                });

                for (let i = 0; i < particleCount; i++) {
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    particle.position.set(
                        (Math.random() - 0.5) * 0.5,
                        Math.random() * 1.5,
                        (Math.random() - 0.5) * 0.5
                    );
                    particle.userData = {
                        speed: Math.random() * 0.02 + 0.01,
                        offset: Math.random() * Math.PI * 2
                    };
                    campfireGroup.add(particle);
                    particles.push(particle);
                }
            }
        }
        
        return intensityText;
    } catch (error) {
        console.error('Error dalam changeFireIntensity:', error);
        return 'Error';
    }
}

// Modifikasi fungsi changeTime untuk memastikan musik yang benar diputar
function changeTime() {
    const previousTime = timeState;
    timeState = (timeState + 1) % 3;
    
    // Update scene berdasarkan waktu
    switch(timeState) {
        case 0: // Siang
            scene.background = new THREE.Color(0x87CEEB);
            sun.position.set(0, 20, -5);
            sunMaterial.color.set(0xffff00);
            sunLight.intensity = 1;
            sunLight.color.set(0xffffff);
            ambientLight.intensity = 0.5;
            fireLight.intensity = 1.5;
            fireLight.distance = 20;
            floorMaterial.color.set(0x00ff00);
            break;
            
        case 1: // Sore
            scene.background = new THREE.Color(0xff7f50);
            sun.position.set(30, 10, -50);
            sunMaterial.color.set(0xff4500);
            sunLight.intensity = 0.5;
            sunLight.color.set(0xffa500);
            ambientLight.intensity = 0.3;
            fireLight.intensity = 2.5;
            fireLight.distance = 25;
            floorMaterial.color.set(0x006400);
            break;
            
        case 2: // Malam
            scene.background = new THREE.Color(0x000033);
            sun.position.set(0, -20, -5);
            sunMaterial.color.set(0x000000);
            sunLight.intensity = 0;
            ambientLight.intensity = 0.1;
            fireLight.intensity = 3.5;
            fireLight.distance = 30;
            floorMaterial.color.set(0x003300);
            break;
    }
    
    // Update audio hanya jika waktu berubah
    if (previousTime !== timeState) {
        playAudioForCurrentTime();
    }
    
    // Update visibilitas Choco Character
    updateChocoVisibility();
}

// Inisialisasi waktu siang
changeTime();

// Fungsi untuk mengubah musik berdasarkan waktu
function changeMusic() {
    // Hentikan semua audio yang sedang diputar
    if (morningSound.isPlaying) morningSound.stop();
    if (nightSound.isPlaying) nightSound.stop();
    if (horrorSound.isPlaying) horrorSound.stop();
    
    // Putar audio sesuai waktu
    if (timeState === 0) { // Pagi
        morningSound.play();
    } else if (timeState === 1 || timeState === 2) { // Sore atau Malam
        if (timeState === 2 && !isFireOn) { // Malam dan api mati
            horrorSound.play();
        } else {
            nightSound.play();
        }
    }
}

// Fungsi untuk membuat inventory backpack
function createBackpackInventory() {
    const backpackInventoryDiv = document.createElement('div');
    backpackInventoryDiv.style.position = 'fixed';
    backpackInventoryDiv.style.bottom = '80px'; // Posisi di atas inventory utama
    backpackInventoryDiv.style.left = '50%';
    backpackInventoryDiv.style.transform = 'translateX(-50%)';
    backpackInventoryDiv.style.display = 'flex';
    backpackInventoryDiv.style.gap = '5px';
    backpackInventoryDiv.style.zIndex = '100';
    backpackInventoryDiv.style.display = 'none'; // Sembunyikan awalnya
    backpackInventoryDiv.id = 'backpackInventory';
    document.body.appendChild(backpackInventoryDiv);

    // Buat 3 slot untuk backpack
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.style.width = backpackSlotSize;
        slot.style.height = backpackSlotSize;
        slot.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
        slot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        slot.style.boxSizing = 'border-box';
        slot.style.display = 'flex';
        slot.style.justifyContent = 'center';
        slot.style.alignItems = 'center';
        slot.style.color = 'white';
        slot.style.fontSize = '12px';
        slot.textContent = i + 1;
        backpackInventoryDiv.appendChild(slot);
        backpackSlots.push(slot);
    }
}

// Fungsi untuk mengecek apakah inventory utama penuh
function isMainInventoryFull() {
    return inventorySlots.every(slot => slot.querySelector('img'));
}

// Fungsi untuk mengecek apakah inventory backpack penuh
function isBackpackInventoryFull() {
    return backpackSlots.every(slot => slot.querySelector('img'));
}

// Fungsi untuk menambahkan item ke inventory
function addItemToInventory(itemType, count = 1) {
    if (isMainInventoryFull()) {
        // Jika inventory utama penuh, coba tambahkan ke backpack
        if (hasBackpack && !isBackpackInventoryFull()) {
            addItemToBackpack(itemType, count);
        }
    } else {
        // Tambahkan ke inventory utama
        let emptySlot = -1;
        for (let i = 0; i < inventorySlots.length; i++) {
            if (!inventorySlots[i].querySelector('img')) {
                emptySlot = i;
                break;
            }
        }
        
        if (emptySlot !== -1) {
            const slot = inventorySlots[emptySlot];
            slot.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = itemType === 'stick' ? 'Asset/2d asset/Item Icon/stick.png' : 'Asset/2d asset/Item Icon/senter.png';
            img.style.width = '80%';
            img.style.height = '80%';
            img.style.objectFit = 'contain';
            slot.appendChild(img);
            
            const countDiv = document.createElement('div');
            countDiv.style.position = 'absolute';
            countDiv.style.bottom = '2px';
            countDiv.style.right = '2px';
            countDiv.style.color = 'white';
            countDiv.style.fontSize = '12px';
            countDiv.style.textShadow = '1px 1px 1px black';
            countDiv.textContent = count;
            slot.appendChild(countDiv);
        }
    }
}

// Fungsi untuk menambahkan item ke backpack
function addItemToBackpack(itemType, count = 1) {
    let emptySlot = -1;
    for (let i = 0; i < backpackSlots.length; i++) {
        if (!backpackSlots[i].querySelector('img')) {
            emptySlot = i;
            break;
        }
    }
    
    if (emptySlot !== -1) {
        const slot = backpackSlots[emptySlot];
        slot.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = itemType === 'stick' ? 'Asset/2d asset/Item Icon/stick.png' : 'Asset/2d asset/Item Icon/senter.png';
        img.style.width = '80%';
        img.style.height = '80%';
        img.style.objectFit = 'contain';
        slot.appendChild(img);
        
        const countDiv = document.createElement('div');
        countDiv.style.position = 'absolute';
        countDiv.style.bottom = '2px';
        countDiv.style.right = '2px';
        countDiv.style.color = 'white';
        countDiv.style.fontSize = '12px';
        countDiv.style.textShadow = '1px 1px 1px black';
        countDiv.textContent = count;
        slot.appendChild(countDiv);
    }
}

// Panggil createBackpackInventory saat inisialisasi
createBackpackInventory();

// Tambahkan variabel untuk suara ranting
const stickSound = new THREE.Audio(audioListener);
let isPlayingStickSound = false;

// Load suara ranting
audioLoader.load('Asset/sound/injak_ranting.mp3', 
    function(buffer) {
        stickSound.setBuffer(buffer);
        stickSound.setVolume(0.5);
    },
    undefined,
    function(error) {
        console.error('Error loading stick sound:', error);
    }
);

// Fungsi untuk mengecek apakah player berada di atas ranting
function isPlayerOnStick() {
    const playerPosition = camera.position.clone();
    playerPosition.y = 0; // Set y ke 0 untuk mengecek di level tanah

    for (const stick of sticks) {
        const stickPosition = stick.position.clone();
        const distance = playerPosition.distanceTo(stickPosition);
        
        if (distance < 0.5) { // Jarak deteksi 0.5 unit
            return true;
        }
    }
    return false;
}

// Tambahkan variabel untuk suara langkah kaki
const footstepSound = new THREE.Audio(audioListener);
let isFootstepPlaying = false;

// Load suara langkah kaki
audioLoader.load('Asset/sound/footstep.mp3', 
    function(buffer) {
        footstepSound.setBuffer(buffer);
        footstepSound.setVolume(0.5);
        footstepSound.setLoop(true); // Set loop agar suara terus berulang
    },
    undefined,
    function(error) {
        console.error('Error loading footstep sound:', error);
    }
);

// Tambahkan variabel untuk suara backpack
const backpackSound = new THREE.Audio(audioListener);

// Load suara backpack
audioLoader.load('Asset/sound/use_bag.ogg', 
    function(buffer) {
        backpackSound.setBuffer(buffer);
        backpackSound.setVolume(0.5);
    },
    undefined,
    function(error) {
        console.error('Error loading backpack sound:', error);
    }
);

// Modifikasi fungsi updateChocoVisibility
function updateChocoVisibility() {
    if (!chocoCharacter) {
        console.log('Choco Character belum diinisialisasi');
        return;
    }
    
    // Model hanya muncul saat malam dan api unggun mati
    const shouldBeVisible = timeState === 2 && fireIntensityLevel === 0;
    chocoCharacter.visible = shouldBeVisible;
}

// Modifikasi fungsi createChocoCharacter
function createChocoCharacter(x, z) {
    console.log('Memulai pembuatan Choco Character...');
    fbxLoader.load(
        './Asset/3d asset/tungtung2/Choco_Character_0518141014_texture_fbx/Choco_Character_0518141014_texture.fbx',
        function(object) {
            console.log('Model FBX Choco Character berhasil dimuat');
            textureLoader.load(
                './Asset/3d asset/tungtung2/Choco_Character_0518141014_texture_fbx/Choco_Character_0518141014_texture.png',
                function(texture) {
                    console.log('Texture Choco Character berhasil dimuat');
                    object.traverse(function(child) {
                        if (child.isMesh) {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                        }
                    });

                    object.scale.set(0.02, 0.02, 0.02);
                    object.position.set(x, 0, z);
                    // Sesuaikan posisi Y agar model berada di atas tanah
                    object.position.y = 2; // Naikkan posisi Y menjadi 4 unit
                    object.visible = false;
                    
                    // Tambahkan rotasi jika diperlukan
                    object.rotation.y = Math.PI; // Putar 180 derajat jika perlu
                    
                    chocoCharacter = object;
                    scene.add(chocoCharacter);
                    
                    // Update visibilitas setelah model selesai dimuat
                    updateChocoVisibility();
                    console.log('Choco Character berhasil ditambahkan ke scene dengan posisi Y:', object.position.y);
                },
                // Progress callback untuk texture
                function(xhr) {
                    console.log('Loading texture:', (xhr.loaded / xhr.total * 100) + '%');
                },
                // Error callback untuk texture
                function(error) {
                    console.error('Error loading texture:', error);
                }
            );
        },
        // Progress callback untuk model
        function(xhr) {
            console.log('Loading model:', (xhr.loaded / xhr.total * 100) + '%');
        },
        // Error callback untuk model
        function(error) {
            console.error('Error loading model:', error);
        }
    );
}

// Panggil createChocoCharacter setelah scene diinisialisasi
createChocoCharacter(2, -5);

// Fungsi untuk menginisialisasi scene dengan kondisi sore hari
function initializeScene() {
    // Set waktu ke sore hari
    timeState = 1;
    
    // Atur pencahayaan untuk sore hari
    scene.background = new THREE.Color(0xff7f50); // Warna langit sore
    sun.position.set(30, 10, -50);
    sunMaterial.color.set(0xff4500);
    sunLight.intensity = 0.5;
    sunLight.color.set(0xffa500);
    ambientLight.intensity = 0.3;
    
    // Atur api unggun
    fireLight.intensity = 2.5;
    fireLight.distance = 25;
    
    // Atur warna lantai
    floorMaterial.color.set(0x006400);
    
    // Load boneka
    createDoll();
    
    // Mulai animasi
    animate();
}

// Hapus pemanggilan animate() langsung dan ganti dengan initializeScene
initializeScene(); 

// Hapus deklarasi duplikat dan biarkan hanya kode loading
audioLoader.load('Asset/sound/tung-tung-jadi.mp3',
    function(buffer) {
        chocoSound.setBuffer(buffer);
        chocoSound.setVolume(0.5);
        chocoSound.setLoop(true); // Mengaktifkan loop
        isChocoSoundLoaded = true;
        console.log('Audio Choco Character berhasil dimuat');
    },
    function(xhr) {
        console.log('Loading Choco audio:', (xhr.loaded / xhr.total * 100) + '%');
    },
    function(error) {
        console.error('Error loading Choco audio:', error);
    }
); 

// Fungsi untuk membuat boneka
function createDoll() {
    console.log('Memulai pembuatan boneka...');
    
    // Generate posisi acak
    const minDistance = 10; // Jarak minimal dari api unggun
    const maxDistance = 30; // Jarak maksimal dari api unggun
    const randomAngle = Math.random() * Math.PI * 2; // Sudut acak 0-360 derajat
    const randomDistance = minDistance + Math.random() * (maxDistance - minDistance);
    
    // Hitung posisi X dan Z berdasarkan sudut dan jarak
    const randomX = Math.cos(randomAngle) * randomDistance;
    const randomZ = Math.sin(randomAngle) * randomDistance;
    
    console.log('Posisi acak boneka:', { x: randomX, z: randomZ });
    
    // Load material terlebih dahulu dengan texture yang benar
    mtlLoader.load(
        'Asset/3d asset/Doll_with_Note_0530041709_texture_obj/Doll_with_Note_0530041709_texture.mtl',
        function(materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            
            // Load model OBJ
            objLoader.load(
                'Asset/3d asset/Doll_with_Note_0530041709_texture_obj/Doll_with_Note_0530041709_texture.obj',
                function(object) {
                    console.log('Model boneka berhasil dimuat');
                    
                    // Atur posisi acak, skala, dan rotasi
                    object.position.set(randomX, 0.5, randomZ);
                    object.scale.set(0.3, 0.3, 0.3);
                    object.rotation.y = Math.random() * Math.PI * 2; // Rotasi acak
                    
                    // Tambahkan pencahayaan khusus untuk boneka
                    const dollLight = new THREE.PointLight(0xffffcc, 0.5, 3);
                    dollLight.position.set(0, 1, 0);
                    object.add(dollLight);
                    
                    // Terapkan texture boneka
                    const texture = textureLoader.load(
                        'Asset/3d asset/Doll_with_Note_0530041709_texture_obj/Doll_with_Note_0530041709_texture.png'
                    );
                    
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                            child.material.side = THREE.DoubleSide;
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Simpan referensi model
                    dollModel = object;
                    
                    // Tambahkan ke scene
                    scene.add(object);
                    
                    // Set visibilitas awal berdasarkan waktu saat ini
                    updateDollVisibility();
                    
                    console.log('Boneka berhasil ditambahkan ke scene dengan texture yang benar di posisi:', object.position);
                }
            );
        }
    );
}

// Modifikasi fungsi changeTime untuk mengupdate visibilitas boneka
function changeTime() {
    const previousTime = timeState;
    timeState = (timeState + 1) % 3;
    
    // Update scene berdasarkan waktu
    switch(timeState) {
        case 0: // Siang
            scene.background = new THREE.Color(0x87CEEB);
            sun.position.set(0, 20, -5);
            sunMaterial.color.set(0xffff00);
            sunLight.intensity = 1;
            sunLight.color.set(0xffffff);
            ambientLight.intensity = 0.5;
            fireLight.intensity = 1.5;
            fireLight.distance = 20;
            floorMaterial.color.set(0x00ff00);
            break;
            
        case 1: // Sore
            scene.background = new THREE.Color(0xff7f50);
            sun.position.set(30, 10, -50);
            sunMaterial.color.set(0xff4500);
            sunLight.intensity = 0.5;
            sunLight.color.set(0xffa500);
            ambientLight.intensity = 0.3;
            fireLight.intensity = 2.5;
            fireLight.distance = 25;
            floorMaterial.color.set(0x006400);
            break;
            
        case 2: // Malam
            scene.background = new THREE.Color(0x000033);
            sun.position.set(0, -20, -5);
            sunMaterial.color.set(0x000000);
            sunLight.intensity = 0;
            ambientLight.intensity = 0.1;
            fireLight.intensity = 3.5;
            fireLight.distance = 30;
            floorMaterial.color.set(0x003300);
            break;
    }
    
    // Update audio hanya jika waktu berubah
    if (previousTime !== timeState) {
        playAudioForCurrentTime();
    }
    
    // Update visibilitas boneka setiap kali waktu berubah
    updateDollVisibility();
}

// Fungsi untuk mengupdate visibilitas boneka berdasarkan waktu
function updateDollVisibility() {
    if (dollModel) {
        // Hanya tampilkan boneka saat malam hari (timeState === 2)
        dollModel.visible = (timeState === 2);
    }
}

// Mulai scene
initializeScene();

// Membuat elemen untuk layar kemenangan
const winScreenDiv = document.createElement('div');
winScreenDiv.style.position = 'fixed';
winScreenDiv.style.top = '0';
winScreenDiv.style.left = '0';
winScreenDiv.style.width = '100%';
winScreenDiv.style.height = '100%';
winScreenDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
winScreenDiv.style.backdropFilter = 'blur(8px)';
winScreenDiv.style.display = 'none';
winScreenDiv.style.flexDirection = 'column';
winScreenDiv.style.justifyContent = 'center';
winScreenDiv.style.alignItems = 'center';
winScreenDiv.style.zIndex = '9999';

// Tambahkan teks "You Win"
const winText = document.createElement('div');
winText.textContent = 'You Win';
winText.style.color = 'white';
winText.style.fontSize = '48px';
winText.style.fontFamily = 'Arial';
winText.style.marginBottom = '20px';
winScreenDiv.appendChild(winText);

// Tambahkan tombol refresh
const refreshButton = document.createElement('button');
refreshButton.textContent = 'Main Lagi';
refreshButton.style.padding = '10px 20px';
refreshButton.style.fontSize = '24px';
refreshButton.style.cursor = 'pointer';
refreshButton.style.backgroundColor = '#4CAF50';
refreshButton.style.color = 'white';
refreshButton.style.border = 'none';
refreshButton.style.borderRadius = '5px';
refreshButton.onclick = () => location.reload();
winScreenDiv.appendChild(refreshButton);

document.body.appendChild(winScreenDiv);

// Fungsi untuk menampilkan layar kemenangan
function showWinScreen() {
    hasWon = true;
    winScreenDiv.style.display = 'flex';
    document.exitPointerLock();
}

// Fungsi untuk membuka YouTube
function openYouTube() {
    window.open('https://www.youtube.com', '_blank');
    document.exitPointerLock();
}

// Panggil updateHealthBar untuk menampilkan health awal
updateHealthBar();