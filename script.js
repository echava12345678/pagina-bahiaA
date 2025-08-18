/*==========================================================
  1. VARIABLES Y RESETEO GLOBAL
==========================================================*/

:root {
    --primary-color: #0d1a26; /* Azul muy oscuro, casi negro */
    --primary-hover: #1f3044;
    --secondary-color: #00b4d8; /* Azul claro brillante para acentos */
    --secondary-hover: #0077b6;
    --background-color: #f0f2f5; /* Gris claro para el fondo */
    --card-background: #ffffff; /* Blanco para tarjetas y paneles */
    --text-color: #34495e;
    --muted-color: #95a5a6;
    --border-color: #e0e6ed;
    --error-color: #e74c3c;
    --success-color: #2ecc71;
    --multa-color: #f39c12;
    --paid-color: #2ecc71;
    --pending-color: #e74c3c;
    --font-family: 'Roboto', sans-serif;
    --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: var(--font-family);
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
    min-height: 100vh;
}

/*==========================================================
  2. LAYOUT Y ESTRUCTURA DE PÁGINAS
==========================================================*/

.page {
    display: none;
    min-height: 100vh;
    padding-top: 80px; /* Para dejar espacio para el header fijo */
    animation: fadeIn 0.8s ease-in-out;
}

.page.active {
    display: block;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

header {
    background: var(--primary-color);
    color: white;
    padding: 1rem 3rem;
    box-shadow: var(--box-shadow);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
}

.logo-text {
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--secondary-color);
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-image {
    height: 40px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 500;
}

/*==========================================================
  3. COMPONENTES DE UI
==========================================================*/

/* Botones */
.btn {
    padding: 12px 25px;
    border-radius: 5px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.primary-btn {
    background-color: var(--secondary-color);
    color: var(--card-background);
}

.primary-btn:hover {
    background-color: var(--secondary-hover);
}

.secondary-btn {
    background-color: var(--text-color);
    color: var(--card-background);
}

.secondary-btn:hover {
    background-color: var(--muted-color);
}

.logout-btn {
    background-color: transparent;
    border: 2px solid var(--secondary-color);
    color: var(--secondary-color);
}

.logout-btn:hover {
    background-color: var(--secondary-color);
    color: var(--card-background);
}

/* Contenedores y Títulos de Sección */
.panel-container {
    max-width: 1200px;
    margin: 50px auto;
    padding: 0 20px;
    display: grid;
    grid-gap: 30px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.admin-section,
.resident-section {
    background: var(--card-background);
    padding: 30px;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
}

.section-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.action-buttons {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

/*==========================================================
  4. ESTILOS DE FORMULARIOS
==========================================================*/

.form-section {
    background-color: var(--background-color);
    padding: 25px;
    border-radius: 10px;
    margin-top: 20px;
}

.form-section h3 {
    margin-bottom: 15px;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.4rem;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.input-group {
    flex: 1;
    min-width: 250px;
    display: flex;
    flex-direction: column;
}

label {
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--text-color);
    font-size: 0.9rem;
}

input[type="text"],
input[type="password"],
input[type="date"],
input[type="number"],
select {
    width: 100%;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid var(--border-color);
    font-size: 1rem;
    transition: border-color 0.3s;
    background-color: var(--card-background);
}

input[type="text"]:focus,
input[type="password"]:focus,
input[type="date"]:focus,
input[type="number"]:focus,
select:focus {
    outline: none;
    border-color: var(--secondary-color);
    box-shadow: 0 0 0 2px rgba(0, 180, 216, 0.2);
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.hidden {
    display: none !important;
}

.instruction-text {
    margin-top: 15px;
    font-size: 0.9rem;
    color: var(--muted-color);
    border-left: 3px solid var(--secondary-color);
    padding-left: 15px;
}

/*==========================================================
  5. ESTILOS DE TABLAS
==========================================================*/

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--card-background);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--box-shadow);
}

.data-table th,
.data-table td {
    padding: 18px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.data-table th {
    background-color: var(--primary-color);
    color: var(--card-background);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
}

.data-table tbody tr:hover {
    background-color: #f8f9fa;
    transition: background-color 0.3s ease;
}

/* Estilos para el estado de las facturas */
.status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--card-background);
    display: inline-block;
}

.status-badge.paid {
    background-color: var(--paid-color);
}

.status-badge.pending {
    background-color: var(--pending-color);
}

.status-badge.multa {
    background-color: var(--multa-color);
}

/*==========================================================
  6. MODALES Y VENTANAS EMERGENTES
==========================================================*/

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.4s ease;
}

.modal-backdrop.active {
    display: flex;
    opacity: 1;
}

.modal {
    background-color: var(--card-background);
    padding: 30px;
    border-radius: 15px;
    box-shadow: var(--box-shadow);
    width: 90%;
    max-width: 700px;
    position: relative;
    transform: translateY(-20px);
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.modal-backdrop.active .modal {
    transform: translateY(0);
}

.modal-close-btn {
    font-size: 1.8rem;
    font-weight: bold;
    position: absolute;
    top: 10px;
    right: 20px;
    cursor: pointer;
    color: var(--muted-color);
    transition: color 0.2s;
}

.modal-close-btn:hover {
    color: var(--error-color);
}

.modal h3 {
    margin-top: 0;
    color: var(--primary-color);
    font-weight: 700;
    font-size: 1.5rem;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 10px;
}

.modal-body {
    max-height: 60vh;
    overflow-y: auto;
}

/*==========================================================
  7. MENSAJES DE ERROR Y ÉXITO
==========================================================*/

.error-message {
    color: var(--error-color);
    background-color: #fce4e4;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid var(--error-color);
    margin-top: 15px;
    font-size: 0.9rem;
    display: none;
}

.success-message {
    color: var(--success-color);
    background-color: #e8f5e9;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid var(--success-color);
    margin-top: 15px;
    font-size: 0.9rem;
    display: none;
}

/*==========================================================
  8. PÁGINA DE INICIO DE SESIÓN
==========================================================*/

.login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    text-align: center;
    padding: 20px;
    background: url('https://picsum.photos/1920/1080?grayscale') no-repeat center center/cover;
}

.login-container .logo-text {
    font-size: 2.5rem;
    margin-bottom: 20px;
    color: var(--card-background);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.login-container h2 {
    font-size: 1.8rem;
    color: var(--card-background);
    margin-bottom: 30px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
}

.login-container form {
    background-color: rgba(255, 255, 255, 0.9);
    padding: 40px;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
    width: 100%;
    max-width: 450px;
    backdrop-filter: blur(5px);
}

.login-container .input-group {
    margin-bottom: 25px;
}

/*==========================================================
  9. SPINNER DE CARGA
==========================================================*/

.spinner-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    display: none;
}

.spinner {
    border: 6px solid #f3f3f3;
    border-top: 6px solid var(--secondary-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/*==========================================================
  10. MEDIA QUERIES PARA RESPONSIVIDAD
==========================================================*/

@media (max-width: 768px) {
    header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .user-info {
        width: 100%;
        justify-content: space-between;
    }

    .panel-container {
        grid-template-columns: 1fr;
        padding: 0 15px;
    }

    .action-buttons {
        flex-direction: column;
        gap: 10px;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }

    .form-row {
        flex-direction: column;
        gap: 15px;
    }
}
