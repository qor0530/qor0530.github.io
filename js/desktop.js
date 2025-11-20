// Desktop Manager - Handles desktop icons and file system
class DesktopManager {
    constructor() {
        this.iconsContainer = document.getElementById('desktop-icons');
        this.desktopItems = [];
    }

    async init() {
        // Load desktop configuration
        await this.loadData();
        this.renderIcons();
    }

    async loadData() {
        try {
            const response = await fetch('data/content.json');
            const data = await response.json();
            this.desktopItems = data.desktop || this.getDefaultDesktop();
        } catch (error) {
            console.log('Using default desktop layout');
            this.desktopItems = this.getDefaultDesktop();
        }
    }

    getDefaultDesktop() {
        return [
            {
                type: 'folder',
                icon: '📁',
                label: 'Projects',
                id: 'projects'
            },
            {
                type: 'folder',
                icon: '📁',
                label: 'Blog',
                id: 'blog'
            },
            {
                type: 'folder',
                icon: '📁',
                label: 'About Me',
                id: 'about'
            },
            {
                type: 'file',
                icon: '📄',
                label: 'Resume',
                id: 'resume'
            },
            {
                type: 'folder',
                icon: '📁',
                label: 'Contact',
                id: 'contact'
            }
        ];
    }

    renderIcons() {
        this.iconsContainer.innerHTML = '';

        this.desktopItems.forEach((item, index) => {
            const iconEl = document.createElement('div');
            iconEl.className = 'desktop-icon';
            iconEl.innerHTML = `
                <div class="icon-image">${item.icon}</div>
                <div class="icon-label">${item.label}</div>
            `;

            iconEl.addEventListener('dblclick', () => this.openItem(item));

            this.iconsContainer.appendChild(iconEl);
        });
    }

    async openItem(item) {
        let content = '';
        let windowOptions = {
            title: item.label,
            icon: item.icon,
            x: 50 + this.desktopItems.indexOf(item) * 30,
            y: 50 + this.desktopItems.indexOf(item) * 30,
            width: 700,
            height: 500
        };

        switch (item.id) {
            case 'projects':
                content = await this.loadProjects();
                break;
            case 'blog':
                content = await this.loadBlog();
                break;
            case 'about':
                content = this.loadAbout();
                break;
            case 'resume':
                content = this.loadResume();
                windowOptions.width = 800;
                windowOptions.height = 600;
                break;
            case 'contact':
                content = this.loadContact();
                windowOptions.width = 500;
                windowOptions.height = 400;
                break;
            default:
                content = '<p>Content not found.</p>';
        }

        windowOptions.content = content;
        window.windowManager.createWindow(windowOptions);
    }

    async loadProjects() {
        try {
            const response = await fetch('data/projects.json');
            const data = await response.json();

            let html = '<div class="project-list">';

            data.projects.forEach(project => {
                html += `
                    <div class="project-item" data-type="${project.type}" data-link="${project.link}">
                        <div class="project-title">${project.title}</div>
                        <div class="project-description">${project.description}</div>
                        <span class="project-type">${project.type === 'github' ? '🔗 GitHub' : '🌐 Web'}</span>
                    </div>
                `;
            });

            html += '</div>';

            // Add click handlers after window is created
            setTimeout(() => {
                document.querySelectorAll('.project-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const type = item.dataset.type;
                        const link = item.dataset.link;

                        if (type === 'github') {
                            window.open(link, '_blank');
                        } else if (type === 'html') {
                            // Open internal HTML page in new window
                            window.windowManager.createWindow({
                                title: item.querySelector('.project-title').textContent,
                                icon: '🌐',
                                content: `<iframe src="${link}" style="width: 100%; height: 100%; border: none;"></iframe>`,
                                width: 900,
                                height: 700,
                                x: 100,
                                y: 100
                            });
                        }
                    });
                });
            }, 100);

            return html;
        } catch (error) {
            return '<p>No projects found. Add projects in data/projects.json</p>';
        }
    }

    async loadBlog() {
        try {
            const response = await fetch('data/blog.json');
            const data = await response.json();

            let html = '<div class="project-list">';

            data.posts.forEach(post => {
                html += `
                    <div class="project-item" data-post-id="${post.id}">
                        <div class="project-title">${post.title}</div>
                        <div class="project-description">${post.excerpt}</div>
                        <span class="project-type">📅 ${post.date}</span>
                    </div>
                `;
            });

            html += '</div>';

            // Add click handlers for blog posts
            setTimeout(() => {
                document.querySelectorAll('.project-item[data-post-id]').forEach(item => {
                    item.addEventListener('click', async () => {
                        const postId = item.dataset.postId;
                        const response = await fetch('data/blog.json');
                        const data = await response.json();
                        const post = data.posts.find(p => p.id === postId);

                        if (post) {
                            window.windowManager.createWindow({
                                title: post.title,
                                icon: '📝',
                                content: `
                                    <h2 style="color: var(--accent-blue); margin-bottom: 0.5rem;">${post.title}</h2>
                                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.875rem;">${post.date}</p>
                                    <div style="line-height: 1.8;">${post.content}</div>
                                `,
                                width: 800,
                                height: 600,
                                x: 150,
                                y: 100
                            });
                        }
                    });
                });
            }, 100);

            return html;
        } catch (error) {
            return '<p>No blog posts found. Add posts in data/blog.json</p>';
        }
    }

    loadAbout() {
        return `
            <h2 style="color: var(--accent-blue); margin-bottom: 1rem;">About Me</h2>
            <div style="line-height: 1.8;">
                <p style="margin-bottom: 1rem;">
                    Welcome to my personal portfolio and blog!
                </p>
                <p style="margin-bottom: 1rem;">
                    This is a custom OS-style interface built with vanilla JavaScript.
                    Feel free to explore the different sections using the desktop icons.
                </p>
                <p style="margin-bottom: 1rem;">
                    <strong style="color: var(--accent-blue);">Skills:</strong><br>
                    Add your skills here...
                </p>
                <p>
                    <strong style="color: var(--accent-blue);">Interests:</strong><br>
                    Add your interests here...
                </p>
            </div>
        `;
    }

    loadResume() {
        return `
            <h2 style="color: var(--accent-blue); margin-bottom: 1rem;">Resume</h2>
            <div style="line-height: 1.8;">
                <section style="margin-bottom: 2rem;">
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Experience</h3>
                    <div style="margin-bottom: 1rem;">
                        <div style="color: var(--accent-blue); font-weight: 600;">Job Title</div>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">Company • 2020 - Present</div>
                        <p style="margin-top: 0.5rem;">Description of your role and achievements...</p>
                    </div>
                </section>

                <section style="margin-bottom: 2rem;">
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Education</h3>
                    <div style="margin-bottom: 1rem;">
                        <div style="color: var(--accent-blue); font-weight: 600;">Degree</div>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">University • Year</div>
                    </div>
                </section>

                <section>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Skills</h3>
                    <p>List your technical skills here...</p>
                </section>
            </div>
        `;
    }

    loadContact() {
        return `
            <h2 style="color: var(--accent-blue); margin-bottom: 1rem;">Contact</h2>
            <div style="line-height: 2;">
                <p><strong>Email:</strong> your.email@example.com</p>
                <p><strong>GitHub:</strong> <a href="https://github.com/qor0530" target="_blank" style="color: var(--accent-blue);">github.com/qor0530</a></p>
                <p><strong>LinkedIn:</strong> Add your LinkedIn here</p>
                <p><strong>Twitter:</strong> Add your Twitter here</p>
            </div>
        `;
    }
}

// Global instance
window.desktopManager = new DesktopManager();
