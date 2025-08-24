// Hola!! si estas chismoseando el codigo :)
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHBV9thJ0iy3c30k3ERCYvRoDQMM",
    authDomain: "bahiaa.firebaseapp.com",
    projectId: "bahiaa",
    storageBucket: "bahiaa.firebasestorage.app",
    messagingSenderId: "212926382954",
    appId: "1:212926382954:web:526bfab6d7c29ee20c1b13",
    measurementId: "G-C3DWGGH4KY"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminPanel = document.getElementById('admin-panel');
const residentPanel = document.getElementById('resident-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const residentLogoutBtn = document.getElementById('resident-logout-btn');
const residentForm = document.getElementById('resident-form');
const billForm = document.getElementById('bill-form');
const residentsTableBody = document.querySelector('#residents-table tbody');
const residentBillsTableBody = document.querySelector('#resident-bills-table tbody');
const residentWelcome = document.getElementById('resident-welcome');
const adminWelcome = document.getElementById('admin-welcome');
const exportExcelBtn = document.getElementById('export-excel-btn');
const statusSelect = document.getElementById('bill-status');
const paymentDateGroup = document.getElementById('payment-date-group');
const changeCredentialsFormInner = document.getElementById('change-credentials-form-inner');
const credentialsError = document.getElementById('credentials-error');
const credentialsSuccess = document.getElementById('credentials-success');
const residentEmailInput = document.getElementById('resident-email'); // CAMBIO: Referencia al nuevo campo de correo electrónico
const spinnerContainer = document.getElementById('loading-spinner');

let currentResidentId = null;

// Helper functions
function showSpinner() {
    spinnerContainer.style.display = 'flex';
}

function hideSpinner() {
    spinnerContainer.style.display = 'none';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(value);
}

function parseCurrency(value) {
    return parseFloat(value.replace(/[^0-9,-]+/g, "").replace(',', '.'));
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO');
}

function toggleSection(sectionId) {
    document.querySelectorAll('.form-section, .table-section').forEach(section => {
        section.classList.add('hidden');
    });
    if (sectionId) {
        document.getElementById(sectionId).classList.remove('hidden');
    }
}

function toggleResidentSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    if (sectionId) {
        document.getElementById(sectionId).classList.remove('hidden');
    }
}

// User Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm['username-login'].value;
    const password = loginForm['password-login'].value;
    showSpinner();
    loginError.textContent = '';

    if (username === 'admin' && password === '123') {
        loginPage.classList.remove('active');
        adminPanel.classList.add('active');
        adminWelcome.textContent = 'Bienvenido, Administrador';
        loadResidents();
        loadAdminBills();
    } else {
        try {
            const residentSnapshot = await db.collection('residents').where('username', '==', username).get();
            if (residentSnapshot.empty) {
                loginError.textContent = 'Usuario o contraseña incorrectos.';
            } else {
                const residentDoc = residentSnapshot.docs[0];
                const resident = residentDoc.data();
                if (resident.password === password) {
                    currentResidentId = residentDoc.id;
                    loginPage.classList.remove('active');
                    residentPanel.classList.add('active');
                    residentWelcome.textContent = `Bienvenido, ${resident.name}`;
                    loadResidentBills(currentResidentId);
                    toggleResidentSection('resident-bills-section');
                } else {
                    loginError.textContent = 'Usuario o contraseña incorrectos.';
                }
            }
        } catch (err) {
            console.error("Error logging in: ", err);
            loginError.textContent = 'Error al iniciar sesión. Intenta de nuevo.';
        }
    }
    hideSpinner();
});

logoutBtn.addEventListener('click', () => {
    adminPanel.classList.remove('active');
    loginPage.classList.add('active');
    loginForm.reset();
});

residentLogoutBtn.addEventListener('click', () => {
    residentPanel.classList.remove('active');
    loginPage.classList.add('active');
    loginForm.reset();
    currentResidentId = null;
});

// Resident CRUD operations
residentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = residentForm['resident-id'].value;
    const name = residentForm['resident-name'].value;
    const depto = residentForm['resident-depto'].value;
    const email = residentForm['resident-email'].value; // CAMBIO: Variable para capturar el correo electrónico del residente
    const username = residentForm['resident-username'].value;
    const password = residentForm['resident-password'].value;

    showSpinner();
    try {
        await db.collection('residents').doc(residentId).set({
            name,
            depto,
            email, // CAMBIO: Se guarda el campo 'email' en la base de datos
            username,
            password,
            initialPassword: password,
            credentialsChanged: false
        });
        alert('Residente agregado exitosamente.');
        residentForm.reset();
        loadResidents();
    } catch (err) {
        console.error("Error adding resident: ", err);
        alert('Error al agregar residente.');
    } finally {
        hideSpinner();
        toggleSection(null);
    }
});

async function loadResidents() {
    showSpinner();
    residentsTableBody.innerHTML = '';
    try {
        const snapshot = await db.collection('residents').get();
        snapshot.docs.forEach(doc => {
            const resident = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${resident.name}</td>
                <td>${resident.depto}</td>
                <td>${resident.username}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteResident('${doc.id}')"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            residentsTableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading residents: ", err);
    } finally {
        hideSpinner();
    }
}

async function deleteResident(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este residente y todas sus facturas?')) {
        showSpinner();
        try {
            await db.collection('residents').doc(id).delete();
            const billsSnapshot = await db.collection('bills').where('residentId', '==', id).get();
            const batch = db.batch();
            billsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert('Residente y sus facturas eliminadas.');
            loadResidents();
            loadAdminBills();
        } catch (err) {
                console.error("Error deleting resident: ", err);
                alert('Error al eliminar residente.');
        } finally {
            hideSpinner();
        }
    }
}

// Bill CRUD operations (Admin)
statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Pagada') {
        paymentDateGroup.style.display = 'flex';
    } else {
        paymentDateGroup.style.display = 'none';
    }
});

billForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = billForm['bill-resident-id'].value;
    const dueDate = billForm['bill-due-date'].value;
    const amount = parseFloat(billForm['bill-amount'].value);
    const concept = billForm['bill-concept'].value;
    const status = billForm['bill-status'].value;
    const paymentDate = billForm['bill-payment-date'].value;

    showSpinner();
    try {
        await db.collection('bills').add({
            residentId,
            dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
            amount,
            concept,
            status,
            paymentDate: paymentDate ? firebase.firestore.Timestamp.fromDate(new Date(paymentDate)) : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Factura agregada exitosamente.');
        billForm.reset();
        loadAdminBills();
        
        // --- COMENTARIO: Llamada a la nueva función que se comunica con el servidor de Node.js ---
        await enviarNotificacionFactura(residentId, concept, dueDate, amount);
        // -------------------------------------------------------------------------------------------

    } catch (err) {
        console.error("Error adding bill: ", err);
        alert('Error al agregar factura.');
    } finally {
        hideSpinner();
        toggleSection(null);
    }
});

async function loadAdminBills() {
    showSpinner();
    const tableBody = document.querySelector('#admin-bills-table tbody');
    tableBody.innerHTML = '';
    try {
        const snapshot = await db.collection('bills').get();
        for (const doc of snapshot.docs) {
            const bill = doc.data();
            const residentDoc = await db.collection('residents').doc(bill.residentId).get();
            const resident = residentDoc.data();
            const residentName = resident ? resident.name : 'Desconocido';
            const statusClass = bill.status === 'Pagada' ? 'paid-status' : 'pending-status';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${residentName} (${bill.residentId})</td>
                <td>${bill.concept}</td>
                <td>${formatCurrency(bill.amount)}</td>
                <td>${formatDate(bill.dueDate)}</td>
                <td class="${statusClass}">${bill.status}</td>
                <td>${formatDate(bill.paymentDate)}</td>
                <td>
                    <button class="btn btn-warning" onclick="editBill('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" onclick="deleteBill('${doc.id}')"><i class="fas fa-trash-alt"></i></button>
                    <button class="btn primary-btn download-receipt-btn" data-id="${doc.id}"><i class="fas fa-download"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        }
        addDownloadReceiptListeners();
    } catch (err) {
        console.error("Error loading bills: ", err);
    } finally {
        hideSpinner();
    }
}

async function deleteBill(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
        showSpinner();
        try {
            await db.collection('bills').doc(id).delete();
            alert('Factura eliminada.');
            loadAdminBills();
        } catch (err) {
            console.error("Error deleting bill: ", err);
            alert('Error al eliminar factura.');
        } finally {
            hideSpinner();
        }
    }
}

// Bill CRUD operations (Resident)
async function loadResidentBills(residentId) {
    showSpinner();
    residentBillsTableBody.innerHTML = '';
    try {
        const snapshot = await db.collection('bills').where('residentId', '==', residentId).get();
        for (const doc of snapshot.docs) {
            const bill = doc.data();
            const statusClass = bill.status === 'Pagada' ? 'paid-status' : 'pending-status';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bill.concept}</td>
                <td>${formatCurrency(bill.amount)}</td>
                <td>${formatDate(bill.dueDate)}</td>
                <td class="${statusClass}">${bill.status}</td>
                <td>${formatDate(bill.paymentDate)}</td>
                <td>
                    <button class="btn primary-btn download-receipt-btn" data-id="${doc.id}"><i class="fas fa-download"></i></button>
                </td>
            `;
            residentBillsTableBody.appendChild(row);
        }
        addDownloadReceiptListeners();
    } catch (err) {
        console.error("Error loading resident bills: ", err);
    } finally {
        hideSpinner();
    }
}

// Credential change for residents
changeCredentialsFormInner.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldUsername = changeCredentialsFormInner['old-username'].value;
    const oldPassword = changeCredentialsFormInner['old-password'].value;
    const newUsername = changeCredentialsFormInner['new-username'].value;
    const newPassword = changeCredentialsFormInner['new-password'].value;

    credentialsError.textContent = '';
    credentialsSuccess.textContent = '';
    showSpinner();

    try {
        const residentDoc = await db.collection('residents').doc(currentResidentId).get();
        const resident = residentDoc.data();

        if (resident.username === oldUsername && resident.password === oldPassword) {
            await db.collection('residents').doc(currentResidentId).update({
                username: newUsername,
                password: newPassword,
                credentialsChanged: true
            });
            credentialsSuccess.textContent = 'Credenciales actualizadas exitosamente.';
            changeCredentialsFormInner.reset();
            const updatedResidentDoc = await db.collection('residents').doc(currentResidentId).get();
            const updatedResident = updatedResidentDoc.data();
            residentWelcome.textContent = `Bienvenido, ${updatedResident.name}`;
        } else {
            credentialsError.textContent = 'Usuario o contraseña actual incorrectos.';
        }
    } catch (err) {
        console.error("Error changing credentials:", err);
        credentialsError.textContent = 'Error al cambiar credenciales. Intenta de nuevo.';
    } finally {
        hideSpinner();
        toggleSection(null);
    }
});

// Bill PDF Generation
function addDownloadReceiptListeners() {
    document.querySelectorAll('.download-receipt-btn').forEach(btn => {
        btn.onclick = async () => {
            const billId = btn.dataset.id;
            const billDoc = await db.collection('bills').doc(billId).get();
            const bill = billDoc.data();

            if (!bill) {
                alert('No se encontró la factura.');
                return;
            }

            const residentDoc = await db.collection('residents').doc(bill.residentId).get();
            const resident = residentDoc.data();

            if (!resident) {
                alert('No se encontró el residente asociado a esta factura.');
                return;
            }

            const element = document.createElement('div');
            element.innerHTML = getReceiptHtml(bill, resident);

            const options = {
                margin: [10, 10, 10, 10],
                filename: `Recibo_${resident.depto}_${formatDate(bill.dueDate).replace(/\//g, '-')}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
            };

            html2pdf().from(element).set(options).save();
        };
    });
}

function getReceiptHtml(bill, resident) {
    const receiptContent = `
<style>
    body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; }
    .invoice-box {
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border: 1px solid #eee;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        line-height: 24px;
        color: #555;
    }
    .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
    .invoice-box table td { padding: 5px; vertical-align: top; }
    .invoice-box table tr td:nth-child(2) { text-align: right; }
    .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
    .invoice-box table tr.information table td { padding-bottom: 20px; }
    .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
    .invoice-box table tr.details td { padding-bottom: 20px; }
    .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
    .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    .header-info { text-align: center; margin-bottom: 20px; }
    .header-info h2 { margin: 0; color: #4A90E2; font-size: 20px; }
    .logo-container { text-align: center; margin-bottom: 20px; }
    .logo-container img { max-width: 150px; }
    .table-details { margin-top: 20px; }
    .table-details th, .table-details td { padding: 8px; border: 1px solid #ddd; }
    .table-details tr.total-row { background-color: #f2f2f2; font-weight: bold; }
</style>
<div class="invoice-box">
    <table>
        <tr>
            <td colspan="2">
                <table>
                    <tr class="top">
                        <td colspan="2">
                            <table>
                                <tr>
                                    <td class="title">
                                        <div class="logo-container">
                                            <img src="logo bahia a.png" alt="Logo de Edificio Bahia-A">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="header-info">
                                            <h2>EDIFICIO BAHÍA ETAPA A</h2>
                                            <p style="font-size: 12px; margin: 0;">Nit 901048187-4</p>
                                            <p style="font-size: 12px; margin: 0;">Carrera 65 no. 42 -101 Teléfono 3104086837 - Medellín</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class="information">
                        <td colspan="2">
                            <table>
                                <tr>
                                    <td>
                                        <p style="margin: 0; font-weight: bold;">CUENTA DE COBRO No: 015</p>
                                        <p style="margin: 0; font-weight: bold;">REFERENCIA DE PAGO: 602</p>
                                    </td>
                                    <td>
                                        <p style="margin: 0; font-weight: bold;">PERIODO DE FACTURACIÓN:</p>
                                        <p style="margin: 0;">${bill.concept.toUpperCase()}</p>
                                        <p style="margin: 0;">FECHA VENCIMIENTO: ${formatDate(bill.dueDate)}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <div style="border: 1px solid #ddd; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">APTO: ${resident.depto}</p>
        <p style="margin: 0; font-weight: bold;">COPROPIETARIO: ${resident.name.toUpperCase()}</p>
        <table class="table-details" style="margin-top: 10px;">
            <thead>
                <tr class="heading">
                    <td style="width: 50%;">CONCEPTO</td>
                    <td style="text-align: right;">SALDO ANTERIOR</td>
                    <td style="text-align: right;">ESTE MES</td>
                    <td style="text-align: right;">A PAGAR</td>
                </tr>
            </thead>
            <tbody>
                <tr class="item">
                    <td>ADMINISTRACIÓN</td>
                    <td style="text-align: right;">$ -</td>
                    <td style="text-align: right;">${formatCurrency(bill.amount)}</td>
                    <td style="text-align: right;">${formatCurrency(bill.amount)}</td>
                </tr>
                <tr class="item">
                    <td>INTERESES</td>
                    <td style="text-align: right;">$ -</td>
                    <td style="text-align: right;">$ -</td>
                    <td style="text-align: right;">$ -</td>
                </tr>
                <tr class="item">
                    <td>SALDO A FAVOR</td>
                    <td style="text-align: right;">$ -</td>
                    <td style="text-align: right;">$ -</td>
                    <td style="text-align: right;">$ -</td>
                </tr>
            </tbody>
        </table>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr class="total-row">
                <td style="text-align: right; padding: 8px;">PAGADO MES ANTERIOR</td>
                <td style="text-align: right; padding: 8px;">${formatCurrency(bill.amount)}</td>
                <td style="text-align: right; padding: 8px;">TOTAL A PAGAR</td>
                <td style="text-align: right; padding: 8px;">${formatCurrency(bill.amount)}</td>
            </tr>
        </table>
    </div>
    <div style="text-align: center; margin-top: 20px; border: 1px solid #ddd; padding: 10px;">
        <p style="margin: 0; font-weight: bold;">CONSIGNAR A LA CUENTA DE AHORRO BANCOLOMBIA No 100-426029-73</p>
        <p style="margin: 0; font-weight: bold;">A NOMBRE DE EDIFICIO BAHÍA ETAPA A</p>
    </div>
</div>
`;
    return receiptContent;
}

// --- COMENTARIO: Nueva función agregada para el envío de correos reales. ---
// --- Esta función se comunica con el servidor de backend (server.js). ---
async function enviarNotificacionFactura(residentId, concept, dueDate, amount) {
    try {
        // COMENTARIO: Obtiene los datos del residente desde la base de datos de Firebase.
        const residentDoc = await db.collection('residents').doc(residentId).get();
        if (!residentDoc.exists) {
            alert("Error: El residente no existe.");
            return;
        }
        const resident = residentDoc.data();
        if (!resident.email) {
            alert("Error: El residente no tiene un correo electrónico registrado.");
            return;
        }

        // COMENTARIO: Formatea la información de la factura para el cuerpo del correo.
        const formattedDueDate = new Date(dueDate).toLocaleDateString('es-CO');
        const formattedAmount = formatCurrency(amount);

        // COMENTARIO: Realiza una solicitud HTTP POST al servidor de backend.
        const response = await fetch('http://localhost:3000/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: resident.email,
                subject: `Nueva Factura del Edificio Bahia-A - Depto ${resident.depto}`,
                text: `Estimado/a ${resident.name},\n\nSe ha generado una nueva factura en su cuenta para el concepto de "${concept}".\n\nDetalles de la factura:\n- Concepto: ${concept}\n- Monto: ${formattedAmount}\n- Fecha de vencimiento: ${formattedDueDate}\n\nPor favor, ingrese al portal de residentes para ver el detalle completo y realizar el pago.\n\nSaludos cordiales,\nAdministración Edificio Bahia-A`
            })
        });

        // COMENTARIO: Manejo de la respuesta del servidor.
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'La respuesta del servidor no fue exitosa.');
        }

        const data = await response.json();
        console.log('Correo enviado con éxito:', data.message);
        alert('Correo de notificación enviado exitosamente.');

    } catch (error) {
        console.error('Error al enviar el email:', error);
        alert(`Error al enviar el correo: ${error.message}`);
    }
}
// ----------------------------------------------------
