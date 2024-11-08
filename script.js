
function saveEdit() {
    const id = document.getElementById('editId').value;
    const entry = devDiary.entries.find(e => e.id == id);
    entry.title = document.getElementById('editTitleInput').value;
    entry.content = document.getElementById('editContentInput').value;
    const now = new Date().toISOString();
    entry.modifiedAt = now;
    entry.modifications.push({
        date: now,
        title: entry.title,
        content: entry.content
    });
    devDiary.saveEntries();
    devDiary.renderEntries();
    closeModal();
}



// Esperamos a que el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
// Obtenemos referencias a los elementos del DOM
const modal = document.getElementById('infoModal');
const closeBtn = document.getElementById('closeModalBtn');
const readMoreBtn = document.getElementById('readMoreBtn');

// Función para mostrar el modal
function showModal() {
modal.style.display = 'flex';
document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal
function hideModal() {
modal.style.display = 'none';
document.body.style.overflow = 'auto';
}

// Mostrar el modal al cargar la página
showModal();

// Event listener para el botón de cerrar
closeBtn.addEventListener('click', function() {
hideModal();
});

// Event listener para el botón de leer más
readMoreBtn.addEventListener('click', function() {
hideModal();
});

// Event listener para cerrar al hacer clic fuera del modal
window.addEventListener('click', function(event) {
if (event.target === modal) {
    hideModal();
}
});

// Event listener para la tecla Escape
document.addEventListener('keydown', function(event) {
if (event.key === 'Escape') {
    hideModal();
}
});
});



class DevDiary {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('devDiaryEntries')) || [];
        this.currentMood = null;
        this.currentType = 'daily';
        this.setupEventListeners();
        this.renderEntries();
    }

    setupEventListeners() {
        document.getElementById('entryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEntry();
        });

        document.querySelectorAll('.type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleTypeSelection(e.target);
            });
        });

        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleMoodSelection(e.target);
            });
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterEntries(e.target.value);
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterSelection(e.target);
            });
        });
    }

    handleTypeSelection(element) {
        document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        this.currentType = element.dataset.type;

        const codeContainer = document.getElementById('codeContainer');
        codeContainer.style.display = this.currentType === 'code' ? 'block' : 'none';
    }

    handleMoodSelection(element) {
        document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        this.currentMood = element.dataset.mood;
    }

    handleFilterSelection(element) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
        this.filterEntriesByType(element.dataset.filter);
    }

    addEntry() {
        const title = document.getElementById('titleInput').value;
        const content = document.getElementById('contentInput').value;
        const code = document.getElementById('codeInput').value;
        const tags = document.getElementById('tagsInput').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const now = new Date().toISOString();

        const entry = {
            id: Date.now(),
            title,
            content,
            code: this.currentType === 'code' ? code : '',
            tags,
            type: this.currentType,
            mood: this.currentMood || '📝',
            createdAt: now,
            modifiedAt: now,
            modifications: [],
            progress: []
        };

        this.entries.unshift(entry);
        this.saveEntries();
        this.renderEntries();
        this.resetForm();
        this.showNotification('¡Entrada guardada con éxito! 🎉');
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        document.getElementById('editId').value = id;
        document.getElementById('editTitleInput').value = entry.title;
        document.getElementById('editContentInput').value = entry.content;
        document.getElementById('editModal').style.display = 'flex';
    }

   

    deleteEntry(id) {
        if (confirm('¿Estás seguro de querer eliminar esta entrada?')) {
            this.entries = this.entries.filter(entry => entry.id !== id);
            this.saveEntries();
            this.renderEntries();
        }
    }

    saveEntries() {
        localStorage.setItem('devDiaryEntries', JSON.stringify(this.entries));
    }

    renderEntries(entriesToRender = this.entries) {
        const container = document.getElementById('entriesContainer');
        container.innerHTML = entriesToRender.map((entry, index) => `
            <article class="entry-card animate-entry" style="animation-delay: ${index * 0.1}s">
                <div class="entry-header">
                    <h3 class="entry-title">${this.escapeHtml(entry.title)}</h3>
                    <span class="mood-tag">${entry.mood}</span>
                </div>
                
                <div class="entry-date">
                    Creado: ${new Date(entry.createdAt).toLocaleString()}<br>
                    Modificado: ${new Date(entry.modifiedAt).toLocaleString()}
                </div>

                <div class="entry-content">
                    ${this.formatContent(entry.content)}
                </div>

                ${entry.code ? `
                    <div class="entry-code">
                        ${this.escapeHtml(entry.code)}
                    </div>
                ` : ''}

                <div class="tags">
                    ${entry.tags.map(tag => `
                        <span class="tag">#${this.escapeHtml(tag)}</span>
                    `).join('')}
                </div>

                <div class="actions">
                    <button class="delete-btn" onclick="devDiary.deleteEntry(${entry.id})">
                        Eliminar
                    </button>
                    <button onclick="devDiary.editEntry(${entry.id})">
                        Editar
                    </button>
                </div>

                <div>
                    <h4>Historial de Modificaciones</h4>
                    <ul class="modifications-list">
                        ${entry.modifications.map(mod => `
                            <li class="modification-item">
                                ${new Date(mod.date).toLocaleString()}: ${this.escapeHtml(mod.title)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </article>
        `).join('');
    }

    formatContent(content) {
        content = this.escapeHtml(content).replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" class="text-accent">$1</a>'
        );

        content = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        return content;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification animate__animated animate__fadeIn';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--accent);
            color: var(--primary);
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.replace('animate__fadeIn', 'animate__fadeOut');
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
    }

    resetForm() {
        document.getElementById('entryForm').reset();
        document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('active'));
        this.currentMood = null;
    }
}

const devDiary = new DevDiary();

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}
