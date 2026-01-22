// Inicialización del Tema
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(savedTheme);
    actualizarIconoTema(savedTheme);
});

function toggleTheme() {
    const body = document.body;
    const nuevoTema = body.classList.contains('dark') ? 'light' : 'dark';

    body.classList.remove('dark', 'light');
    body.classList.add(nuevoTema);

    localStorage.setItem('theme', nuevoTema);
    actualizarIconoTema(nuevoTema);
}

function actualizarIconoTema(tema) {
    const btn = document.getElementById('btn-theme-toggle'); // id del botón de tema
    if (btn) {
        btn.innerHTML = tema === 'light' ? '🌙' : '☀️';
    }
}

/* =========================================================
   VARIABLES GLOBALES Y ESTADO
   ========================================================= */
let todosLosClientes = [];
let clientesFiltrados = [];
let paginaActual = 0;
let resumenChartEdad = null;
let resumenChartBarras = null;
let resumenChartLinea = null;
const registrosPorPagina = 100;

// Instancias de Chart.js
let chartDonaPro = null;
let chartLinePro = null;

const token = localStorage.getItem('token');
if (!token || token === 'undefined') {
    window.location.href = 'login.html';
}

/* =========================================================
   1. INICIALIZACIÓN Y USUARIO
   ========================================================= */
async function cargarDatos() {
    cargarNombreUsuario();
    try {
        // PUNTO CLAVE 3: Asegurar que el Header Bearer esté bien formado
        const response = await fetch('http://localhost:8080/api/clientes', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            todosLosClientes = await response.json();
            clientesFiltrados = [...todosLosClientes];

            procesarIAEnSegundoPlano();

            const seccionActiva = document.querySelector('.content-section[style*="display: block"]');
            if (seccionActiva && seccionActiva.id === 'section-predicciones') {
                inicializarDashboardPro();
            }

            actualizarInterfaz();
        } else if (response.status === 401 || response.status === 403) {
            // Si el token no es válido para el backend, fuera
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
        // Fallback silencioso
    }
}

/* =========================================================
   2. NAVEGACIÓN
   ========================================================= */
function mostrarSeccion(seccion) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const sectionMap = {
        'dashboard': 'section-bienvenida',
        'resumen': 'section-resumen',
        'clientes': 'section-clientes',
        'predicciones': 'section-predicciones',
        'configuracion': 'section-configuracion',
        'registro': 'section-registro',
        'plan-accion': 'section-plan-accion'

    };

    const target = document.getElementById(sectionMap[seccion]);
    if(target) target.style.display = 'block';

    const btnMenu = document.getElementById(`nav-${seccion === 'configuracion' ? 'config' : seccion}`);
    if(btnMenu) btnMenu.classList.add('active');

    if (seccion === 'resumen') calcularEstadisticas();
    if (seccion === 'clientes') actualizarInterfaz();
    if (seccion === 'predicciones') inicializarDashboardPro();
}
/* =========================================================
   2.1 PROCESAR REGISTRO DE NUEVO CLIENTE (CORREGIDA)
   ========================================================= */
async function procesarAltaCliente() {
    const tipoTarjeta = document.getElementById('regTarjeta').value;

    const nuevoCliente = {
        customerAge: parseInt(document.getElementById('regEdad').value) || 0,
        genderM: parseInt(document.getElementById('regGenero').value),
        monthsInactive12Mon: parseInt(document.getElementById('regInactivo').value) || 0,
        contactsCount12Mon: parseInt(document.getElementById('regContactos').value) || 0,
        avgUtilizationRatio: parseFloat(document.getElementById('regUso').value) || 0,
        totalCtChngQ4Q1: parseFloat(document.getElementById('regCambio').value) || 0,
        lowRelationshipCount: parseInt(document.getElementById('regLowRel').value) || 0,
        cardCategoryGold: tipoTarjeta === 'gold' ? 1 : 0,
        cardCategorySilver: tipoTarjeta === 'silver' ? 1 : 0,
        cardCategoryPlatinum: tipoTarjeta === 'platinum' ? 1 : 0,
        attritionFlag: 0
    };

    try {
        console.log("Intentando conectar con el servidor...");
        // IMPORTANTE: Quitamos el token momentáneamente para probar que el permitAll funciona
        const response = await fetch('http://localhost:8080/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Quitamos Authorization para descartar que el filtro JWT sea el que bloquea
            },
            body: JSON.stringify(nuevoCliente)
        });

        if (response.ok) {
            const clienteGuardado = await response.json();
            alert(`✅ ¡ÉXITO! Cliente ID: ${clienteGuardado.id}`);
            location.reload(); // Recarga para ver los cambios
        } else {
            console.error("Respuesta del servidor no OK:", response.status);
            alert("Error del servidor: " + response.status);
        }
    } catch (error) {
        console.error("ERROR DE RED (No llega al Java):", error);
        alert("El navegador no pudo contactar al servidor Java. Revisa la consola (F12).");
    }
}
/* =========================================================
   3. GESTIÓN DE CLIENTES (LÓGICA CHAMPION 3)
   ========================================================= */
   function filtrarGeneral() {
       if (procesandoIA) {
           console.warn("Espera a que termine el análisis para filtrar.");
           return;
       }

       const busqueda = document.getElementById('inputBusqueda').value.toLowerCase();
       const genero = document.getElementById('filterGender').value;
       const riesgoFiltro = document.getElementById('filterRisk').value;
       const inactividadExacta = document.getElementById('filterInactive').value;

       clientesFiltrados = todosLosClientes.filter(c => {
           // 1. Filtro por Búsqueda
           const cumpleBusqueda = !busqueda ||
                                  c.id.toString().includes(busqueda) ||
                                  c.customerAge.toString().includes(busqueda);

           // 2. Filtro por Género
           const cumpleGenero = genero === 'todos' || c.genderM.toString() === genero;

           // 3. Filtro por Inactividad
           const cumpleInactividad = !inactividadExacta ||
                                     c.monthsInactive12Mon === parseInt(inactividadExacta);

           // 4. Lógica de Riesgo 100% IA (SIN FALLBACK MANUAL)
           let cumpleRiesgo = true;
           if (riesgoFiltro !== 'todos') {
               const prob = c.probabilidadIA;

               // Si el cliente NO tiene dato de IA todavía, no puede cumplir el filtro
               if (prob == null) return false;

               if (riesgoFiltro === 'alto') cumpleRiesgo = prob >= 70;
               else if (riesgoFiltro === 'medio') cumpleRiesgo = prob >= 40 && prob < 70;
               else if (riesgoFiltro === 'bajo') cumpleRiesgo = prob < 40;
           }

           return cumpleBusqueda && cumpleGenero && cumpleInactividad && cumpleRiesgo;
       });

       paginaActual = 0;
       actualizarInterfaz();
   }
// Variable para bloquear filtros mientras se calcula
let procesandoIA = false;

function mostrarCargandoIA(estado) {
    const btnFiltro = document.querySelector('.btn-clear-pro');
    procesandoIA = estado;
    if (estado) {
        btnFiltro.innerHTML = `<span><i class="fas fa-spinner fa-spin"></i> Analizando con Modelo 1.1...</span>`;
        btnFiltro.style.opacity = "0.6";
        btnFiltro.disabled = true;
    } else {
        btnFiltro.innerHTML = `<span>Point 🧹 Limpiar Filtros</span>`;
        btnFiltro.style.opacity = "1";
        btnFiltro.disabled = false;
    }
}
function limpiarFiltros() {
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('filterGender').value = 'todos';
    document.getElementById('filterRisk').value = 'todos';
    document.getElementById('filterInactive').value = '';
    clientesFiltrados = [...todosLosClientes];
    actualizarInterfaz();
}

/* =========================================================
   ACTUALIZACIÓN DE INTERFAZ CON PAGINACIÓN
   ========================================================= */
function actualizarInterfaz() {
    const contenedor = document.getElementById('listaClientes');
    if (!contenedor) return;

    const inicio = paginaActual * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const totalPaginas = Math.ceil(clientesFiltrados.length / registrosPorPagina);

    // Renderizamos la tabla con el trozo de datos correspondiente
    renderizarTabla(clientesFiltrados.slice(inicio, fin));

    // Renderizamos los botones de paginación
    renderizarControlesPaginacion(totalPaginas);
}

function renderizarControlesPaginacion(totalPaginas) {
    const contenedorPag = document.getElementById('paginacionControles');
    if (!contenedorPag) return;

    if (totalPaginas <= 1) {
        contenedorPag.innerHTML = '';
        return;
    }

    contenedorPag.innerHTML = `
        <div class="pagination-wrapper" style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; padding-bottom: 20px;">
            <button class="btn-pagination" ${paginaActual === 0 ? 'disabled' : ''}
                    onclick="cambiarPagina(-1)"
                    style="padding: 10px 20px; cursor: pointer; border-radius: 8px; border: none; background: #3b82f6; color: white; opacity: ${paginaActual === 0 ? '0.5' : '1'}">
                ⬅️ Anterior
            </button>

            <span style="color: white; font-weight: bold;">
                Página ${paginaActual + 1} de ${totalPaginas}
                <small style="display: block; font-weight: normal; opacity: 0.7; text-align: center;">
                    (${clientesFiltrados.length} clientes)
                </small>
            </span>

            <button class="btn-pagination" ${paginaActual >= totalPaginas - 1 ? 'disabled' : ''}
                    onclick="cambiarPagina(1)"
                    style="padding: 10px 20px; cursor: pointer; border-radius: 8px; border: none; background: #3b82f6; color: white; opacity: ${paginaActual >= totalPaginas - 1 ? '0.5' : '1'}">
                Siguiente ➡️
            </button>
        </div>
    `;
}

// Función para mover las páginas
function cambiarPagina(direccion) {
    paginaActual += direccion;
    actualizarInterfaz();
    // Scroll hacia arriba de la tabla para comodidad del usuario
    document.getElementById('section-clientes').scrollTop = 0;
}
/* =========================================================
   NUEVO: PROCESADOR DE IA EN SEGUNDO PLANO (SCANNER)
   ========================================================= */
let cancelTokenIA = false; // Por si queremos detenerlo

async function procesarIAEnSegundoPlano() {
    const btnFiltro = document.querySelector('.btn-clear-pro');
    if(btnFiltro) btnFiltro.innerHTML = `<span>⏳ Iniciando escaneo IA...</span>`;

    procesandoIA = true;
    let procesados = 0;
    const total = todosLosClientes.length;

    // Recorremos TODOS los clientes, no solo la página actual
    for (let c of todosLosClientes) {
        if (cancelTokenIA) break;

        // Solo consultamos si no tiene el dato
        if (c.probabilidadIA == null) {
            try {
                // Llamada a tu API de Python
                const response = await fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_age: c.customerAge,
                        months_inactive12mon: c.monthsInactive12Mon,
                        contacts_count12mon: c.contactsCount12Mon,
                        total_ct_chngq4q1: c.totalCtChngQ4Q1,
                        avg_utilization_ratio: c.avgUtilizationRatio,
                        low_relationship_count: c.lowRelationshipCount,
                        genderm: c.genderM,
                        card_category_gold: c.cardCategoryGold || 0,
                        card_category_platinum: c.cardCategoryPlatinum || 0,
                        card_category_silver: c.cardCategorySilver || 0
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    c.probabilidadIA = data.probabilidad; // ¡Guardamos el dato en memoria!

                    // Si este cliente está visible ahora mismo en la tabla, actualizamos su color en vivo
                    actualizarFilaConIA(c.id, c.probabilidadIA);
                }
            } catch (e) {
                console.error("Error IA fondo", e);
                c.probabilidadIA = 0; // Fallback para no trabar el loop
            }
        }

        procesados++;

        // Actualizamos el contador visual cada 5 registros para no saturar
        if (procesados % 5 === 0 && btnFiltro) {
            btnFiltro.innerHTML = `<span>⚙️ Analizando: ${procesados}/${total}</span>`;
            // Opcional: Deshabilitar filtros mientras carga
            // document.getElementById('filterRisk').disabled = true;
        }
    }

    procesandoIA = false;
    if(btnFiltro) {
        btnFiltro.innerHTML = `<span>✅ Análisis Completo (${total}) - Limpiar</span>`;
        // document.getElementById('filterRisk').disabled = false;
    }
    console.log("Escaneo completo. Ahora los filtros funcionarán al 100%.");
}
// --- AMBIO CLAVE PARA CHAMPION 3 ---

function renderizarTabla(clientes) {
    const contenedor = document.getElementById('listaClientes');
    if (!contenedor) return;

    let html = `<table class="data-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Riesgo (Modelo 1.1)</th>
                <th>Estado</th>
                <th>Meses Inactivo</th>
                <th>Uso Tarjeta</th>
                <th>Acción</th>
            </tr>
        </thead>
        <tbody>`;

    clientes.forEach(c => {
        // Verificamos si ya pasó el escáner por aquí
        let tieneDato = c.probabilidadIA != null;
        let probabilidad = tieneDato ? c.probabilidadIA : 0;

        // Determinamos clases y textos
        let textoProb = tieneDato ? `${probabilidad.toFixed(1)}%` : `<span style="color:#999; font-size:12px;">⏳ Pendiente...</span>`;
        let claseColor = 'riesgo-bajo-text';
        let etiqueta = '...';

        if (tieneDato) {
            claseColor = probabilidad >= 70 ? 'riesgo-alto-text' : (probabilidad >= 40 ? 'riesgo-medio-text' : 'riesgo-bajo-text');
            etiqueta = probabilidad >= 70 ? 'CRÍTICO' : (probabilidad >= 40 ? 'ALERTA' : 'ESTABLE');
        }

        html += `<tr id="fila-cliente-${c.id}" class="${(tieneDato && probabilidad >= 70) ? 'riesgo-alto' : ''}">
            <td>${c.id}</td>
            <td id="riesgo-${c.id}" class="${tieneDato ? claseColor : ''}" style="font-weight:bold;">${textoProb}</td>
            <td id="estado-${c.id}">
                ${tieneDato ? `<span class="badge-${claseColor}">${etiqueta}</span>` : '---'}
            </td>
            <td>${c.monthsInactive12Mon} meses</td>
            <td>${(c.avgUtilizationRatio * 100).toFixed(1)}%</td>
            <td>
                <button class="btn-analizar-mini" onclick="irAPrediccionDirecta(${c.id})">🤖 IA Champion 3</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    contenedor.innerHTML = html;
}
/* Función auxiliar para pintar los colores y etiquetas una vez llega la respuesta de Python */
function actualizarFilaConIA(idCliente, probabilidad) {
    const celdaRiesgo = document.getElementById(`riesgo-${idCliente}`);
    const celdaEstado = document.getElementById(`estado-${idCliente}`);
    const fila = document.getElementById(`fila-cliente-${idCliente}`);

    if (!celdaRiesgo || !celdaEstado || !fila) return;

    // RANGOS IDÉNTICOS AL FILTRO: Alto (>=70), Medio (40-70), Bajo (<40)
    let claseColor = probabilidad >= 70 ? 'riesgo-alto-text' : (probabilidad >= 40 ? 'riesgo-medio-text' : 'riesgo-bajo-text');
    let etiqueta = probabilidad >= 70 ? 'CRÍTICO' : (probabilidad >= 40 ? 'ALERTA' : 'ESTABLE');

    celdaRiesgo.innerHTML = `${probabilidad.toFixed(1)}%`;
    celdaRiesgo.className = claseColor;
    celdaRiesgo.style.fontWeight = "bold";

    celdaEstado.innerHTML = `<span class="badge-${claseColor}">${etiqueta}</span>`;

    // Limpiamos clases viejas y aplicamos la nueva si es alto
    fila.classList.remove('riesgo-alto');
    if (probabilidad >= 70) {
        fila.classList.add('riesgo-alto');
    }
}

/* =========================================================
   GUARDAR RESULTADO: Esta función hace que la IA sea "persistente"
   ========================================================= */
async function guardarProbabilidadEnBD(idCliente, valor) {
    /*
    try {
        await fetch(`/api/clientes/${idCliente}/probabilidad`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ probabilidad: valor })
        });
        */
        // Actualizamos localmente para que la tabla se vea bien sin recargar
        const cliente = todosLosClientes.find(c => c.id == idCliente);
        if(cliente) cliente.probabilidadIA = valor;
        /*
    } catch (e) { console.error("Error guardando en Java:", e); }
    */
}


/* =========================================================
   FIX: GRÁFICAS VIBRANTES Y COLORIDAS
   ========================================================= */
function calcularEstadisticas() {
    if (!todosLosClientes || todosLosClientes.length === 0) return;

    // --- A. CÁLCULO DE KPIs (Igual que antes) ---
    const total = todosLosClientes.length;
    const fugados = todosLosClientes.filter(c => c.attritionFlag === 1).length;
    const sumaInactividad = todosLosClientes.reduce((acc, c) => acc + (c.monthsInactive12Mon || 0), 0);
    const inactividadMedia = (sumaInactividad / total).toFixed(1);

    if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = total.toLocaleString();
    if(document.getElementById('stat-riesgo')) document.getElementById('stat-riesgo').innerText = fugados.toLocaleString();
    if(document.getElementById('stat-inactivo')) document.getElementById('stat-inactivo').innerText = inactividadMedia + " meses";

    // --- B. CONFIGURACIÓN BASE ESTILIZADA ---
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, // Ocultamos leyenda por defecto para limpieza
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#00d2ff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                yAlign: 'bottom'
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    // --- 1. GRÁFICA EDAD (MULTICOLOR POR RANGOS) ---
    // Idea: Colores cálidos para jóvenes, fríos para mayores
    const ctxEdad = document.getElementById('chartBarrasEdad');
    if (ctxEdad) {
        const rangos = { "20-35": 0, "36-45": 0, "46-55": 0, "56-65": 0, "66+": 0 };
        todosLosClientes.forEach(c => {
            const edad = c.customerAge;
            if (edad <= 35) rangos["20-35"]++;
            else if (edad <= 45) rangos["36-45"]++;
            else if (edad <= 55) rangos["46-55"]++;
            else if (edad <= 65) rangos["56-65"]++;
            else rangos["66+"]++;
        });

        if (resumenChartEdad) resumenChartEdad.destroy();
        resumenChartEdad = new Chart(ctxEdad, {
            type: 'bar',
            data: {
                labels: Object.keys(rangos),
                datasets: [{
                    label: 'Clientes',
                    data: Object.values(rangos),
                    // AQUÍ ESTÁ LA MAGIA DEL COLOR:
                    backgroundColor: [
                        '#f472b6', // Rosa (Jóvenes)
                        '#a78bfa', // Violeta
                        '#60a5fa', // Azul claro
                        '#2dd4bf', // Turquesa
                        '#34d399'  // Verde (Mayores)
                    ],
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 30 // Barras más gorditas
                }]
            },
            options: commonOptions
        });
    }

    // --- 2. GRÁFICA TARJETAS (COLORES REALES DE LAS TARJETAS) ---
    const ctxBarras = document.getElementById('chartBarrasTarjetas');
    if (ctxBarras) {
        const gold = todosLosClientes.filter(c => c.cardCategoryGold === 1).length;
        const silver = todosLosClientes.filter(c => c.cardCategorySilver === 1).length;
        const platinum = todosLosClientes.filter(c => c.cardCategoryPlatinum === 1).length;
        const blue = total - (gold + silver + platinum);

        if (resumenChartBarras) resumenChartBarras.destroy();
        resumenChartBarras = new Chart(ctxBarras, {
            type: 'doughnut', // CAMBIO: Doughnut se ve más moderno para categorías
            data: {
                labels: ['BLUE', 'SILVER', 'GOLD', 'PLATINUM'],
                datasets: [{
                    data: [blue, silver, gold, platinum],
                    backgroundColor: [
                        '#3b82f6', // Azul intenso
                        '#94a3b8', // Gris Plata
                        '#fbbf24', // Dorado Brillante
                        '#e2e8f0'  // Blanco Platino
                    ],
                    borderColor: '#0f172a', // Borde oscuro para separar segmentos
                    borderWidth: 4,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', // Dona más fina
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { color: '#fff', usePointStyle: true }
                    }
                }
            }
        });
    }

    // --- 3. GRÁFICA INACTIVIDAD (GRADIENTE NEÓN) ---
    const ctxLinea = document.getElementById('chartLineaInactividad');
    if (ctxLinea) {
        const conteoMeses = [0, 1, 2, 3, 4, 5, 6].map(m =>
            todosLosClientes.filter(c => c.monthsInactive12Mon === m).length
        );

        // Crear gradiente visual
        const canvasRef = ctxLinea.getContext('2d');
        const gradient = canvasRef.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 210, 255, 0.5)'); // Azul neón arriba
        gradient.addColorStop(1, 'rgba(0, 210, 255, 0.0)'); // Transparente abajo

        if (resumenChartLinea) resumenChartLinea.destroy();
        resumenChartLinea = new Chart(ctxLinea, {
            type: 'line',
            data: {
                labels: ['0m', '1m', '2m', '3m', '4m', '5m', '6m'],
                datasets: [{
                    label: 'Clientes',
                    data: conteoMeses,
                    borderColor: '#00d2ff', // Línea neón
                    backgroundColor: gradient, // Relleno degradado
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#00d2ff',
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4 // Curvas suaves
                }]
            },
            options: commonOptions
        });
    }
}
/* =========================================================
   5. DASHBOARD PRO (GRÁFICAS)
   ========================================================= */
/* =========================================================
   KPIs Y GRÁFICAS: Arreglando la sección de predicciones
   ========================================================= */
function inicializarDashboardPro() {
    if (todosLosClientes.length === 0) return;

    const total = todosLosClientes.length;
    const fugados = todosLosClientes.filter(c => c.attritionFlag === 1).length;
    const tasaRetencion = (((total - fugados) / total) * 100).toFixed(1);

    // IDs exactos de tu HTML
    if(document.getElementById('kpi-churn-rate')) document.getElementById('kpi-churn-rate').innerText = (100 - tasaRetencion).toFixed(1) + "%";
    if(document.getElementById('kpi-risk-count')) document.getElementById('kpi-risk-count').innerText = fugados;
    if(document.getElementById('kpi-retention')) document.getElementById('kpi-retention').innerText = tasaRetencion + "%";
    if(document.getElementById('kpi-impact')) document.getElementById('kpi-impact').innerText = "$" + (fugados * 1200).toLocaleString();

    // Gráfica de Distribución
    const ctxDona = document.getElementById('chartDistribucion');
    if (ctxDona) {
        if (chartDonaPro) chartDonaPro.destroy();
        chartDonaPro = new Chart(ctxDona, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'En Riesgo'],
                datasets: [{ data: [total - fugados, fugados], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }]
            },
            options: { responsive: true, cutout: '80%', plugins: { legend: { display: false } } }
        });
    }

    // Gráfica de Tendencia (Simulada para visualización)
    const ctxLinea = document.getElementById('chartTendencia');
    if (ctxLinea) {
        if (chartLinePro) chartLinePro.destroy();
        chartLinePro = new Chart(ctxLinea, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Tendencia de Fuga',
                    data: [5, 10, 8, 15, 12, fugados % 100],
                    borderColor: '#00d2ff',
                    backgroundColor: 'rgba(0, 210, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

/* =========================================================
   6. LÓGICA DE PREDICCIÓN CON CHAMPION 3
   ========================================================= */
function irAPrediccionDirecta(id) {
    mostrarSeccion('predicciones');
    setTimeout(() => {
        document.getElementById('inputPredictId').value = id;
        ejecutarPrediccionIndividual();
    }, 150);
}

async function ejecutarPrediccionIndividual() {
    const id = document.getElementById('inputPredictId').value;
    const resultadoDiv = document.getElementById('resultadoIA');
    if (!id) return;

    // 1. Buscamos los datos del cliente en nuestro array local para enviárselos a la IA
    const cliente = todosLosClientes.find(c => c.id == id);
    if (!cliente) {
        resultadoDiv.innerHTML = "<p>Error: Cliente no encontrado en la base local.</p>";
        return;
    }

    resultadoDiv.innerHTML = `<p class="loading-text">Consultando Champion 3...</p>`;

    try {
        const response = await fetch(`/api/champion3/predecir/${id}`, {
            method: 'POST', // ¡IMPORTANTE! Debe ser POST
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            // Enviamos los datos que el modelo Champion 3 necesita
            body: JSON.stringify({
                customer_age: cliente.customerAge,
                months_inactive12mon: cliente.monthsInactive12Mon,
                contacts_count12mon: cliente.contactsCount12Mon,
                total_ct_chngq4q1: cliente.totalCtChngQ4Q1,
                avg_utilization_ratio: cliente.avgUtilizationRatio,
                low_relationship_count: cliente.lowRelationshipCount,
                genderm: cliente.genderM
                // Agrega aquí los demás si el modelo los pide
            })
        });

        if (response.ok) {
            const data = await response.json();
            mostrarResultadoChampion(data);
            guardarProbabilidadEnBD(id, data.probabilidad);
        } else {
            // Si da 403, saltará al catch o mostrará este error
            resultadoDiv.innerHTML = `<p style="color: var(--danger);">Error ${response.status}: Acceso denegado o token vencido.</p>`;
        }
    } catch (e) {
        console.error("Error en la petición:", e);
        //simularRespuestaChampion();
        resultadoDiv.innerHTML = `<p style="color: var(--danger);">Error de conexión: Verifica que Python esté corriendo en el puerto 5000.</p>`;
    }
}

function mostrarResultadoChampion(data) {
    const resultadoDiv = document.getElementById('resultadoIA');
    const riesgo = determinarNivelRiesgo(data.probabilidad);

    // Guardamos los datos temporalmente en una variable global para usarlos en la otra sección
    window.ultimoAnalisis = {
        probabilidad: data.probabilidad,
        motivos: data.motivoPrincipal,
        clienteId: document.getElementById('inputPredictId').value,
        riesgoInfo: riesgo
    };

    resultadoDiv.innerHTML = `
        <div class="ia-result-card-advanced ${riesgo.claseCss}">
            <div class="ia-score-large" style="color:${riesgo.color}">${data.probabilidad}%</div>
            <p>El cliente presenta un riesgo <strong>${riesgo.nivel}</strong>.</p>

            <button class="btn-primary-glow" onclick="irADetallePlan()" style="margin-top:15px; width:100%;">
                📋 Ver Acciones Recomendadas
            </button>
        </div>`;
}

// Nueva función para llenar la sección de Plan de Acción
function irADetallePlan() {
    const info = window.ultimoAnalisis;
    if(!info) return;

    // 1. Cambiar de sección
    mostrarSeccion('plan-accion');

    // 2. Llenar el banner superior
    document.getElementById('plan-client-header').innerHTML = `
        <div class="banner-content">
            <h2>Cliente ID: ${info.clienteId}</h2>
            <span class="badge-riesgo" style="background:${info.riesgoInfo.color}">Riesgo ${info.riesgoInfo.nivel} (${info.probabilidad}%)</span>
        </div>
    `;

    // 3. Limpiar y llenar motivos (Separamos los puntos que envía Python)
    const listaMotivos = info.motivos.split('.').filter(m => m.trim() !== "");
    let htmlMotivos = "<ul>";
    listaMotivos.forEach(m => {
        htmlMotivos += `<li><i class="fas fa-exclamation-circle"></i> ${m.trim()}</li>`;
    });
    htmlMotivos += "</ul>";
    document.getElementById('plan-motivos-lista').innerHTML = htmlMotivos;

    // 4. Acciones dinámicas según los motivos
    let htmlAcciones = "<ul>";
    if (info.motivos.includes("inactividad")) {
        htmlAcciones += `<li>✅ Enviar cupón de reactivación "Vuelve con nosotros".</li>`;
    }
    if (info.motivos.includes("transacciones")) {
        htmlAcciones += `<li>✅ Llamada de fidelización para ofrecer aumento de cupo.</li>`;
    }
    if (info.motivos.includes("contactado")) {
        htmlAcciones += `<li>✅ Priorizar caso en Servicio al Cliente (Atención VIP).</li>`;
    }
    htmlAcciones += `<li>✅ ${info.riesgoInfo.plan}</li>`; // El plan genérico que ya tenías
    htmlAcciones += "</ul>";

    document.getElementById('plan-acciones-especificas').innerHTML = htmlAcciones;
}

function simularRespuestaChampion() {
    // Esto es solo para que veas cómo se verá mientras conectamos el backend real
    const prob = (Math.random() * 100).toFixed(1);
    mostrarResultadoChampion({
        probabilidad: prob,
        motivoPrincipal: "Baja utilización de tarjeta y aumento en inactividad (3 meses)."
    });
}

function determinarNivelRiesgo(probabilidad) {
    if (probabilidad < 40) {
        return { nivel: 'Bajo', color: '#10b981', claseCss: 'risk-low', plan: 'Cliente estable. Incluir en campaña de fidelización estándar.' };
    } else if (probabilidad >= 40 && probabilidad < 70) {
        return { nivel: 'Medio', color: '#f59e0b', claseCss: 'risk-medium', plan: 'Ofrecer upgrade de tarjeta o beneficio temporal.' };
    } else {
        return { nivel: 'Crítico', color: '#ef4444', claseCss: 'risk-high', plan: '🚨 ¡Alerta! Contactar inmediatamente con oferta de retención.' };
    }
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
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
/* =========================================================
   LÓGICA PARA MOSTRAR/OCULTAR EQUIPO EN EL FOOTER
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const btnToggleTeam = document.getElementById('btn-toggle-team');
    const teamSection = document.getElementById('teamSection');

    if (btnToggleTeam && teamSection) {
        btnToggleTeam.addEventListener('click', () => {
            // Si está oculto, lo mostramos con una animación
            if (teamSection.style.display === 'none') {
                teamSection.style.display = 'block';
                btnToggleTeam.innerHTML = 'Cerrar sección <i class="fas fa-chevron-up" style="font-size: 10px;"></i>';

                // Scroll suave hacia la sección
                teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                teamSection.style.display = 'none';
                btnToggleTeam.innerHTML = 'Conoce a nuestro equipo <i class="fas fa-chevron-down" style="font-size: 10px;"></i>';
            }
        });
    }
});
// INICIO DE LA APP
cargarDatos();