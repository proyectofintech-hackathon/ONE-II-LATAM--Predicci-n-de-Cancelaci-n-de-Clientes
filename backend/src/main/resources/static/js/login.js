document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json(); // Leemos el JSON (token y message)

        if (response.ok) {
            // Guardamos el token que viene en el JSON
            sessionStorage.setItem('token', data.token);
            console.log("Login exitoso, redirigiendo...");
            window.location.href = 'loading.html';
        } else {
            alert('Error: ' + (data.message || 'Usuario o contraseña incorrectos'));
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        alert('No se pudo conectar con el servidor');
    }
});