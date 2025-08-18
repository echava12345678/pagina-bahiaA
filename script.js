// Importa las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHBV9thJ0iy3c30k3ERCYvRoDQMM",
    authDomain: "bahiaa.firebaseapp.com",
    projectId: "bahiaa",
    storageBucket: "bahiaa.firebasestorage.app",
    messagingSenderId: "212926382954",
    appId: "1:212926382954:web:526bfab6d7c29ee20c1b13",
    measurementId: "G-C3DWGGH4KY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configurar la persistencia de la sesión en el navegador
setPersistence(auth, browserSessionPersistence);

// Referencias a los elementos del DOM
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const adminPanel = document.getElementById('admin-panel');
const residentPanel = document.getElementById('resident-panel');
const logoutBtn = document.getElementById('logout-btn');
const invoicesTable = document.getElementById('invoices-table');
const residentInvoicesTable = document.getElementById('resident-invoices-table');
const addInvoiceBtn = document.getElementById('add-invoice-btn');
const invoiceForm = document.getElementById('invoice-form');
const cancelInvoiceBtn = document.getElementById('cancel-invoice-btn');
const excelUpload = document.getElementById('excel-upload');
const changePassBtn = document.getElementById('change-pass-btn');
const changePassCard = document.querySelector('.change-pass-card');
const changePassForm = document.getElementById('change-pass-form');
const passErrorMessage = document.getElementById('pass-error-message');
const cancelPassChangeBtn = document.getElementById('cancel-pass-change');
const residentUsernameSpan = document.getElementById('res-username');
const residentDeptoSpan = document.getElementById('res-depto');
const receiptModal = document.getElementById('receipt-modal');
const receiptDetailsDiv = document.getElementById('receipt-details');
const downloadReceiptBtn = document.getElementById('download-receipt-btn');
const closeModalBtn = document.querySelector('.close-btn');
const loader = document.getElementById('loader');

// Variables globales para la sesión del usuario
let currentUser;
let isUserAdmin = false;

// Oculta el loader al cargar la página
window.addEventListener('load', () => {
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);
});

// Maneja el estado de la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            isUserAdmin = userDoc.data().role === 'admin';
            displayDashboard(isUserAdmin, userDoc.data());
        } else {
            // Si el usuario existe en Auth pero no en Firestore, cerrar sesión para evitar errores
            console.error("No se encontraron datos de usuario en Firestore.");
            signOut(auth);
            displayLogin();
        }
    } else {
        displayLogin();
    }
});

// Función para mostrar la vista de login
function displayLogin() {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    errorMessage.textContent = '';
    loginForm.reset();
}

// Función para mostrar el dashboard según el rol
async function displayDashboard(isAdmin, userData) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    if (isAdmin) {
        adminPanel.classList.remove('hidden');
        residentPanel.classList.add('hidden');
        await loadAdminInvoices();
    } else {
        adminPanel.classList.add('hidden');
        residentPanel.classList.remove('hidden');
        residentUsernameSpan.textContent = userData.username;
        residentDeptoSpan.textContent = userData.depto;
        await loadResidentInvoices(userData.resId);
    }
}

// Lógica de inicio de sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    errorMessage.textContent = '';
    
    // Primero, intentar iniciar sesión como administrador
    if (username === 'admin@bahia.com' && password === 'admin123') {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, username, password);
            const userDocRef = doc(db, "users", userCredential.user.uid);
            await setDoc(userDocRef, { role: 'admin' }, { merge: true }); // Usar setDoc con merge para no sobrescribir datos
        } catch (error) {
            errorMessage.textContent = 'Error al iniciar sesión como admin. Verifique las credenciales.';
            console.error("Error de login de admin:", error);
        }
        return;
    }

    // Si no es admin, buscar en la base de datos de facturas para un residente
    const q = query(collection(db, "invoices"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        errorMessage.textContent = 'Usuario o contraseña incorrectos.';
        return;
    }

    const userData = querySnapshot.docs[0].data();
    
    if (password !== userData.password) {
        errorMessage.textContent = 'Usuario o contraseña incorrectos.';
        return;
    }

    // Autenticar al residente con el correo temporal
    const userEmail = `${username}@temp.com`;
    try {
        await signInWithEmailAndPassword(auth, userEmail, password);
    } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
            const userCredential = await auth.createUserWithEmailAndPassword(userEmail, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                role: 'resident',
                resId: userData.resId,
                depto: userData.depto,
                username: userData.username,
                invoiceId: querySnapshot.docs[0].id
            });
        } else {
            errorMessage.textContent = 'Error al iniciar sesión. Intente de nuevo.';
            console.error("Error de autenticación:", authError);
        }
    }
});

// Lógica de cierre de sesión
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});

// --- Funciones para el Panel de Administrador ---

async function loadAdminInvoices() {
    const invoicesCol = collection(db, "invoices");
    const snapshot = await getDocs(invoicesCol);
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAdminTable(invoices);
}

function renderAdminTable(invoices) {
    const tbody = invoicesTable.querySelector('tbody');
    tbody.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.resId}</td>
            <td>${invoice.name}</td>
            <td>${invoice.depto}</td>
            <td>${invoice.username}</td>
            <td>$${formatCurrency(invoice.amount)}</td>
            <td>${invoice.invoiceDate}</td>
            <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
            <td>${invoice.concept}</td>
            <td class="table-actions">
                <button class="btn primary-btn view-btn" data-id="${invoice.id}">Ver</button>
                <button class="btn secondary-btn edit-btn" data-id="${invoice.id}">Editar</button>
                <button class="btn tertiary-btn delete-btn" data-id="${invoice.id}">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

invoicesTable.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('delete-btn')) {
        if (confirm('¿Está seguro de que desea eliminar esta factura?')) {
            await deleteDoc(doc(db, "invoices", id));
            loadAdminInvoices();
        }
    } else if (e.target.classList.contains('edit-btn')) {
        await editInvoice(id);
    } else if (e.target.classList.contains('view-btn')) {
        await viewReceipt(id);
    }
});

addInvoiceBtn.addEventListener('click', () => {
    invoiceForm.classList.remove('hidden');
    invoiceForm.reset();
    invoiceForm.querySelector('#invoice-is-new').value = 'true';
    invoiceForm.querySelector('#invoice-pass').disabled = false;
});

cancelInvoiceBtn.addEventListener('click', () => {
    invoiceForm.classList.add('hidden');
});

async function editInvoice(id) {
    const docRef = doc(db, "invoices", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        invoiceForm.querySelector('#invoice-id').value = id;
        invoiceForm.querySelector('#invoice-is-new').value = 'false';
        invoiceForm.querySelector('#invoice-res-id').value = data.resId;
        invoiceForm.querySelector('#invoice-name').value = data.name;
        invoiceForm.querySelector('#invoice-depto').value = data.depto;
        invoiceForm.querySelector('#invoice-user').value = data.username;
        invoiceForm.querySelector('#invoice-pass').value = data.password;
        invoiceForm.querySelector('#invoice-pass').disabled = true;
        invoiceForm.querySelector('#invoice-date').value = data.invoiceDate;
        invoiceForm.querySelector('#invoice-amount').value = data.amount;
        invoiceForm.querySelector('#invoice-status').value = data.status;
        invoiceForm.querySelector('#invoice-concept').value = data.concept;
        invoiceForm.querySelector('#invoice-payment-date').value = data.paymentDate || '';
        invoiceForm.classList.remove('hidden');
    }
}

invoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isNew = invoiceForm.querySelector('#invoice-is-new').value === 'true';
    const id = invoiceForm.querySelector('#invoice-id').value;
    const invoiceData = {
        resId: invoiceForm.querySelector('#invoice-res-id').value,
        name: invoiceForm.querySelector('#invoice-name').value,
        depto: invoiceForm.querySelector('#invoice-depto').value,
        username: invoiceForm.querySelector('#invoice-user').value,
        password: invoiceForm.querySelector('#invoice-pass').value,
        invoiceDate: invoiceForm.querySelector('#invoice-date').value,
        amount: parseFloat(invoiceForm.querySelector('#invoice-amount').value.replace(/\./g, '')),
        status: invoiceForm.querySelector('#invoice-status').value,
        concept: invoiceForm.querySelector('#invoice-concept').value,
        paymentDate: invoiceForm.querySelector('#invoice-payment-date').value || null
    };

    if (isNew) {
        await addDoc(collection(db, "invoices"), invoiceData);
    } else {
        await updateDoc(doc(db, "invoices", id), invoiceData);
    }

    invoiceForm.classList.add('hidden');
    loadAdminInvoices();
});

// Lógica para subir Excel
excelUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            for (const row of json) {
                const invoiceData = {
                    resId: row['ID Residente'],
                    name: row['Nombre'],
                    depto: row['Depto'],
                    username: row['Usuario'],
                    password: row['Contraseña'],
                    invoiceDate: formatDate(row['Fecha Vencimiento']),
                    amount: parseFloat(String(row['Monto Factura']).replace(/\./g, '')),
                    status: row['Estado Factura'],
                    concept: row['Concepto Factura'],
                    paymentDate: formatDate(row['Fecha de Pago'])
                };
                await addDoc(collection(db, "invoices"), invoiceData);
            }
            alert('Datos del Excel subidos correctamente.');
            loadAdminInvoices();
        };
        reader.readAsArrayBuffer(file);
    }
});

// --- Funciones para el Panel de Residente ---

async function loadResidentInvoices(resId) {
    const q = query(collection(db, "invoices"), where("resId", "==", resId));
    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderResidentTable(invoices);
}

function renderResidentTable(invoices) {
    const tbody = residentInvoicesTable.querySelector('tbody');
    tbody.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.concept}</td>
            <td>$${formatCurrency(invoice.amount)}</td>
            <td>${invoice.invoiceDate}</td>
            <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
            <td>
                <button class="btn primary-btn view-btn" data-id="${invoice.id}">Ver Recibo</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

residentInvoicesTable.addEventListener('click', async (e) => {
    if (e.target.classList.contains('view-btn')) {
        const id = e.target.dataset.id;
        await viewReceipt(id);
    }
});

// --- Funciones para el Recibo PDF y Modal ---

async function viewReceipt(id) {
    const docRef = doc(db, "invoices", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const today = new Date();
        const invoiceDate = new Date(data.invoiceDate);
        let multa = 0;
        
        if (data.status === 'Pendiente' && today > invoiceDate) {
            multa = Math.round(data.amount * 0.05);
        }

        const totalAmount = data.amount + multa;
        const statusText = data.status === 'Pagada' ? `Pagado el ${data.paymentDate}` : (multa > 0 ? `Vencido con Multa` : `Pendiente`);

        receiptDetailsDiv.innerHTML = `
            <div class="receipt-header">
                <img src="logo bahia a.png" alt="Logo Bahía A" class="logo-receipt">
                <h4>Recibo de Pago</h4>
            </div>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Recibo No:</strong> #${id.substring(0, 8).toUpperCase()}</p>
            <hr>
            <h5>Detalles del Residente</h5>
            <p><strong>Nombre:</strong> ${data.name}</p>
            <p><strong>Departamento:</strong> ${data.depto}</p>
            <p><strong>ID Residente:</strong> ${data.resId}</p>
            <hr>
            <h5>Detalles de la Factura</h5>
            <p><strong>Concepto:</strong> ${data.concept}</p>
            <p><strong>Monto Original:</strong> $${formatCurrency(data.amount)}</p>
            ${multa > 0 ? `<p class="receipt-multa"><strong>Multa por Mora (5%):</strong> $${formatCurrency(multa)}</p>` : ''}
            <p><strong>Fecha de Vencimiento:</strong> ${data.invoiceDate}</p>
            <hr>
            <p><strong>Estado:</strong> <span class="status-badge status-${data.status}">${statusText}</span></p>
            <p class="receipt-amount"><strong>Total a Pagar:</strong> $${formatCurrency(totalAmount)}</p>
        `;
        
        downloadReceiptBtn.dataset.invoiceId = id;
        downloadReceiptBtn.dataset.multa = multa;

        receiptModal.classList.remove('hidden');
    }
}

closeModalBtn.addEventListener('click', () => {
    receiptModal.classList.add('hidden');
});

downloadReceiptBtn.addEventListener('click', () => {
    const id = downloadReceiptBtn.dataset.invoiceId;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const content = document.getElementById('receipt-details');
    
    doc.setFont("Helvetica");
    doc.setFontSize(10);
    doc.text(`Recibo de Pago`, 105, 20, null, null, "center");
    
    const logoImg = new Image();
    logoImg.src = 'logo bahia a.png';
    logoImg.onload = function() {
        doc.addImage(logoImg, 'PNG', 85, 25, 40, 40);
        
        html2canvas(content, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 200;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            doc.addPage();
            doc.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
            doc.save(`Recibo-${id}.pdf`);
        });
    };
});


// --- Funciones para el cambio de contraseña del residente ---
changePassBtn.addEventListener('click', () => {
    changePassCard.classList.remove('hidden');
});

cancelPassChangeBtn.addEventListener('click', () => {
    changePassCard.classList.add('hidden');
    changePassForm.reset();
    passErrorMessage.textContent = '';
});

changePassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass = changePassForm['old-password'].value;
    const newPass = changePassForm['new-password'].value;
    const confirmPass = changePassForm['confirm-password'].value;

    passErrorMessage.textContent = '';

    if (newPass !== confirmPass) {
        passErrorMessage.textContent = 'Las nuevas contraseñas no coinciden.';
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const invoiceId = userDoc.data().invoiceId;
        const invoiceDocRef = doc(db, "invoices", invoiceId);
        const invoiceDoc = await getDoc(invoiceDocRef);
        
        if (invoiceDoc.exists() && oldPass === invoiceDoc.data().password) {
            try {
                await updatePassword(currentUser, newPass);
                await updateDoc(invoiceDocRef, { password: newPass });
                alert('Contraseña actualizada con éxito.');
                changePassCard.classList.add('hidden');
                changePassForm.reset();
            } catch (error) {
                console.error("Error al actualizar la contraseña:", error);
                passErrorMessage.textContent = 'Ocurrió un error al cambiar la contraseña. Intente de nuevo.';
            }
        } else {
            passErrorMessage.textContent = 'La contraseña actual es incorrecta.';
        }
    }
});


// --- Utilidades ---
function formatCurrency(amount) {
    if (isNaN(amount)) return amount;
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(amount);
}

function formatDate(excelDate) {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }
    return excelDate;
}
