// Window Manager - Handles all window operations
class WindowManager {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.zIndexCounter = 100;
        this.container = document.getElementById('windows-container');
        this.altTabOverlay = document.getElementById('alt-tab-overlay');
        this.altTabContainer = document.querySelector('.alt-tab-container');
        this.altTabActive = false;
        this.altTabIndex = 0;
        this.taskbarItems = document.querySelector('.taskbar-items');
        this.contextMenu = document.getElementById('context-menu');
        this.contextMenuTarget = null;

        this.initKeyboardShortcuts();
        this.initContextMenu();
    }

    createWindow(options) {
        const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = windowId;
        windowEl.style.left = `${options.x || 100}px`;
        windowEl.style.top = `${options.y || 100}px`;
        windowEl.style.width = `${options.width || 600}px`;
        windowEl.style.height = `${options.height || 400}px`;

        windowEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title">
                    <span class="window-icon">${options.icon || '📄'}</span>
                    <span>${options.title}</span>
                </div>
                <div class="window-controls">
                    <div class="window-btn btn-minimize"></div>
                    <div class="window-btn btn-maximize"></div>
                    <div class="window-btn btn-close"></div>
                </div>
            </div>
            <div class="window-content">
                ${options.content || ''}
            </div>
            <div class="window-resizer"></div>
        `;

        this.container.appendChild(windowEl);

        const windowObj = {
            id: windowId,
            element: windowEl,
            title: options.title,
            icon: options.icon,
            minimized: false,
            maximized: false,
            bounds: { x: options.x || 100, y: options.y || 100, width: options.width || 600, height: options.height || 400 }
        };

        this.windows.push(windowObj);
        this.setupWindowEvents(windowObj);
        this.updateTaskbar();

        // Show with animation
        setTimeout(() => {
            windowEl.classList.add('show');
            this.focusWindow(windowObj);
        }, 10);

        return windowObj;
    }

    setupWindowEvents(windowObj) {
        const { element } = windowObj;
        const titlebar = element.querySelector('.window-titlebar');
        const btnMinimize = element.querySelector('.btn-minimize');
        const btnMaximize = element.querySelector('.btn-maximize');
        const btnClose = element.querySelector('.btn-close');
        const resizer = element.querySelector('.window-resizer');

        // Dragging
        let isDragging = false;
        let dragStartX, dragStartY, windowStartX, windowStartY;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-btn')) return;

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            windowStartX = element.offsetLeft;
            windowStartY = element.offsetTop;

            this.focusWindow(windowObj);

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            element.style.left = `${windowStartX + dx}px`;
            element.style.top = `${windowStartY + dy}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // Resizing
        let isResizing = false;
        let resizeStartX, resizeStartY, startWidth, startHeight;

        resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;

            document.addEventListener('mousemove', onResizeMove);
            document.addEventListener('mouseup', onResizeUp);
        });

        const onResizeMove = (e) => {
            if (!isResizing) return;

            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;

            element.style.width = `${Math.max(400, startWidth + dx)}px`;
            element.style.height = `${Math.max(300, startHeight + dy)}px`;
        };

        const onResizeUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeUp);
        };

        // Window controls
        btnMinimize.addEventListener('click', () => this.minimizeWindow(windowObj));
        btnMaximize.addEventListener('click', () => this.toggleMaximize(windowObj));
        btnClose.addEventListener('click', () => this.closeWindow(windowObj));

        // Click to focus
        element.addEventListener('mousedown', () => this.focusWindow(windowObj));
    }

    focusWindow(windowObj) {
        // Remove active class from all windows
        this.windows.forEach(w => w.element.classList.remove('active'));

        // Set new active window
        windowObj.element.classList.add('active');
        windowObj.element.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = windowObj;
        this.updateTaskbar();
    }

    minimizeWindow(windowObj) {
        windowObj.element.classList.add('minimized');
        windowObj.minimized = true;

        // Focus next window
        const visibleWindows = this.windows.filter(w => !w.minimized);
        if (visibleWindows.length > 0) {
            this.focusWindow(visibleWindows[visibleWindows.length - 1]);
        }
        this.updateTaskbar();
    }

    restoreWindow(windowObj) {
        windowObj.element.classList.remove('minimized');
        windowObj.minimized = false;
        this.focusWindow(windowObj);
    }

    toggleMaximize(windowObj) {
        const { element } = windowObj;

        if (windowObj.maximized) {
            element.style.left = `${windowObj.bounds.x}px`;
            element.style.top = `${windowObj.bounds.y}px`;
            element.style.width = `${windowObj.bounds.width}px`;
            element.style.height = `${windowObj.bounds.height}px`;
            windowObj.maximized = false;
        } else {
            windowObj.bounds = {
                x: element.offsetLeft,
                y: element.offsetTop,
                width: element.offsetWidth,
                height: element.offsetHeight
            };
            element.style.left = '0';
            element.style.top = '0';
            element.style.width = '100%';
            element.style.height = '100%';
            windowObj.maximized = true;
        }
    }

    closeWindow(windowObj) {
        windowObj.element.classList.remove('show');

        setTimeout(() => {
            windowObj.element.remove();
            this.windows = this.windows.filter(w => w.id !== windowObj.id);

            // Focus next window
            const visibleWindows = this.windows.filter(w => !w.minimized);
            if (visibleWindows.length > 0) {
                this.focusWindow(visibleWindows[visibleWindows.length - 1]);
            }
            this.updateTaskbar();
        }, 150);
    }

    initKeyboardShortcuts() {
        let altPressed = false;

        document.addEventListener('keydown', (e) => {
            // Alt+Tab
            if (e.key === 'Alt') {
                altPressed = true;
            }

            if (altPressed && e.key === 'Tab') {
                e.preventDefault();
                this.showAltTab();
            }

            // Esc to close active window
            if (e.key === 'Escape') {
                if (this.altTabActive) {
                    this.hideAltTab();
                } else if (this.activeWindow) {
                    this.closeWindow(this.activeWindow);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                altPressed = false;
                if (this.altTabActive) {
                    this.selectAltTabWindow();
                }
            }
        });
    }

    showAltTab() {
        const visibleWindows = this.windows.filter(w => !w.minimized);
        if (visibleWindows.length <= 1) return;

        this.altTabActive = true;
        this.altTabIndex = (this.altTabIndex + 1) % visibleWindows.length;

        this.altTabContainer.innerHTML = '';
        visibleWindows.forEach((windowObj, index) => {
            const item = document.createElement('div');
            item.className = 'alt-tab-item';
            if (index === this.altTabIndex) {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <div class="alt-tab-icon">${windowObj.icon || '📄'}</div>
                <div class="alt-tab-title">${windowObj.title}</div>
            `;
            this.altTabContainer.appendChild(item);
        });

        this.altTabOverlay.style.display = 'flex';
    }

    hideAltTab() {
        this.altTabActive = false;
        this.altTabOverlay.style.display = 'none';
    }

    selectAltTabWindow() {
        const visibleWindows = this.windows.filter(w => !w.minimized);
        if (visibleWindows[this.altTabIndex]) {
            this.focusWindow(visibleWindows[this.altTabIndex]);
        }
        this.hideAltTab();
    }

    updateTaskbar() {
        if (!this.taskbarItems) return;

        this.taskbarItems.innerHTML = '';

        this.windows.forEach(windowObj => {
            const taskbarItem = document.createElement('div');
            taskbarItem.className = 'taskbar-item';
            taskbarItem.dataset.windowId = windowObj.id;

            if (this.activeWindow && this.activeWindow.id === windowObj.id) {
                taskbarItem.classList.add('active');
            }

            if (windowObj.minimized) {
                taskbarItem.classList.add('minimized');
            }

            taskbarItem.textContent = windowObj.icon || '📄';

            // Left click - toggle focus/minimize
            taskbarItem.addEventListener('click', (e) => {
                e.stopPropagation();
                if (windowObj.minimized) {
                    this.restoreWindow(windowObj);
                } else if (this.activeWindow && this.activeWindow.id === windowObj.id) {
                    this.minimizeWindow(windowObj);
                } else {
                    this.focusWindow(windowObj);
                }
            });

            // Right click - show context menu
            taskbarItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, windowObj);
            });

            this.taskbarItems.appendChild(taskbarItem);
        });
    }

    initContextMenu() {
        // Close context menu on click outside
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Context menu item click
        this.contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close' && this.contextMenuTarget) {
                this.closeWindow(this.contextMenuTarget);
                this.hideContextMenu();
            }
        });
    }

    showContextMenu(x, y, windowObj) {
        this.contextMenuTarget = windowObj;
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.contextMenuTarget = null;
    }
}

// Global instance
window.windowManager = new WindowManager();
