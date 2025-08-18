/*==========================================================
  1. VARIABLES Y RESETEO GLOBAL
==========================================================*/

:root {
    --primary-color: #2c3e50; /* Azul oscuro elegante */
    --primary-hover: #34495e;
    --secondary-color: #3498db; /* Azul vibrante para acentos */
    --secondary-hover: #2980b9;
    --background-color: #ecf0f1; /* Gris claro suave */
    --card-background: #ffffff;
    --text-color: #333333;
    --muted-color: #7f8c8d;
    --border-color: #bdc3c7;
    --error-color: #e74c3c;
    --success-color: #2ecc71;
    --multa-color: #f39c12;
    --paid-color: #2ecc71;
    --pending-color: #e74c3c;
    --font-family: 'Poppins', sans-serif;
    --box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

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
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100vh;
    transition: opacity 0.5s ease-in-out;
}

.page.active {
    display: block;
    animation: fadeIn 0.8s ease-in-out;
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
    padding: 1rem 2rem;
    box-shadow: var(--box-shadow);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    position: sticky;
    top: 0;
    z-index: 1000;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
}

.logo-text {
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-text i {
    color: var(--secondary-color);
}

.logo-image {
    height: 30px;
    margin-right: 10px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

/*==========================================================
  3. COMPONENTES DE UI
==========================================================*/

/* Botones */
.btn {
    padding: 12px 25px;
    border-radius: 25px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
}

.btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    background-color: var(--error-color);
    color: var(--card-background);
}

.logout-btn:hover {
    background-color: #c0392b;
}

/* Contenedores y Títulos de Sección */
.panel-container {
    max-width: 1200px;
    margin: 30px auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 30px;
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
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 15px;
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
    border: 1px solid var(--border-color);
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
    font-weight: 600;
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
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 1rem;
    transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="password"]:focus,
input[type="date"]:focus,
input[type="number"]:focus,
select:focus {
    outline: none;
    border-color: var(--secondary-color);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
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
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
}

.data-table tr:last-child td {
    border-bottom: none;
}

.data-table tbody tr:hover {
    background-color: #f8f9fa;
    transition: background-color 0.3s ease;
}

/* Estilos para el estado de las facturas */
.status-badge {
    padding: 5px 10px;
    border-radius: 15px;
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
    background-color: rgba(0, 0, 0, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(5px);
    opacity: 0;
    transition: opacity 0.3s ease;
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
    transform: scale(0.95);
    transition: transform 0.3s ease;
}

.modal-backdrop.active .modal {
    transform: scale(1);
}

.modal-close-btn {
    font-size: 1.5rem;
    font-weight: bold;
    position: absolute;
    top: 15px;
    right: 25px;
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
    font-size: 1.5rem;
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

.error-message {
    color: var(--error-color);
    background-color: #fdecea;
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid var(--error-color);
    margin-top: 15px;
    font-size: 0.9rem;
    display: none;
}

.success-message {
    color: var(--success-color);
    background-color: #e8f5e9;
    padding: 10px 15px;
    border-radius: 8px;
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
}

.login-container .logo-text {
    font-size: 2rem;
    margin-bottom: 20px;
}

.login-container h2 {
    font-size: 1.8rem;
    color: var(--primary-color);
    margin-bottom: 30px;
}

.login-container form {
    background-color: var(--card-background);
    padding: 40px;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
    width: 100%;
    max-width: 400px;
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
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    display: none;
}

.spinner {
    border: 6px solid var(--border-color);
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

    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .user-info {
        margin-top: 10px;
    }

    .panel-container {
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

    .login-container {
        padding: 15px;
    }
}
