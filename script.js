/ Hola!! si estas chismoseando el codigo :)
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHB9thJ0iy3c3c30k3ERCYvRoDQMM",
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
const showAddBillBtn = document = document.getElementById('show-add-bill-btn');
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
    // Para que muestre la fecha local correcta
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function parseCurrency(value) {
    if (typeof value !== 'string') return value;
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
}

function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    return value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
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
showChangePasswordBtn.addEventListener('click', () => toggleSection('change-credentials-form'));

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

// --- FUNCIÓN AÑADIDA PARA ENVIAR CORREO ---
async function sendEmail(recipientEmail, subject, body) {
    try {
        const response = await fetch('http://localhost:3000/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: recipientEmail,
                asunto: subject,
                cuerpo: body
            })
        });

        if (!response.ok) {
            throw new Error('La respuesta del servidor no fue exitosa.');
        }

        const data = await response.json();
        console.log('Correo enviado:', data.message);
        return true;

    } catch (error) {
        console.error('Error al enviar el email:', error);
        alert(`Error al enviar el email: ${error.message}`);
        return false;
    }
}
// --- FIN DE LA FUNCIÓN AÑADIDA ---

// Bill CRUD operations
billForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = billForm['bill-resident-id'].value;
    const dueDate = billForm['bill-due-date'].value;
    const amount = parseCurrency(billForm['bill-amount'].value);
    const concept = billForm['bill-concept'].value;
    const status = billForm['bill-status'].value;
    const paymentDate = billForm['bill-payment-date'].value;
    const paidAmount = parseCurrency(billForm['bill-paid-amount'].value) || 0; // Nuevo campo

    showSpinner();
    try {
        const localDueDate = new Date(dueDate);
        const localPaymentDate = paymentDate ? new Date(paymentDate) : null;

        await db.collection('bills').add({
            residentId,
            dueDate: firebase.firestore.Timestamp.fromDate(localDueDate),
            amount,
            concept,
            status,
            paymentDate: localPaymentDate ? firebase.firestore.Timestamp.fromDate(localPaymentDate) : null,
            paidAmount: paidAmount, // Nuevo campo en Firebase
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Factura agregada exitosamente.');
        billForm.reset();
        loadResidents();

        // --- CÓDIGO AÑADIDO PARA ENVIAR CORREO ---
        const residentDoc = await db.collection('residents').doc(residentId).get();
        if (residentDoc.exists) {
            const resident = residentDoc.data();
            const emailSubject = `Nueva Factura: ${concept}`;
            const emailBody = `Hola ${resident.name},\n\nSe ha generado una nueva factura en tu perfil por el concepto de ${concept} con un valor de ${formatCurrency(amount)}.\n\nPor favor, ingresa a tu perfil para verificar los detalles.\n\nSaludos cordiales,\nEdificio Bahía Etapa A`;
            await sendEmail(resident.email, emailSubject, emailBody);
        } else {
            console.error("No se encontró al residente para enviar la notificación.");
        }
        // --- FIN DEL CÓDIGO AÑADIDO ---

    } catch (err) {
        console.error("Error adding bill: ", err);
        alert('Error al agregar factura.');
    } finally {
        hideSpinner();
        toggleSection(null); // Ocultar todos los formularios
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
        const workbook = XLSX.read(data, {
            type: 'array'
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, {
            header: 1
        });

        const header = json[0];
        const rows = json.slice(1);

        const idIndex = header.indexOf('id_residente');
        const dueDateIndex = header.indexOf('fecha_vencimiento');
        const amountIndex = header.indexOf('monto');
        const statusIndex = header.indexOf('estado');
        const conceptIndex = header.indexOf('concepto');
        const paymentDateIndex = header.indexOf('fecha_pago');
        const paidAmountIndex = header.indexOf('monto_pagado'); // Nuevo índice

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
                    const paidAmount = row[paidAmountIndex] || 0; // Nuevo campo

                    batch.set(billRef, {
                        residentId: row[idIndex].toString(),
                        dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                        amount: parseFloat(row[amountIndex]),
                        concept: row[conceptIndex] || 'Sin concepto',
                        status: row[statusIndex] || 'Pendiente',
                        paymentDate: paymentDate ? firebase.firestore.Timestamp.fromDate(paymentDate) : null,
                        paidAmount: paidAmount, // Nuevo campo
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
            billHistoryTableBody.innerHTML = `<tr><td colspan="8">No se encontraron facturas para este residente.</td></tr>`;
        } else {
            billsSnapshot.forEach(doc => {
                const bill = doc.data();
                const row = billHistoryTableBody.insertRow();
                row.innerHTML = `
                    <td>${formatDate(bill.dueDate)}</td>
                    <td>${formatCurrency(bill.amount)}</td>
                    <td>${formatCurrency(bill.paidAmount || 0)}</td>
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
            let accumulatedCredit = 0;

            // FIX: Removida la cláusula orderBy y se ordenará en el cliente para evitar el error de índice
            const allBillsSnapshot = await db.collection('bills')
                .where('residentId', '==', bill.residentId)
                .get();

            const allBills = allBillsSnapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.seconds || 0
            }));
            allBills.sort((a, b) => a.createdAt - b.createdAt);

            allBills.forEach(prevBill => {
                if (prevBill.createdAt < bill.createdAt.seconds) {
                    if (prevBill.status === 'Pendiente') {
                        previousBalance += prevBill.amount;
                    } else if (prevBill.status === 'Pagada' && prevBill.paidAmount) {
                        const credit = prevBill.paidAmount - prevBill.amount;
                        if (credit > 0) {
                            accumulatedCredit += credit;
                        }
                    }
                }
            });

            // FIX: Lógica de cálculo corregida para el PDF
            const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
            if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
            }

            const isLate = (bill.status === 'Pendiente' && new Date() > dueDate) ||
                (bill.status === 'Pagada' && bill.paymentDate && new Date(bill.paymentDate.seconds * 1000) > dueDate);

            const multa = isLate ? bill.amount * 0.015 : 0;
            const totalDue = bill.amount + previousBalance + multa;
            const paidThisMonth = bill.paidAmount || 0;

            let finalAmount = totalDue - paidThisMonth;
            let currentCredit = 0;

            if (finalAmount < 0) {
                currentCredit = Math.abs(finalAmount);
                finalAmount = 0;
            }

            let saldoAFavorFinal = accumulatedCredit + currentCredit;

            const receiptContent = `
                <div style="font-family: 'Poppins', sans-serif; padding: 20px; color: #333; max-width: 700px; margin: auto; font-size: 12px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px;">
                                <div style="text-align: center;">
                                    <strong>EDIFICIO BAHÍA ETAPA A</strong><br>
                                    Nit 901048187-4<br>
                                    Carrera 65 no. 42-101 Teléfono 3104086837 - Medellín
                                </div>
                            </td>
                            <td style="border: 1px solid #000; padding: 10px; text-align: right;">
                                <img src="logo.png" alt="Logo" style="max-height: 50px;">
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>CUENTA DE COBRO No:</strong> <span style="font-size: 14px; font-weight: bold;">${billDoc.id.substring(0, 8)}</span><br>
                                <strong>REFERENCIA DE PAGO:</strong> <span style="font-size: 14px; font-weight: bold;">${resident.depto}</span>
                            </td>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>PERIODO DE FACTURACIÓN:</strong><br>
                                ${new Date().toLocaleDateString('es-CO', {
                                    month: 'long',
                                    year: 'numeric'
                                }).toUpperCase()}<br>
                                <strong>FECHA VENCIMIENTO:</strong> ${formatDate(bill.dueDate)}
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px;">
                                APTO: <span style="font-weight: bold;">${resident.depto}</span><br>
                                COPROPIETARIO: <span style="font-weight: bold;">${resident.name.toUpperCase()}</span>
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #000; width: 40%;">CONCEPTO</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">SALDO ANT</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">ESTE MES</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">A PAGAR</th>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">${bill.concept}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(previousBalance)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(bill.amount)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(previousBalance + bill.amount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">INTERESES</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">-</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(multa)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(multa)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">SALDO A FAVOR</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(saldoAFavorFinal)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(currentCredit)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">-</td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>PAGADO ESTE MES</strong>
                                <br>${formatCurrency(paidThisMonth)}
                            </td>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px; text-align: right; background-color: #f2f2f2;">
                                <strong>TOTAL A PAGAR</strong>
                                <br><span style="font-size: 14px; font-weight: bold;">${formatCurrency(finalAmount)}</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border: 1px solid #000; padding: 10px; text-align: center;">
                                CONSIGNAR A LA CUENTA DE AHORRO BANCOLOMBIA No 100-426029-73<br>
                                A NOMBRE DE EDIFICIO BAHÍA ETAPA A
                            </td>
                        </tr>
                    </table>
                </div>
            `;
            const options = {
                margin: 10,
                filename: `Recibo_${resident.depto}_${bill.concept}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
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

        // Corrección de la fecha:
        const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
        if (dueDate) {
            const localDueDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000);
            editBillForm['edit-bill-due-date'].value = localDueDate.toISOString().slice(0, 10);
        } else {
            editBillForm['edit-bill-due-date'].value = '';
        }

        editBillForm['edit-bill-amount'].value = bill.amount;
        editBillForm['edit-bill-concept'].value = bill.concept;
        editBillForm['edit-bill-status'].value = bill.status;

        // Nuevo campo en el modal
        editBillForm['edit-bill-paid-amount'].value = bill.paidAmount || '';

        // Corrección de la fecha de pago:
        const paymentDate = bill.paymentDate ? new Date(bill.paymentDate.seconds * 1000) : null;
        if (paymentDate) {
            const localPaymentDate = new Date(paymentDate.getTime() - paymentDate.getTimezoneOffset() * 60000);
            editBillForm['edit-bill-payment-date'].value = localPaymentDate.toISOString().slice(0, 10);
        } else {
            editBillForm['edit-bill-payment-date'].value = '';
        }

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
    const paidAmount = parseCurrency(editBillForm['edit-bill-paid-amount'].value) || 0;

    showSpinner();
    try {
        const localDueDate = new Date(dueDate);
        const localPaymentDate = paymentDate ? new Date(paymentDate) : null;

        await db.collection('bills').doc(billId).update({
            dueDate: firebase.firestore.Timestamp.fromDate(localDueDate),
            amount,
            concept,
            status,
            paymentDate: localPaymentDate ? firebase.firestore.Timestamp.fromDate(localPaymentDate) : null,
            paidAmount: paidAmount // Nuevo campo
        });
        alert('Factura actualizada exitosamente.');
        editBillModal.classList.remove('active');
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

// FIX: Event listener para el formulario de cambio de credenciales
changeCredentialsFormInner.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldUsername = changeCredentialsFormInner['old-username'].value;
    const oldPassword = changeCredentialsFormInner['old-password'].value;
    const newUsername = changeCredentialsFormInner['new-username'].value;
    const newPassword = changeCredentialsFormInner['new-password'].value;

    credentialsError.textContent = '';
    credentialsSuccess.textContent = '';

    if (!oldUsername || !oldPassword || !newUsername || !newPassword) {
        credentialsError.textContent = 'Por favor, completa todos los campos.';
        return;
    }

    if (newPassword === oldPassword) {
        credentialsError.textContent = 'La nueva contraseña debe ser diferente a la actual.';
        return;
    }

    showSpinner();
    try {
        const residentDoc = await db.collection('residents').doc(currentResidentId).get();
        if (!residentDoc.exists) {
            credentialsError.textContent = 'Error: Residente no encontrado.';
            hideSpinner();
            return;
        }

        const resident = residentDoc.data();
        if (resident.username === oldUsername && resident.password === oldPassword) {
            await db.collection('residents').doc(currentResidentId).update({
                username: newUsername,
                password: newPassword,
                credentialsChanged: true
            });
            credentialsSuccess.textContent = 'Credenciales actualizadas exitosamente.';
            changeCredentialsFormInner.reset();
        } else {
            credentialsError.textContent = 'Usuario o contraseña actuales incorrectos.';
        }
    } catch (err) {
        console.error("Error updating credentials:", err);
        credentialsError.textContent = 'Error al actualizar credenciales. Intenta de nuevo.';
    } finally {
        hideSpinner();
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
                // FIX: Agregadas las columnas de monto y fecha de pago para igualar la vista de admin
                row.innerHTML = `
                    <td>${bill.concept}</td>
                    <td>${formatCurrency(bill.amount)}</td>
                    <td>${formatCurrency(bill.paidAmount || 0)}</td>
                    <td>${formatDate(bill.dueDate)}</td>
                    <td>${formatDate(bill.paymentDate)}</td>
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
            let accumulatedCredit = 0;

            // FIX: Removida la cláusula orderBy y se ordenará en el cliente para evitar el error de índice
            const allBillsSnapshot = await db.collection('bills')
                .where('residentId', '==', bill.residentId)
                .get();

            const allBills = allBillsSnapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.seconds || 0
            }));
            allBills.sort((a, b) => a.createdAt - b.createdAt);

            allBills.forEach(prevBill => {
                if (prevBill.createdAt < bill.createdAt.seconds) {
                    if (prevBill.status === 'Pendiente') {
                        previousBalance += prevBill.amount;
                    } else if (prevBill.status === 'Pagada' && prevBill.paidAmount) {
                        const credit = prevBill.paidAmount - prevBill.amount;
                        if (credit > 0) {
                            accumulatedCredit += credit;
                        }
                    }
                }
            });

            // FIX: Lógica de cálculo corregida para el PDF
            const dueDate = bill.dueDate ? new Date(bill.dueDate.seconds * 1000) : null;
            if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
            }

            const isLate = (bill.status === 'Pendiente' && new Date() > dueDate) ||
                (bill.status === 'Pagada' && bill.paymentDate && new Date(bill.paymentDate.seconds * 1000) > dueDate);

            const multa = isLate ? bill.amount * 0.015 : 0;
            const totalDue = bill.amount + previousBalance + multa;
            const paidThisMonth = bill.paidAmount || 0;

            let finalAmount = totalDue - paidThisMonth;
            let currentCredit = 0;

            if (finalAmount < 0) {
                currentCredit = Math.abs(finalAmount);
                finalAmount = 0;
            }

            let saldoAFavorFinal = accumulatedCredit + currentCredit;

            const receiptContent = `
                <div style="font-family: 'Poppins', sans-serif; padding: 20px; color: #333; max-width: 700px; margin: auto; font-size: 12px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px;">
                                <div style="text-align: center;">
                                    <strong>EDIFICIO BAHÍA ETAPA A</strong><br>
                                    Nit 901048187-4<br>
                                    Carrera 65 no. 42-101 Teléfono 3104086837 - Medellín
                                </div>
                            </td>
                            <td style="border: 1px solid #000; padding: 10px; text-align: right;">
                                <img src="logo.png" alt="Logo" style="max-height: 50px;">
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>CUENTA DE COBRO No:</strong> <span style="font-size: 14px; font-weight: bold;">${billDoc.id.substring(0, 8)}</span><br>
                                <strong>REFERENCIA DE PAGO:</strong> <span style="font-size: 14px; font-weight: bold;">${resident.depto}</span>
                            </td>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>PERIODO DE FACTURACIÓN:</strong><br>
                                ${new Date().toLocaleDateString('es-CO', {
                                    month: 'long',
                                    year: 'numeric'
                                }).toUpperCase()}<br>
                                <strong>FECHA VENCIMIENTO:</strong> ${formatDate(bill.dueDate)}
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px;">
                                APTO: <span style="font-weight: bold;">${resident.depto}</span><br>
                                COPROPIETARIO: <span style="font-weight: bold;">${resident.name.toUpperCase()}</span>
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #000; width: 40%;">CONCEPTO</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">SALDO ANT</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">ESTE MES</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #000; width: 20%;">A PAGAR</th>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">${bill.concept}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(previousBalance)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(bill.amount)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(previousBalance + bill.amount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">INTERESES</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">-</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(multa)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(multa)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #000;">SALDO A FAVOR</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(saldoAFavorFinal)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(currentCredit)}</td>
                            <td style="padding: 8px; border: 1px solid #000; text-align: right;">-</td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px;">
                                <strong>PAGADO ESTE MES</strong>
                                <br>${formatCurrency(paidThisMonth)}
                            </td>
                            <td style="width: 50%; border: 1px solid #000; padding: 10px; text-align: right; background-color: #f2f2f2;">
                                <strong>TOTAL A PAGAR</strong>
                                <br><span style="font-size: 14px; font-weight: bold;">${formatCurrency(finalAmount)}</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border: 1px solid #000; padding: 10px; text-align: center;">
                                CONSIGNAR A LA CUENTA DE AHORRO BANCOLOMBIA No 100-426029-73<br>
                                A NOMBRE DE EDIFICIO BAHÍA ETAPA A
                            </td>
                        </tr>
                    </table>
                </div>
            `;
            const options = {
                margin: 10,
                filename: `Recibo_${resident.depto}_${bill.concept}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
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
