/*==========================================================
  1. VARIABLES Y RESETEO GLOBAL
==========================================================*/

:root {
    --primary-color: #212529; /* Casi negro para el texto principal y fondo */
    --primary-hover: #343a40;
    --secondary-color: #4dabf7; /* Azul claro para acentos y elementos interactivos */
    --secondary-hover: #339af0;
    --background-color: #f8f9fa; /* Fondo muy claro */
    --card-background: #ffffff; /* Fondo blanco para tarjetas y paneles */
    --text-color: #495057;
    --muted-color: #adb5bd;
    --border-color: #dee2e6;
    --error-color: #e03131;
    --success-color: #2b8a3e;
    --multa-color: #e67700;
    --paid-color: #2b8a3e;
    --pending-color: #e03131;
    --font-family: 'Inter', sans-serif;
    --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

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
    padding: 2rem;
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
    background: var(--card-background);
    padding: 1.5rem 2rem;
    box-shadow: var(--box-shadow);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo-text {
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--primary-color);
}

.logo-image {
    height: 35px;
    margin-right: 10px;
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
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn:hover {
    transform: translateY(-1px);
}

.primary-btn {
    background-color: var(--primary-color);
    color: var(--card-background);
}

.primary-btn:hover {
    background-color: var(--primary-hover);
}

.secondary-btn {
    background-color: var(--secondary-color);
    color: var(--card-background);
}

.secondary-btn:hover {
    background-color: var(--secondary-hover);
}

.logout-btn {
    background-color: transparent;
    color: var(--error-color);
    border: 1px solid var(--error-color);
}

.logout-btn:hover {
    background-color: var(--error-color);
    color: var(--card-background);
}

/* Contenedores y Títulos de Sección */
.panel-container {
    max-width: 1100px;
    margin: 40px auto;
    padding: 0 20px;
}

.admin-section,
.resident-section {
    background: var(--card-background);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
    margin-bottom: 30px;
}

.section-title {
    font-size: 1.7rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 25px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 15px;
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
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

.form-section h3 {
    margin-bottom: 15px;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.3rem;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 15px;
}

.input-group {
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
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
}

input[type="text"]:focus,
input[type="password"]:focus,
input[type="date"]:focus,
input[type="number"]:focus,
select:focus {
    outline: none;
    border-color: var(--secondary-color);
    box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.hidden {
    display: none !important;
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
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.data-table th {
    background-color: var(--primary-color);
    color: var(--card-background);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
}

.data-table tbody tr:hover {
    background-color: #f1f3f5;
    transition: background-color 0.3s ease;
}

/* Estilos para el estado de las facturas */
.status-badge {
    padding: 6px 12px;
    border-radius: 15px;
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--card-background);
    display: inline-block;
    text-align: center;
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
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal-backdrop.active {
    opacity: 1;
    visibility: visible;
}

.modal {
    background-color: var(--card-background);
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 600px;
    position: relative;
    transform: scale(0.95) translateY(20px);
    transition: transform 0.3s ease;
}

.modal-backdrop.active .modal {
    transform: scale(1) translateY(0);
}

.modal-close-btn {
    font-size: 1.5rem;
    font-weight: bold;
    position: absolute;
    top: 15px;
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
    font-weight: 600;
    font-size: 1.4rem;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.modal-body {
    max-height: 60vh;
    overflow-y: auto;
}

/*==========================================================
  7. MENSAJES DE ERROR Y ÉXITO
==========================================================*/

.error-message, .success-message {
    padding: 12px 15px;
    border-radius: 6px;
    margin-top: 15px;
    font-size: 0.9rem;
    display: none;
    font-weight: 500;
}

.error-message {
    color: var(--error-color);
    background-color: #ffe3e3;
    border: 1px solid var(--error-color);
}

.success-message {
    color: var(--success-color);
    background-color: #d6f2df;
    border: 1px solid var(--success-color);
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
}

.login-container .logo-text {
    font-size: 2rem;
    margin-bottom: 20px;
}

.login-container h2 {
    font-size: 1.6rem;
    color: var(--primary-color);
    margin-bottom: 25px;
}

.login-container form {
    background-color: var(--card-background);
    padding: 35px;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
    width: 100%;
    max-width: 400px;
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
    border: 5px solid #f3f3f3;
    border-top: 5px solid var(--secondary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
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
    .page {
        padding: 1rem;
    }

    header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .user-info {
        width: 100%;
        justify-content: flex-end;
    }

    .section-title {
        font-size: 1.5rem;
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
        grid-template-columns: 1fr;
    }
}
