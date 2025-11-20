// Real Rubik's Cube with Three.js
class RubiksCube {
    constructor() {
        this.container = document.getElementById('cube-background');
        if (!this.container) return;

        this.cubelets = [];
        this.isAnimating = false;
        this.moves = [];

        this.init();
        this.animate();
        this.startSolveCycle();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Create cube
        this.createCube();
    }

    createCube() {
        const size = 0.95;
        const gap = 0.05;

        // Colors for each face (Rubik's cube standard)
        const colors = {
            front: 0x00d9ff,   // Blue
            back: 0x10b981,    // Green
            right: 0xef4444,   // Red
            left: 0xf59e0b,    // Orange
            top: 0xe0e0e0,     // White
            bottom: 0xfbbf24   // Yellow
        };

        // Create 27 cubelets (3x3x3)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const materials = [];

                    // Create materials for each face
                    for (let i = 0; i < 6; i++) {
                        let color = 0x1a1a1a; // Black for inner faces

                        // Only color outer faces
                        if (i === 0 && x === 1) color = colors.right;   // Right face
                        if (i === 1 && x === -1) color = colors.left;   // Left face
                        if (i === 2 && y === 1) color = colors.top;     // Top face
                        if (i === 3 && y === -1) color = colors.bottom; // Bottom face
                        if (i === 4 && z === 1) color = colors.front;   // Front face
                        if (i === 5 && z === -1) color = colors.back;   // Back face

                        materials.push(new THREE.MeshLambertMaterial({
                            color: color,
                            emissive: color === 0x1a1a1a ? 0x000000 : color,
                            emissiveIntensity: 0.2
                        }));
                    }

                    const geometry = new THREE.BoxGeometry(size, size, size);
                    const cubelet = new THREE.Mesh(geometry, materials);

                    cubelet.position.set(x * (size + gap), y * (size + gap), z * (size + gap));
                    cubelet.userData = { x, y, z, homePosition: cubelet.position.clone() };

                    this.scene.add(cubelet);
                    this.cubelets.push(cubelet);
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Slow rotation for display
        if (!this.isAnimating) {
            this.scene.rotation.y += 0.002;
            this.scene.rotation.x = -0.3;
        }

        this.renderer.render(this.scene, this.camera);
    }

    async startSolveCycle() {
        while (true) {
            await this.sleep(2000);
            await this.scramble(8);
            await this.sleep(1500);
            await this.solve();
        }
    }

    async scramble(moveCount) {
        this.moves = [];
        const moveTypes = ['R', 'L', 'U', 'D', 'F', 'B'];

        for (let i = 0; i < moveCount; i++) {
            const move = moveTypes[Math.floor(Math.random() * moveTypes.length)];
            const clockwise = Math.random() > 0.5;

            this.moves.push({ move, clockwise });
            await this.executeMove(move, clockwise);
            await this.sleep(400);
        }
    }

    async solve() {
        // Reverse all moves
        for (let i = this.moves.length - 1; i >= 0; i--) {
            const { move, clockwise } = this.moves[i];
            await this.executeMove(move, !clockwise); // Opposite direction
            await this.sleep(300);
        }
    }

    async executeMove(move, clockwise) {
        this.isAnimating = true;

        const affectedCubelets = this.getCubeletsForMove(move);
        const axis = this.getAxisForMove(move);
        const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;

        // Create a group for rotation
        const group = new THREE.Group();
        this.scene.add(group);

        // Add cubelets to group
        affectedCubelets.forEach(cubelet => {
            this.scene.remove(cubelet);
            group.add(cubelet);
        });

        // Animate rotation
        const steps = 15;
        const angleStep = angle / steps;

        for (let i = 0; i < steps; i++) {
            group.rotation[axis] += angleStep;
            await this.sleep(20);
        }

        // Remove from group and update positions
        group.rotation[axis] = 0;
        affectedCubelets.forEach(cubelet => {
            group.remove(cubelet);
            group.updateMatrixWorld();

            cubelet.position.applyMatrix4(group.matrixWorld);
            cubelet.rotation.setFromRotationMatrix(group.matrixWorld);

            this.scene.add(cubelet);
        });

        this.scene.remove(group);
        this.isAnimating = false;
    }

    getCubeletsForMove(move) {
        switch(move) {
            case 'R': return this.cubelets.filter(c => c.userData.x === 1);
            case 'L': return this.cubelets.filter(c => c.userData.x === -1);
            case 'U': return this.cubelets.filter(c => c.userData.y === 1);
            case 'D': return this.cubelets.filter(c => c.userData.y === -1);
            case 'F': return this.cubelets.filter(c => c.userData.z === 1);
            case 'B': return this.cubelets.filter(c => c.userData.z === -1);
        }
    }

    getAxisForMove(move) {
        switch(move) {
            case 'R':
            case 'L':
                return 'x';
            case 'U':
            case 'D':
                return 'y';
            case 'F':
            case 'B':
                return 'z';
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('cube-background')) {
            window.rubiksCube = new RubiksCube();
        }
    }, 1000);
});
