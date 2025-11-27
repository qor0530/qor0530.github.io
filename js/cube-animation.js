// Perfect Rubik's Cube Implementation with Three.js
class RubiksCube {
    constructor() {
        this.container = document.getElementById('cube-background');
        if (!this.container) {
            console.error('Cube container not found!');
            return;
        }

        console.log('Initializing Rubik\'s Cube...');
        console.log('Container:', this.container);
        console.log('THREE available:', typeof THREE !== 'undefined');

        // State
        this.cubelets = [];
        this.isAnimating = false;
        this.moveQueue = [];
        this.cubeSize = 3; // 3x3x3 cube
        this.cubeletSize = 0.95;
        this.gap = 0.05;

        // Initialize
        this.init();
        this.createCube();
        this.animate();
        this.startAutoPlay();

        console.log('Rubik\'s Cube initialized successfully!');
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(6, 6, 6);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Clear container and add canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('Three.js scene initialized');
    }

    createCube() {
        // Rubik's cube standard colors
        const colorMap = {
            right: 0xef4444,   // Red (R)
            left: 0xf59e0b,    // Orange (L)
            top: 0xe0e0e0,     // White (U)
            bottom: 0xfbbf24,  // Yellow (D)
            front: 0x00d9ff,   // Blue (F)
            back: 0x10b981     // Green (B)
        };

        const blackColor = 0x1a1a1a; // Inner face color

        // Create 3x3x3 = 27 cubelets
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const materials = [];

                    // Right (x+), Left (x-), Top (y+), Bottom (y-), Front (z+), Back (z-)
                    const faces = [
                        { axis: 'x', value: 1, color: colorMap.right },   // Right
                        { axis: 'x', value: -1, color: colorMap.left },   // Left
                        { axis: 'y', value: 1, color: colorMap.top },     // Top
                        { axis: 'y', value: -1, color: colorMap.bottom }, // Bottom
                        { axis: 'z', value: 1, color: colorMap.front },   // Front
                        { axis: 'z', value: -1, color: colorMap.back }    // Back
                    ];

                    // Create materials for each face
                    faces.forEach(face => {
                        let color = blackColor;

                        // Only color the outer faces
                        if (face.axis === 'x' && x === face.value) color = face.color;
                        else if (face.axis === 'y' && y === face.value) color = face.color;
                        else if (face.axis === 'z' && z === face.value) color = face.color;

                        materials.push(new THREE.MeshStandardMaterial({
                            color: color,
                            emissive: color === blackColor ? 0x000000 : color,
                            emissiveIntensity: 0.15,
                            roughness: 0.5,
                            metalness: 0.1
                        }));
                    });

                    // Create cubelet
                    const geometry = new THREE.BoxGeometry(
                        this.cubeletSize,
                        this.cubeletSize,
                        this.cubeletSize
                    );

                    const cubelet = new THREE.Mesh(geometry, materials);

                    // Position cubelet
                    const offset = this.cubeletSize + this.gap;
                    cubelet.position.set(
                        x * offset,
                        y * offset,
                        z * offset
                    );

                    // Store original position data
                    cubelet.userData = {
                        gridX: x,
                        gridY: y,
                        gridZ: z,
                        initialPosition: cubelet.position.clone()
                    };

                    this.scene.add(cubelet);
                    this.cubelets.push(cubelet);
                }
            }
        }

        console.log(`Created ${this.cubelets.length} cubelets`);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Slow rotation when not animating moves
        if (!this.isAnimating) {
            this.scene.rotation.y += 0.003;
            this.scene.rotation.x = Math.sin(Date.now() * 0.0001) * 0.1 - 0.2;
        }

        this.renderer.render(this.scene, this.camera);
    }

    async startAutoPlay() {
        // Wait a bit before starting
        await this.sleep(2000);

        while (true) {
            // Scramble
            await this.scramble(10);
            await this.sleep(1500);

            // Solve
            await this.solve();
            await this.sleep(2000);
        }
    }

    async scramble(moveCount) {
        this.moveQueue = [];

        const moves = ['R', 'L', 'U', 'D', 'F', 'B'];

        for (let i = 0; i < moveCount; i++) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            const clockwise = Math.random() > 0.5;

            this.moveQueue.push({ move, clockwise });
            await this.executeMove(move, clockwise);
            await this.sleep(350);
        }
    }

    async solve() {
        // Reverse all moves in opposite order
        for (let i = this.moveQueue.length - 1; i >= 0; i--) {
            const { move, clockwise } = this.moveQueue[i];
            await this.executeMove(move, !clockwise);
            await this.sleep(280);
        }

        this.moveQueue = [];
    }

    async executeMove(moveName, clockwise) {
        if (this.isAnimating) {
            await this.sleep(100);
            return this.executeMove(moveName, clockwise);
        }

        this.isAnimating = true;

        // Get cubelets affected by this move
        const cubelets = this.getLayerCubelets(moveName);

        // Get rotation axis
        const axis = this.getMoveAxis(moveName);

        // Get rotation direction
        const direction = this.getMoveDirection(moveName, clockwise);
        const angle = direction * Math.PI / 2;

        // Create temporary group for rotation
        const rotationGroup = new THREE.Group();
        this.scene.add(rotationGroup);

        // Add cubelets to rotation group
        cubelets.forEach(cubelet => {
            this.scene.remove(cubelet);

            // Store world position and rotation
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            cubelet.getWorldPosition(worldPos);
            cubelet.getWorldQuaternion(worldQuat);

            rotationGroup.add(cubelet);
        });

        // Animate rotation
        const steps = 12;
        const angleStep = angle / steps;

        for (let i = 0; i < steps; i++) {
            rotationGroup.rotation[axis] += angleStep;
            await this.sleep(16); // ~60fps
        }

        // Finalize rotation - move cubelets back to scene
        rotationGroup.updateMatrixWorld();

        cubelets.forEach(cubelet => {
            // Get final world position and rotation
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            cubelet.getWorldPosition(worldPos);
            cubelet.getWorldQuaternion(worldQuat);

            // Remove from group
            rotationGroup.remove(cubelet);

            // Apply world transform
            cubelet.position.copy(worldPos);
            cubelet.quaternion.copy(worldQuat);

            // Add back to scene
            this.scene.add(cubelet);
        });

        // Clean up rotation group
        this.scene.remove(rotationGroup);

        this.isAnimating = false;
    }

    getLayerCubelets(moveName) {
        const offset = this.cubeletSize + this.gap;
        const threshold = 0.1;

        switch(moveName) {
            case 'R': // Right layer (x = 1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.x - offset) < threshold
                );
            case 'L': // Left layer (x = -1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.x + offset) < threshold
                );
            case 'U': // Upper layer (y = 1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.y - offset) < threshold
                );
            case 'D': // Down layer (y = -1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.y + offset) < threshold
                );
            case 'F': // Front layer (z = 1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.z - offset) < threshold
                );
            case 'B': // Back layer (z = -1)
                return this.cubelets.filter(c =>
                    Math.abs(c.position.z + offset) < threshold
                );
            default:
                return [];
        }
    }

    getMoveAxis(moveName) {
        switch(moveName) {
            case 'R':
            case 'L':
                return 'x';
            case 'U':
            case 'D':
                return 'y';
            case 'F':
            case 'B':
                return 'z';
            default:
                return 'y';
        }
    }

    getMoveDirection(moveName, clockwise) {
        // Standard Rubik's cube notation direction
        // R, U, F = clockwise when looking at that face
        // L, D, B = clockwise when looking at that face (opposite side)

        const directions = {
            'R': clockwise ? 1 : -1,
            'L': clockwise ? -1 : 1,
            'U': clockwise ? 1 : -1,
            'D': clockwise ? -1 : 1,
            'F': clockwise ? 1 : -1,
            'B': clockwise ? -1 : 1
        };

        return directions[moveName] || 1;
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when desktop is shown
window.addEventListener('DOMContentLoaded', () => {
    // Wait for boot animation and desktop to be visible
    setTimeout(() => {
        const desktop = document.getElementById('desktop');
        const container = document.getElementById('cube-background');

        if (desktop && container && desktop.style.display !== 'none') {
            console.log('Starting Rubik\'s Cube initialization...');
            console.log('Container dimensions:', container.clientWidth, 'x', container.clientHeight);

            if (typeof THREE === 'undefined') {
                console.error('THREE.js not loaded!');
                return;
            }

            try {
                window.rubiksCube = new RubiksCube();
            } catch (error) {
                console.error('Failed to initialize Rubik\'s Cube:', error);
            }
        } else {
            console.warn('Desktop or cube container not ready');
        }
    }, 2500); // Wait for boot animation to complete
});
