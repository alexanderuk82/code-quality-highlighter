// TEST FILE: Code Quality Highlighter Test Cases
// Este archivo contiene código con problemas que la extensión debería detectar

// 1. NESTED LOOPS - Debería detectar complejidad O(n²)
function findMatchingUsers() {
    const users = [1, 2, 3, 4, 5];
    const posts = [1, 2, 3, 4, 5];
    const results = [];
    
    // PROBLEMA: Loop anidado O(n²)
    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < posts.length; j++) {
            if (users[i].id === posts[j].userId) {
                results.push({user: users[i], post: posts[j]});
            }
        }
    }
    return results;
}

// 2. BLOCKING SYNC OPERATIONS - Debería detectar operaciones síncronas bloqueantes
const fs = require('fs');
function readConfig() {
    // PROBLEMA: Operación síncrona bloqueante
    const data = fs.readFileSync('config.json', 'utf8');
    return JSON.parse(data);
}

// 3. EXPENSIVE OPERATIONS IN LOOPS - Operaciones costosas en loops
function processItems(items) {
    const results = [];
    for (let item of items) {
        // PROBLEMA: Array.find() dentro de un loop
        const match = items.find(i => i.id === item.parentId);
        if (match) {
            results.push({item, parent: match});
        }
    }
    return results;
}

// 4. STRING CONCATENATION IN LOOPS - Concatenación de strings en loops
function buildHTML(items) {
    let html = '';
    // PROBLEMA: Concatenación con += en loop
    for (let item of items) {
        html += '<div>' + item.name + '</div>';
        html += '<p>' + item.description + '</p>';
    }
    return html;
}

// 5. DOM QUERIES IN LOOPS - Queries al DOM en loops
function updateElements(ids) {
    for (let id of ids) {
        // PROBLEMA: querySelector dentro de loop
        const element = document.querySelector('#' + id);
        if (element) {
            element.style.display = 'none';
        }
    }
}

// 6. MEMORY LEAKS - Detectar memory leaks
class EventManager {
    constructor() {
        this.data = [];
        // PROBLEMA: Event listener sin cleanup
        document.addEventListener('click', this.handleClick.bind(this));
        
        // PROBLEMA: setTimeout sin cleanup
        this.timer = setTimeout(() => {
            console.log('Timer executed');
        }, 1000);
    }
    
    handleClick() {
        this.data.push(new Date());
    }
    
    // Falta método destroy() para limpiar listeners y timers
}

// 7. MULTIPLE FOR LOOPS (No implementado aún, pero sería detectado en el futuro)
function processData(data) {
    // Múltiples iteraciones sobre el mismo array
    const filtered = data.filter(x => x > 0);
    const mapped = filtered.map(x => x * 2);
    const reduced = mapped.reduce((acc, x) => acc + x, 0);
    return reduced;
}

console.log('Test file loaded - Check for highlighting!');
