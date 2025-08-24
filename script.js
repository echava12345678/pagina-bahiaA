// Hola!! si estas chismoseando el codigo :)
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHBV9thJ0iy3c3c30k3ERCYvRoDQMM",
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
const billHistoryModal = document.getElementById('bill-history-modal');
const billHistoryTableBody = document.querySelector('#bill-history-table tbody');
const modalTitle = document.getElementById('modal-title');
const editBillModal = document.getElementById('edit-bill-modal');
const editBillForm = document.getElementById('edit-bill-form');
const residentSearch = document.getElementById('resident-search');
const excelFile = document.getElementById('excel-file');
const showAddResidentBtn = document.getElementById('show-add-resident-btn');
const showAddBillBtn = document.getElementById('show-add-bill-btn');
const showUploadBillsBtn = document.getElementById('show-upload-bills-btn');
const addResidentFormSection = document.getElementById('add-resident-form');
const addBillFormSection = document.getElementById('add-bill-form');
const uploadBillsSection = document.getElementById('upload-bills-section');
const changeCredentialsForm = document.getElementById('change-credentials-form');
const changeCredentialsFormInner = document.getElementById('change-credentials-form-inner');
const showChangePasswordBtn = document.getElementById('show-change-password-form');
const credentialsError = document.getElementById('credentials-error');
const credentialsSuccess = document.getElementById('credentials-success');
const loadingSpinner = document.getElementById('loading-spinner');

// Global variables
let currentResidentId = null;

// --- Utility Functions ---

function showPage(page) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    page.classList.add('active');
}

function showSpinner() {
    loadingSpinner.style.display = 'flex';
}

function hideSpinner() {
    loadingSpinner.style.display = 'none';
}

// Función para mostrar/ocultar secciones de formularios
function toggleSection(sectionIdToShow) {
    const sections = [addResidentFormSection, addBillFormSection, uploadBillsSection, changeCredentialsForm];
    sections.forEach(section => {
        if (section && section.id === sectionIdToShow) {
            section.classList.toggle('hidden');
        } else if (section) {
            section.classList.add('hidden');
        }
    });
}

function formatDate(timestamp) {
    if (!timestamp || !timestamp.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-CO');
}

function parseCurrency(value) {
    if (typeof value !== 'string') return value;
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
}

function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- Login & Authentication ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm['username-login'].value;
    const password = loginForm['password-login'].value;
    loginError.textContent = '';
    showSpinner();

    try {
        if (username === 'admin' && password === 'admin123') { // Simple admin check
            showPage(adminPanel);
            loadResidents();
            auth.signInWithEmailAndPassword('admin@edificio.com', password) // Use a static email for Firebase auth
                .catch(err => console.error("Admin Auth Error:", err));
        } else {
            const residentSnapshot = await db.collection('residents').where('username', '==', username).limit(1).get();
            if (!residentSnapshot.empty) {
                const resident = residentSnapshot.docs[0].data();
                const residentId = residentSnapshot.docs[0].id;

                if (resident.password === password) {
                    showPage(residentPanel);
                    residentWelcome.textContent = `Bienvenido, ${resident.name}`;
                    currentResidentId = residentId;
                    loadResidentBills(currentResidentId);
                } else {
                    loginError.textContent = 'Contraseña incorrecta.';
                }
            } else {
                loginError.textContent = 'Usuario no encontrado.';
            }
        }
    } catch (err) {
        console.error("Login Error:", err);
        loginError.textContent = 'Error al iniciar sesión. Intenta de nuevo.';
    } finally {
        hideSpinner();
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
    showPage(loginPage);
});

residentLogoutBtn.addEventListener('click', () => {
    auth.signOut();
    showPage(loginPage);
});

// --- Admin Panel Functions ---

// Event listeners para mostrar formularios
showAddResidentBtn.addEventListener('click', () => toggleSection('add-resident-form'));
showAddBillBtn.addEventListener('click', () => toggleSection('add-bill-form'));
showUploadBillsBtn.addEventListener('click', () => toggleSection('upload-bills-section'));

// Resident CRUD operations
residentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = residentForm['resident-id'].value;
    const name = residentForm['resident-name'].value;
    const depto = residentForm['resident-depto'].value;
    const username = residentForm['resident-username'].value;
    const password = residentForm['resident-password'].value;

    showSpinner();
    try {
        await db.collection('residents').doc(residentId).set({
            name,
            depto,
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
        toggleSection(null); // Ocultar todos los formularios
    }
});

// Load and display residents
async function loadResidents() {
    showSpinner();
    residentsTableBody.innerHTML = '';
    try {
        const snapshot = await db.collection('residents').get();
        snapshot.forEach(doc => {
            const resident = doc.data();
            const row = residentsTableBody.insertRow();
            row.dataset.id = doc.id;
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${resident.name}</td>
                <td>${resident.depto}</td>
                <td>${resident.username}</td>
                <td>
                    <button class="btn primary-btn view-bills-btn" data-id="${doc.id}">
                        <i class="fas fa-eye"></i> Ver Facturas
                    </button>
                    <button class="btn logout-btn delete-resident-btn" data-id="${doc.id}">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            `;
        });
    } catch (err) {
        console.error("Error loading residents:", err);
        alert('Error al cargar residentes.');
    } finally {
        hideSpinner();
    }
}

// Handle resident actions (view bills, delete resident)
residentsTableBody.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-bills-btn');
    const deleteBtn = e.target.closest('.delete-resident-btn');

    if (viewBtn) {
        const residentId = viewBtn.dataset.id;
        currentResidentId = residentId; // Store the current resident's ID
        showBillHistory(residentId);
    } else if (deleteBtn) {
        const residentId = deleteBtn.dataset.id;
        if (confirm('¿Estás seguro de que quieres eliminar a este residente y todas sus facturas?')) {
            deleteResident(residentId);
        }
    }
});

// New function to delete a resident and their bills
async function deleteResident(residentId) {
    showSpinner();
    try {
        // 1. Eliminar todas las facturas del residente
        const billsSnapshot = await db.collection('bills').where('residentId', '==', residentId).get();
        const batch = db.batch();
        billsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 2. Eliminar el documento del residente
        await db.collection('residents').doc(residentId).delete();

        alert('Residente y sus facturas eliminados exitosamente.');
        loadResidents(); // Recargar la tabla
    } catch (err) {
        console.error("Error deleting resident:", err);
        alert('Error al eliminar residente.');
    } finally {
        hideSpinner();
    }
}

// Search functionality
residentSearch.addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const rows = residentsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const id = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const depto = row.cells[2].textContent.toLowerCase();
        if (id.includes(filter) || name.includes(filter) || depto.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Bill CRUD operations
billForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = billForm['bill-resident-id'].value;
    const dueDate = billForm['bill-due-date'].value;
    const amount = parseCurrency(billForm['bill-amount'].value);
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
        loadResidents();
    } catch (err) {
        console.error("Error adding bill: ", err);
        alert('Error al agregar factura.');
    } finally {
        hideSpinner();
        toggleSection(null);
    }
});

// Handle Excel file upload
excelFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showSpinner();

    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const header = json[0];
        const rows = json.slice(1);

        const idIndex = header.indexOf('id_residente');
        const dueDateIndex = header.indexOf('fecha_vencimiento');
        const amountIndex = header.indexOf('monto');
        const statusIndex = header.indexOf('estado');
        const conceptIndex = header.indexOf('concepto');
        const paymentDateIndex = header.indexOf('fecha_pago');

        if (idIndex === -1 || dueDateIndex === -1 || amountIndex === -1) {
            alert('El archivo Excel debe contener las columnas: id_residente, fecha_vencimiento, monto.');
            hideSpinner();
            return;
        }

        try {
            const batch = db.batch();
            for (const row of rows) {
                if (row[idIndex]) {
                    const billRef = db.collection('bills').doc();
                    const dueDate = new Date((row[dueDateIndex] - (25567 + 1)) * 86400 * 1000); // Excel date to JS Date
                    const paymentDate = row[paymentDateIndex] ? new Date((row[paymentDateIndex] - (25567 + 1)) * 86400 * 1000) : null;
                    
                    batch.set(billRef, {
                        residentId: row[idIndex].toString(),
                        dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                        amount: parseFloat(row[amountIndex]),
                        concept: row[conceptIndex] || 'Sin concepto',
                        status: row[statusIndex] || 'Pendiente',
                        paymentDate: paymentDate ? firebase.firestore.Timestamp.fromDate(paymentDate) : null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            await batch.commit();
            alert('Facturas cargadas exitosamente desde Excel.');
            loadResidents();
        } catch (error) {
            console.error('Error al procesar el archivo Excel:', error);
            alert('Error al cargar las facturas. Verifica el formato del archivo.');
        } finally {
            hideSpinner();
            toggleSection(null);
        }
    };
    reader.readAsArrayBuffer(file);
});


// Load bill history for a specific resident
async function showBillHistory(residentId) {
    showSpinner();
    billHistoryTableBody.innerHTML = '';
    try {
        const residentDoc = await db.collection('residents').doc(residentId).get();
        const resident = residentDoc.data();
        modalTitle.textContent = `Facturas de ${resident.name} (Depto: ${resident.depto})`;
        const billsSnapshot = await db.collection('bills').where('residentId', '==', residentId).get();
        if (billsSnapshot.empty) {
            billHistoryTableBody.innerHTML = `<tr><td colspan="7">No se encontraron facturas para este residente.</td></tr>`;
        } else {
            billsSnapshot.forEach(doc => {
                const bill = doc.data();
                const row = billHistoryTableBody.insertRow();
                row.innerHTML = `
                    <td>${formatDate(bill.dueDate)}</td>
                    <td>${formatCurrency(bill.amount)}</td>
                    <td>${bill.concept}</td>
                    <td class="status-${bill.status.toLowerCase().replace(' ', '-')}">${bill.status}</td>
                    <td>${formatDate(bill.paymentDate)}</td>
                    <td>
                        <button class="btn secondary-btn edit-bill-btn" data-id="${doc.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn logout-btn delete-bill-btn" data-id="${doc.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                    <td>
                        <button class="btn primary-btn download-receipt-btn" data-id="${doc.id}">
                            <i class="fas fa-file-download"></i>
                        </button>
                    </td>
                `;
            });
        }
        billHistoryModal.classList.add('active');
    } catch (err) {
        console.error("Error loading bills:", err);
        alert('Error al cargar el historial de facturas.');
    } finally {
        hideSpinner();
    }
}

// Edit and Delete bills from modal
billHistoryModal.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-bill-btn');
    const deleteBtn = e.target.closest('.delete-bill-btn');
    const downloadBtn = e.target.closest('.download-receipt-btn');

    if (editBtn) {
        const billId = editBtn.dataset.id;
        showEditBillModal(billId);
    } else if (deleteBtn) {
        const billId = deleteBtn.dataset.id;
        if (confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
            showSpinner();
            try {
                await db.collection('bills').doc(billId).delete();
                alert('Factura eliminada.');
                if (currentResidentId) {
                    showBillHistory(currentResidentId);
                }
            } catch (err) {
                console.error("Error deleting bill:", err);
                alert('Error al eliminar factura.');
            } finally {
                hideSpinner();
            }
        }
    } else if (downloadBtn) {
        const billId = downloadBtn.dataset.id;
        showSpinner();
        try {
            const billDoc = await db.collection('bills').doc(billId).get();
            const bill = billDoc.data();
            const residentDoc = await db.collection('residents').doc(bill.residentId).get();
            const resident = residentDoc.data();

            let previousBalance = 0;
            // CORRECCIÓN: Se añade esta verificación para evitar el error
            if (bill.dueDate && bill.dueDate instanceof firebase.firestore.Timestamp) {
                const previousBillsSnapshot = await db.collection('bills')
                    .where('residentId', '==', bill.residentId)
                    .where('status', '==', 'Pendiente')
                    .where('dueDate', '<', bill.dueDate)
                    .get();

                previousBillsSnapshot.forEach(doc => {
                    const prevBill = doc.data();
                    previousBalance += prevBill.amount;
                });
            }

            const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
            if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
            }
            const isLate = (bill.status === 'Pendiente' && new Date() > dueDate) ||
                         (bill.status === 'Pagada' && bill.paymentDate && new Date(bill.paymentDate.seconds * 1000) > dueDate);
            const multa = isLate ? bill.amount * 0.10 : 0;
            const finalAmount = bill.amount + previousBalance + multa;
            const receiptContent = `
                <div style="font-family: 'Poppins', sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; border-bottom: 2px solid #4A90E2; padding-bottom: 20px; margin-bottom: 20px;">
                        <h1 style="color: #4A90E2; font-size: 24px; margin: 0;"><i class="fas fa-building" style="margin-right: 10px;"></i>RECIBO DE PAGO</h1>
                        <p style="font-size: 14px; color: #777;">Gestión de Edificio</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                            <p><strong>Recibo No.:</strong> ${billDoc.id.substring(0, 8)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Residente:</strong> ${resident.name}</p>
                            <p><strong>Departamento:</strong> ${resident.depto}</p>
                        </div>
                    </div>
                    <h2 style="font-size: 18px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">Detalles de la Factura</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Concepto</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Monto</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Fecha Venc.</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${bill.concept}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(bill.amount)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(bill.dueDate)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${bill.status}</td>
                            </tr>
                        </tbody>
                    </table>
                    ${isLate ? `
                        <p style="color: #F39C12; font-weight: 600;">¡Atención! La fecha de vencimiento ha pasado. Se ha aplicado una multa.</p>
                        <ul style="list-style: none; padding: 0; margin-top: 15px;">
                            <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ddd;">
                                <span>Monto de la Factura:</span>
                                <span>${formatCurrency(bill.amount)}</span>
                            </li>
                            <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ddd;">
                                <span>Multa (10%):</span>
                                <span>${formatCurrency(multa)}</span>
                            </li>
                        </ul>
                    ` : ''}
                    <div style="background-color: #eaf3ff; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right;">
                        <h3 style="margin: 0; font-size: 20px; color: #4A90E2;">TOTAL A PAGAR</h3>
                        <p style="font-size: 28px; font-weight: 700; color: #4A90E2; margin: 5px 0;">${formatCurrency(finalAmount)}</p>
                        <p style="font-size: 14px; color: #777; margin-top: 10px;">
                            ${bill.status === 'Pagada' ? `<strong>Fecha de Pago:</strong> ${formatDate(bill.paymentDate)}` : ''}
                        </p>
                    </div>
                    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p style="font-size: 12px; color: #aaa;">Gracias por tu pago. Para cualquier consulta, contacta con la administración.</p>
                        <p style="font-size: 12px; color: #aaa;">Generado por el sistema de gestión del edificio el ${new Date().toLocaleDateString('es-CO')}</p>
                    </div>
                </div>
            `;
            const options = {
                margin: 10,
                filename: `Recibo_${resident.depto}_${bill.concept}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().from(receiptContent).set(options).save();
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert('Error al generar el recibo.');
        } finally {
            hideSpinner();
        }
    }
});

async function showEditBillModal(billId) {
    showSpinner();
    try {
        const billDoc = await db.collection('bills').doc(billId).get();
        const bill = billDoc.data();
        editBillForm['edit-bill-id'].value = billId;
        editBillForm['edit-bill-due-date'].value = bill.dueDate ? new Date(bill.dueDate.seconds * 1000).toISOString().slice(0, 10) : '';
        editBillForm['edit-bill-amount'].value = bill.amount;
        editBillForm['edit-bill-concept'].value = bill.concept;
        editBillForm['edit-bill-status'].value = bill.status;
        editBillForm['edit-bill-payment-date'].value = bill.status === 'Pagada' && bill.paymentDate ? new Date(bill.paymentDate.seconds * 1000).toISOString().slice(0, 10) : '';
        
        billHistoryModal.classList.remove('active');
        editBillModal.classList.add('active');
    } catch (err) {
        console.error("Error loading bill for edit:", err);
        alert('Error al cargar los datos de la factura.');
    } finally {
        hideSpinner();
    }
}

editBillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const billId = editBillForm['edit-bill-id'].value;
    const dueDate = editBillForm['edit-bill-due-date'].value;
    const amount = parseFloat(editBillForm['edit-bill-amount'].value);
    const concept = editBillForm['edit-bill-concept'].value;
    const status = editBillForm['edit-bill-status'].value;
    const paymentDate = editBillForm['edit-bill-payment-date'].value;

    showSpinner();
    try {
        await db.collection('bills').doc(billId).update({
            dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
            amount,
            concept,
            status,
            paymentDate: paymentDate ? firebase.firestore.Timestamp.fromDate(new Date(paymentDate)) : null,
        });
        alert('Factura actualizada exitosamente.');
        editBillModal.classList.remove('active');
        if (currentResidentId) {
            showBillHistory(currentResidentId);
        }
    } catch (err) {
        console.error("Error updating bill:", err);
        alert('Error al actualizar factura.');
    } finally {
        hideSpinner();
    }
});


// --- Solución del Cierre de Modales: Delegación de Eventos ---
// Un solo listener que maneja todos los cierres y cancelaciones.
document.body.addEventListener('click', (e) => {
    // Cierra cualquier modal si el clic fue en un botón con la clase .close-btn
    const closeBtn = e.target.closest('.close-btn');
    if (closeBtn) {
        const modal = closeBtn.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            // Si el modal de edición se cierra, muestra el de historial nuevamente
            if (modal.id === 'edit-bill-modal' && currentResidentId) {
                showBillHistory(currentResidentId);
            }
        }
    }
});

// --- Resident Panel Functions ---

async function loadResidentBills(residentId) {
    showSpinner();
    residentBillsTableBody.innerHTML = '';
    try {
        const billsSnapshot = await db.collection('bills').where('residentId', '==', residentId).get();
        if (billsSnapshot.empty) {
            residentBillsTableBody.innerHTML = `<tr><td colspan="5">No se encontraron facturas pendientes.</td></tr>`;
        } else {
            billsSnapshot.forEach(doc => {
                const bill = doc.data();
                const today = new Date();
                // Normaliza la fecha de vencimiento a solo día, mes y año
                const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
                if (dueDate) {
                    dueDate.setHours(0, 0, 0, 0);
                }
                const isLate = dueDate && bill.status === 'Pendiente' && today > dueDate;
                
                const row = residentBillsTableBody.insertRow();
                row.dataset.id = doc.id;
                row.innerHTML = `
                    <td>${bill.concept}</td>
                    <td>${formatCurrency(bill.amount)}</td>
                    <td>${formatDate(bill.dueDate)}</td>
                    <td class="status-${bill.status.toLowerCase()} ${isLate ? 'status-multa' : ''}">${bill.status} ${isLate ? '(Multa)' : ''}</td>
                    <td>
                        <button class="btn primary-btn download-receipt-btn" data-id="${doc.id}">
                            <i class="fas fa-file-download"></i> Descargar Recibo
                        </button>
                    </td>
                `;
            });
        }
    } catch (err) {
        console.error("Error loading resident bills:", err);
        alert('Error al cargar sus facturas.');
    } finally {
        hideSpinner();
    }
}

// Download receipt as PDF
residentBillsTableBody.addEventListener('click', async (e) => {
    const downloadBtn = e.target.closest('.download-receipt-btn');
    if (downloadBtn) {
        const billId = downloadBtn.dataset.id;
        showSpinner();
        try {
            const billDoc = await db.collection('bills').doc(billId).get();
            const bill = billDoc.data();
            const residentDoc = await db.collection('residents').doc(bill.residentId).get();
            const resident = residentDoc.data();

            let previousBalance = 0;
            // CORRECCIÓN: Se añade una verificación más robusta para evitar el error
            if (bill.dueDate && bill.dueDate instanceof firebase.firestore.Timestamp) {
                const previousBillsSnapshot = await db.collection('bills')
                    .where('residentId', '==', bill.residentId)
                    .where('status', '==', 'Pendiente')
                    .where('dueDate', '<', bill.dueDate)
                    .get();

                previousBillsSnapshot.forEach(doc => {
                    const prevBill = doc.data();
                    previousBalance += prevBill.amount;
                });
            }

            const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
            if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
            }

            const isLate = (bill.status === 'Pendiente' && new Date() > dueDate) || 
                           (bill.status === 'Pagada' && bill.paymentDate && new Date(bill.paymentDate.seconds * 1000) > dueDate);
            
            const multa = isLate ? bill.amount * 0.10 : 0; // 10% late fee
            const finalAmount = bill.amount + previousBalance + multa;
            
            const receiptContent = `
                <div style="font-family: 'Poppins', sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; border-bottom: 2px solid #4A90E2; padding-bottom: 20px; margin-bottom: 20px;">
                        <h1 style="color: #4A90E2; font-size: 24px; margin: 0;"><i class="fas fa-building" style="margin-right: 10px;"></i>RECIBO DE PAGO</h1>
                        <p style="font-size: 14px; color: #777;">Gestión de Edificio</p>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                            <p><strong>Recibo No.:</strong> ${billDoc.id.substring(0, 8)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Residente:</strong> ${resident.name}</p>
                            <p><strong>Departamento:</strong> ${resident.depto}</p>
                        </div>
                    </div>

                    <h2 style="font-size: 18px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">Detalles de la Factura</h2>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Concepto</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Monto</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Fecha Venc.</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${bill.concept}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(bill.amount)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(bill.dueDate)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${bill.status}</td>
                            </tr>
                        </tbody>
                    </table>

                    ${isLate ? `
                        <p style="color: #F39C12; font-weight: 600;">¡Atención! La fecha de vencimiento ha pasado. Se ha aplicado una multa.</p>
                        <ul style="list-style: none; padding: 0; margin-top: 15px;">
                            <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ddd;">
                                <span>Monto de la Factura:</span>
                                <span>${formatCurrency(bill.amount)}</span>
                            </li>
                            <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ddd;">
                                <span>Multa (10%):</span>
                                <span>${formatCurrency(multa)}</span>
                            </li>
                        </ul>
                    ` : ''}

                    <div style="background-color: #eaf3ff; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right;">
                        <h3 style="margin: 0; font-size: 20px; color: #4A90E2;">TOTAL A PAGAR</h3>
                        <p style="font-size: 28px; font-weight: 700; color: #4A90E2; margin: 5px 0;">${formatCurrency(finalAmount)}</p>
                        <p style="font-size: 14px; color: #777; margin-top: 10px;">
                            ${bill.status === 'Pagada' ? `<strong>Fecha de Pago:</strong> ${formatDate(bill.paymentDate)}` : ''}
                        </p>
                    </div>

                    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p style="font-size: 12px; color: #aaa;">Gracias por tu pago. Para cualquier consulta, contacta con la administración.</p>
                        <p style="font-size: 12px; color: #aaa;">Generado por el sistema de gestión del edificio el ${new Date().toLocaleDateString('es-CO')}</p>
                    </div>
                </div>
            `;

            const options = {
                margin: 10,
                filename: `Recibo_${resident.depto}_${bill.concept}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(receiptContent).set(options).save();
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert('Error al generar el recibo.');
        } finally {
            hideSpinner();
        }
    }
});

// Change resident credentials
showChangePasswordBtn.addEventListener('click', () => {
    credentialsError.textContent = '';
    credentialsSuccess.textContent = '';
    toggleSection('change-credentials-form');
});

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
