/* =========================================================
   VARIABLES GLOBALES Y ESTADO
   ========================================================= */
let todosLosClientes = [];
let clientesFiltrados = [];
let paginaActual = 0;
const registrosPorPagina = 100;

// Instancias de Chart.js para evitar errores de superposición
let chartDonaPro = null;
let chartLinePro = null;

const token = sessionStorage.getItem('token');
if (!token) window.location.href = 'login.html';

/* =========================================================
   1. INICIALIZACIÓN Y USUARIO
   ========================================================= */
async function cargarDatos() {
    cargarNombreUsuario();
    try {
        const response = await fetch('/api/clientes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            todosLosClientes = await response.json();
            clientesFiltrados = [...todosLosClientes];
            console.log("Datos cargados correctamente: ", todosLosClientes.length);

            // Si el usuario recarga la página estando en una sección específica, la inicializamos
            const seccionActiva = document.querySelector('.content-section[style*="display: block"]');
            if (seccionActiva && seccionActiva.id === 'section-predicciones') {
                inicializarDashboardPro();
            }
        } else {
            logout();
        }
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function cargarNombreUsuario() {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const datosToken = JSON.parse(jsonPayload);
        const nombre = datosToken.sub || datosToken.username || "Analista";
        if (document.getElementById('userGreeting')) {
            document.getElementById('userGreeting').innerText = `Analista: ${nombre} | Sesión activa`;
        }
    } catch (e) {
        if (document.getElementById('userGreeting')) {
            document.getElementById('userGreeting').innerText = "Analista de Riesgo | Sesión activa";
        }
    }
}

/* =========================================================
   2. NAVEGACIÓN ENTRE SECCIONES
   ========================================================= */
function mostrarSeccion(seccion) {
    // Ocultar todas las secciones y quitar clases activas
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const sectionMap = {
        'dashboard': 'section-bienvenida',
        'resumen': 'section-resumen',
        'clientes': 'section-clientes',
        'predicciones': 'section-predicciones',
        'configuracion': 'section-configuracion'
    };

    const idSeccion = sectionMap[seccion];
    const targetSection = document.getElementById(idSeccion);

    if(targetSection) {
        targetSection.style.display = 'block';
    }

    // Activar botón del menú lateral
    const btnMenu = document.getElementById(`nav-${seccion === 'configuracion' ? 'config' : seccion}`);
    if(btnMenu) btnMenu.classList.add('active');

    // Ejecutar lógica específica de cada sección al entrar
    if (seccion === 'resumen') calcularEstadisticas();
    if (seccion === 'clientes') actualizarInterfaz();
    if (seccion === 'predicciones') inicializarDashboardPro();
}

/* =========================================================
   3. GESTIÓN DE CLIENTES (TABLA Y FILTROS)
   ========================================================= */
function filtrarGeneral() {
    const busqueda = document.getElementById('inputBusqueda').value.toLowerCase();
    const genero = document.getElementById('filterGender').value;
    const riesgo = document.getElementById('filterRisk').value;
    const inactividadMin = document.getElementById('filterInactive').value;

    clientesFiltrados = todosLosClientes.filter(c => {
        const cumpleBusqueda = c.id.toString().includes(busqueda) || c.customerAge.toString().includes(busqueda);
        const cumpleGenero = genero === 'todos' || c.genderM.toString() === genero;
        const cumpleRiesgo = riesgo === 'todos' || c.attritionFlag.toString() === riesgo;
        const cumpleInactividad = !inactividadMin || c.monthsInactive12Mon >= parseInt(inactividadMin);

        return cumpleBusqueda && cumpleGenero && cumpleRiesgo && cumpleInactividad;
    });

    paginaActual = 0;
    actualizarInterfaz();
}

function limpiarFiltros() {
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('filterGender').value = 'todos';
    document.getElementById('filterRisk').value = 'todos';
    document.getElementById('filterInactive').value = '';
    clientesFiltrados = [...todosLosClientes];
    actualizarInterfaz();
}

function actualizarInterfaz() {
    const contenedor = document.getElementById('listaClientes');
    if (!contenedor) return;

    const inicio = paginaActual * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const segmento = clientesFiltrados.slice(inicio, fin);
    renderizarTabla(segmento);
}

function renderizarTabla(clientes) {
    const contenedor = document.getElementById('listaClientes');
    if (!contenedor) return;

    let html = `
        <table class="data-table">
            <thead>
                <tr><th>ID</th><th>Edad</th><th>Género</th><th>Meses Inactivo</th><th>Acción</th></tr>
            </thead>
            <tbody>`;

    clientes.forEach(c => {
        html += `
            <tr class="${c.attritionFlag === 1 ? 'riesgo-alto' : ''}">
                <td>${c.id}</td>
                <td>${c.customerAge}</td>
                <td>${c.genderM === 1 ? 'Hombre' : 'Mujer'}</td>
                <td>${c.monthsInactive12Mon}</td>
                <td>
                    <button class="btn-analizar-mini" onclick="irAPrediccionDirecta(${c.id})">📊 IA</button>
                </td>
            </tr>`;
    });
    html += '</tbody></table>';
    contenedor.innerHTML = html;
}

/* =========================================================
   4. ESTADÍSTICAS (RESUMEN GENERAL)
   ========================================================= */
function calcularEstadisticas() {
    if (todosLosClientes.length === 0) return;

    const total = todosLosClientes.length;
    const riesgo = todosLosClientes.filter(c => c.attritionFlag === 1).length;
    const sumaInactividad = todosLosClientes.reduce((acc, c) => acc + c.monthsInactive12Mon, 0);
    const promedioInactividad = (sumaInactividad / total).toFixed(1);
    const perc = ((riesgo / total) * 100).toFixed(1);

    if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = total;
    if(document.getElementById('stat-riesgo')) document.getElementById('stat-riesgo').innerText = riesgo;
    if(document.getElementById('stat-inactivo')) document.getElementById('stat-inactivo').innerText = `${promedioInactividad} meses`;
    if(document.getElementById('label-porcentaje')) document.getElementById('label-porcentaje').innerText = perc + "%";
    if(document.getElementById('bar-riesgo')) document.getElementById('bar-riesgo').style.width = perc + "%";
}

/* =========================================================
   5. DASHBOARD PRO (PREDICCIONES Y GRÁFICAS)
   ========================================================= */
function inicializarDashboardPro() {
    if (todosLosClientes.length === 0) return;

    setTimeout(() => {
        try {
            // --- 1. CÁLCULOS ---
            const total = todosLosClientes.length;
            const fugados = todosLosClientes.filter(c => c.attritionFlag === 1).length;
            const activos = total - fugados;
            const churnRate = ((fugados / total) * 100).toFixed(1);
            const retentionRate = (100 - churnRate).toFixed(1);
            const impacto = (fugados * 500).toLocaleString('en-US');

            // --- 2. ACTUALIZAR KPIs ---
            if(document.getElementById('kpi-churn-rate')) document.getElementById('kpi-churn-rate').innerText = `${churnRate}%`;
            if(document.getElementById('kpi-risk-count')) document.getElementById('kpi-risk-count').innerText = fugados;
            if(document.getElementById('kpi-retention')) document.getElementById('kpi-retention').innerText = `${retentionRate}%`;
            if(document.getElementById('kpi-impact')) document.getElementById('kpi-impact').innerText = `$${impacto}`;

            // --- 3. GRÁFICOS (Chart.js) ---
            if (typeof Chart === 'undefined') return console.error("Chart.js no cargado");

            // A) Dona de Distribución
            const ctxDona = document.getElementById('chartDistribucion');
            if (ctxDona) {
                if (chartDonaPro) chartDonaPro.destroy();
                chartDonaPro = new Chart(ctxDona.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Activos', 'Fugados'],
                        datasets: [{
                            data: [activos, fugados],
                            backgroundColor: ['#10b981', '#ef4444'],
                            borderColor: '#111827',
                            borderWidth: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // B) Línea de Tendencia
            const ctxLine = document.getElementById('chartTendencia');
            if (ctxLine) {
                if (chartLinePro) chartLinePro.destroy();
                const tr = parseFloat(churnRate);
                chartLinePro = new Chart(ctxLine.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
                        datasets: [{
                            label: 'Tasa %',
                            data: [tr - 2, tr - 1.2, tr + 0.5, tr - 0.8, tr - 0.2, tr],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error en Dashboard Pro:", error);
        }
    }, 50);
}

/* =========================================================
   6. IA INDIVIDUAL Y MODAL
   ========================================================= */
function determinarNivelRiesgo(probabilidad) {
    if (probabilidad < 50) {
        return {
            nivel: 'Bajo', color: '#10b981', claseCss: 'risk-low',
            plan: '✅ <strong>Mantener Fidelización:</strong> Enviar correo de agradecimiento y oferta exclusiva.'
        };
    } else if (probabilidad >= 50 && probabilidad < 75) {
        return {
            nivel: 'Medio', color: '#f59e0b', claseCss: 'risk-medium',
            plan: '⚠️ <strong>Acción Preventiva:</strong> Ofrecer descuento proactivo o upgrade de servicios.'
        };
    } else {
        return {
            nivel: 'Crítico', color: '#ef4444', claseCss: 'risk-high',
            plan: '🚨 <strong>Retención Urgente:</strong> Ejecutar llamada prioritaria del equipo de éxito.'
        };
    }
}

async function ejecutarPrediccionIndividual() {
    const id = document.getElementById('inputPredictId').value;
    const resultadoDiv = document.getElementById('resultadoIA');
    if (!id) return;

    resultadoDiv.innerHTML = `<p class="loading-text">Consultando IA LightGBM...</p>`;

    try {
        const response = await fetch(`/api/clientes/${id}/predecir`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (response.ok) {
            const infoRiesgo = determinarNivelRiesgo(data.probabilidad);
            resultadoDiv.innerHTML = `
                <div class="ia-result-card-advanced ${infoRiesgo.claseCss}">
                    <div class="risk-header">
                        <span class="risk-badge" style="background:${infoRiesgo.color}; color:#000">Riesgo ${infoRiesgo.nivel}</span>
                        <h4>Probabilidad de Fuga Estimada</h4>
                    </div>
                    <div class="ia-score-large" style="color:${infoRiesgo.color}">${data.probabilidad}%</div>
                    <div class="action-plan-box">
                        <h5>📋 Plan de Acción Recomendado</h5>
                        <p>${infoRiesgo.plan}</p>
                    </div>
                    <button class="btn-details-outline" onclick="verDetallesClienteCompleto(${id})">
                        <span>👁️ Ver Expediente Completo</span>
                    </button>
                </div>`;
        } else {
            resultadoDiv.innerHTML = `<p style="color: var(--danger);">Error: Cliente no encontrado.</p>`;
        }
    } catch (e) {
        resultadoDiv.innerHTML = `<p>Error de conexión con el servicio IA.</p>`;
    }
}

function verDetallesClienteCompleto(id) {
    const cliente = todosLosClientes.find(c => c.id == id);
    if (!cliente) return alert("Datos no disponibles.");

    const modalBody = document.getElementById('modalBody');
    if(modalBody) {
        modalBody.innerHTML = `
            <div class="detail-item"><label>ID Cliente</label><p>${cliente.id}</p></div>
            <div class="detail-item"><label>Edad</label><p>${cliente.customerAge} años</p></div>
            <div class="detail-item"><label>Género</label><p>${cliente.genderM === 1 ? 'Masculino' : 'Femenino'}</p></div>
            <div class="detail-item"><label>Meses Inactivo</label><p>${cliente.monthsInactive12Mon}</p></div>
            <div class="detail-item"><label>Total Contactos</label><p>${cliente.contactsCount12Mon}</p></div>
            <div class="detail-item"><label>Estado Actual</label>
                <p style="color: ${cliente.attritionFlag === 1 ? 'var(--danger)' : 'var(--success)'}">
                    ${cliente.attritionFlag === 1 ? 'Churn / Fugado' : 'Activo'}
                </p>
            </div>
        `;
        document.getElementById('modalDetalles').classList.add('active');
    }
}

function cerrarModalDetalles() {
    document.getElementById('modalDetalles').classList.remove('active');
}

function irAPrediccionDirecta(id) {
    mostrarSeccion('predicciones');
    setTimeout(() => {
        document.getElementById('inputPredictId').value = id;
        ejecutarPrediccionIndividual();
    }, 150);
}

/* =========================================================
   7. CONFIGURACIÓN Y LOGOUT
   ========================================================= */
async function guardarConfiguracion() {
    const nuevoNombre = document.getElementById('configUser').value;
    const nuevaPassword = document.getElementById('configPass').value;
    try {
        const response = await fetch('/api/auth/actualizar', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoNombre, nuevaPassword })
        });
        if (response.ok) {
            alert("Configuración actualizada con éxito. Por seguridad, inicia sesión nuevamente.");
            logout();
        }
    } catch (e) { alert("Error al conectar con el servidor."); }
}

function logout() {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// INICIO DE LA APP
cargarDatos();