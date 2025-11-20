// Boot Animation Handler
class BootManager {
    constructor() {
        this.bootScreen = document.getElementById('boot-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.bootText = document.querySelector('.boot-text');
        this.desktop = document.getElementById('desktop');
    }

    async start() {
        const messages = [
            'Initializing system...',
            'Loading components...',
            'Mounting filesystem...',
            'Starting services...',
            'Ready.'
        ];

        for (let i = 0; i < messages.length; i++) {
            this.bootText.textContent = messages[i];
            this.loadingProgress.style.width = `${((i + 1) / messages.length) * 100}%`;
            await this.sleep(300 + Math.random() * 200);
        }

        await this.sleep(500);
        this.complete();
    }

    complete() {
        this.bootScreen.style.opacity = '0';
        this.bootScreen.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            this.bootScreen.style.display = 'none';
            this.desktop.style.display = 'block';

            // Trigger desktop initialization
            if (window.desktopManager) {
                window.desktopManager.init();
            }
        }, 300);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-start boot sequence
window.addEventListener('DOMContentLoaded', () => {
    const bootManager = new BootManager();
    bootManager.start();
});
