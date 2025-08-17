// script.js

// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, updateEmail, updatePassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase proporcionada por el usuario
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHBV9thJ0iy3c30k3ERCYvRoDQMM",
    authDomain: "bahiaa.firebaseapp.com",
    projectId: "bahiaa",
    storageBucket: "bahiaa.firebasestorage.app",
    messagingSenderId: "212926382954",
    appId: "1:212926382954:web:526bfab6d7c29ee20c1b13",
    measurementId: "G-C3DWGGH4KY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginPanel = document.getElementById('login-panel');
const adminPanel = document.getElementById('admin-panel');
const residentPanel = document.getElementById('resident-panel');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const residentLogoutButton = document.getElementById('resident-logout-button');
const residentForm = document.getElementById('resident-form');
const residentsTableBody = document.getElementById('residents-table-body');
const excelUpload = document.getElementById('excel-upload');
const paidStatusCheckbox = document.getElementById('paid-status');
const paymentDateContainer = document.getElementById('payment-date-container');
const changeCredentialsForm = document.getElementById('change-credentials-form');
const invoicesList = document.getElementById('invoices-list');
const residentNameDisplay = document.getElementById('resident-name-display');
const residentDeptoDisplay = document.getElementById('resident-depto-display');
const modal = document.getElementById('message-modal');
const modalText = document.getElementById('modal-text');
const closeBtn = document.querySelector('.close-button');

let isEditing = false;
let currentResidentId = null;

// Función para mostrar mensajes modales
function showMessage(message) {
    modalText.textContent = message;
    modal.classList.remove('hidden');
}

closeBtn.onclick = function() {
    modal.classList.add('hidden');
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
}

// Listener para el checkbox de estado de pago
paidStatusCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        paymentDateContainer.classList.remove('hidden');
    } else {
        paymentDateContainer.classList.add('hidden');
    }
});

// Lógica de inicio de sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const isAdmin = loginForm['is-admin'].checked;
    const loginMessage = document.getElementById('login-message');

    try {
        // Autenticación de administrador
        if (isAdmin) {
            if (username === 'admin' && password === 'admin123') { // Credenciales de admin fijas para demostración
                loginPanel.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                loginMessage.textContent = '';
            } else {
                loginMessage.textContent = 'Credenciales de administrador incorrectas.';
            }
            return;
        }

        // Autenticación de residente
        // Buscar el usuario en Firestore
        const residentsCollection = collection(db, 'residents');
        const q = query(residentsCollection, where("usuario", "==", username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            loginMessage.textContent = 'Usuario no encontrado.';
            return;
        }

        const residentDoc = querySnapshot.docs[0];
        const residentData = residentDoc.data();
        
        // Verificar la contraseña (comparación simple, en un entorno real usaríamos un hash)
        if (residentData.contrasena === password) {
            // Simular inicio de sesión de residente
            loginPanel.classList.add('hidden');
            residentPanel.classList.remove('hidden');
            residentNameDisplay.textContent = residentData.nombre;
            residentDeptoDisplay.textContent = residentData.depto;
            renderResidentInvoices(residentData);
            loginMessage.textContent = '';
        } else {
            loginMessage.textContent = 'Contraseña incorrecta.';
        }

    } catch (error) {
        console.error("Error al iniciar sesión: ", error);
        showMessage('Error al iniciar sesión: ' + error.message);
    }
});

// Lógica para guardar datos del residente (Admin)
residentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const depto = residentForm.depto.value;
    const name = residentForm['resident-name'].value;
    const user = residentForm.user.value;
    const pass = residentForm.pass.value;
    const dueDate = residentForm['due-date'].value;
    const amount = parseFloat(residentForm.amount.value);
    const concept = residentForm.concept.value;
    const paid = paidStatusCheckbox.checked;
    const paymentDate = paid ? residentForm['payment-date'].value : null;

    const residentData = {
        depto: depto,
        nombre: name,
        usuario: user,
        contrasena: pass,
        fecha_factura: dueDate,
        monto_factura: amount,
        factura_estado: paid ? 'Pagado' : 'Pendiente',
        concepto_factura: concept,
        fecha_pago: paymentDate
    };
    
    try {
        if (isEditing) {
            // Actualizar documento existente
            const residentRef = doc(db, 'residents', currentResidentId);
            await updateDoc(residentRef, residentData);
            showMessage('Datos del residente actualizados correctamente.');
            isEditing = false;
            currentResidentId = null;
        } else {
            // Agregar nuevo documento
            await addDoc(collection(db, 'residents'), residentData);
            showMessage('Residente agregado correctamente.');
        }
        
        // Limpiar formulario
        residentForm.reset();
        paymentDateContainer.classList.add('hidden');
    } catch (e) {
        console.error("Error al guardar el documento: ", e);
        showMessage('Error al guardar los datos.');
    }
});

// Escuchar cambios en la colección de residentes y renderizar la tabla
onSnapshot(collection(db, 'residents'), (querySnapshot) => {
    residentsTableBody.innerHTML = ''; // Limpiar la tabla
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${data.depto}</td>
            <td class="px-6 py-4 whitespace-nowrap">${data.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap">${data.usuario}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${data.monto_factura.toLocaleString('es-CO')}</td>
            <td class="px-6 py-4 whitespace-nowrap">${data.factura_estado}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-btn" data-id="${doc.id}">Editar</button>
                <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${doc.id}">Eliminar</button>
            </td>
        `;
        residentsTableBody.appendChild(row);
    });
});

// Lógica de edición y eliminación
residentsTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const residentId = e.target.dataset.id;
        try {
            await deleteDoc(doc(db, 'residents', residentId));
            showMessage('Residente eliminado correctamente.');
        } catch (error) {
            console.error("Error al eliminar el documento: ", error);
            showMessage('Error al eliminar los datos.');
        }
    } else if (e.target.classList.contains('edit-btn')) {
        const residentId = e.target.dataset.id;
        try {
            const residentDoc = await getDoc(doc(db, 'residents', residentId));
            if (residentDoc.exists()) {
                const data = residentDoc.data();
                residentForm.depto.value = data.depto;
                residentForm['resident-name'].value = data.nombre;
                residentForm.user.value = data.usuario;
                residentForm.pass.value = data.contrasena;
                residentForm['due-date'].value = data.fecha_factura;
                residentForm.amount.value = data.monto_factura;
                residentForm.concept.value = data.concepto_factura;
                paidStatusCheckbox.checked = data.factura_estado === 'Pagado';
                if (paidStatusCheckbox.checked) {
                    paymentDateContainer.classList.remove('hidden');
                    residentForm['payment-date'].value = data.fecha_pago;
                } else {
                    paymentDateContainer.classList.add('hidden');
                }
                isEditing = true;
                currentResidentId = residentId;
            }
        } catch (error) {
            console.error("Error al obtener el documento para editar: ", error);
            showMessage('Error al cargar datos para editar.');
        }
    }
});

// Lógica para renderizar facturas de residente
function renderResidentInvoices(data) {
    invoicesList.innerHTML = '';
    const invoiceItem = document.createElement('div');
    invoiceItem.classList.add('p-4', 'rounded-lg', 'shadow-md');
    
    const dueDate = new Date(data.fecha_factura);
    const today = new Date();
    let multa = 0;
    const estadoColor = data.factura_estado === 'Pagado' ? 'bg-green-100' : 'bg-red-100';

    if (data.factura_estado !== 'Pagado' && today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        multa = diffDays * 10000; // Multa de $10.000 por día de retraso
    }

    const totalAmount = data.monto_factura + multa;

    invoiceItem.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h4 class="text-lg font-bold">${data.concepto_factura}</h4>
            <span class="px-3 py-1 text-xs font-semibold rounded-full ${data.factura_estado === 'Pagado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">${data.factura_estado}</span>
        </div>
        <p><strong>Monto:</strong> $${data.monto_factura.toLocaleString('es-CO')}</p>
        <p><strong>Fecha de Vencimiento:</strong> ${data.fecha_factura}</p>
        ${data.factura_estado !== 'Pagado' && multa > 0 ? `<p class="text-red-500 font-semibold"><strong>Multa por Mora:</strong> $${multa.toLocaleString('es-CO')}</p>` : ''}
        <p><strong>Total a Pagar:</strong> $${totalAmount.toLocaleString('es-CO')}</p>
        ${data.fecha_pago ? `<p><strong>Fecha de Pago:</strong> ${data.fecha_pago}</p>` : ''}
        <div class="mt-4 flex space-x-2">
            <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all text-sm download-invoice-btn" data-type="recibo" data-invoice='${JSON.stringify(data)}'>Descargar Recibo</button>
        </div>
    `;
    invoicesList.appendChild(invoiceItem);
}

// Lógica de descarga de PDF
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('download-invoice-btn')) {
        const data = JSON.parse(e.target.dataset.invoice);
        const type = e.target.dataset.type;
        generatePDF(data, type);
    }
});

async function generatePDF(data, type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-CO');

    doc.setFontSize(22);
    doc.text('Recibo de Pago', 105, 20, null, null, 'center');
    doc.setFontSize(12);
    doc.text(`Edificio Bahia S.A.S`, 105, 30, null, null, 'center');
    doc.text(`Fecha de Emisión: ${today}`, 105, 40, null, null, 'center');
    doc.text(`RECIBO N°: ${Math.floor(Math.random() * 100000)}`, 105, 50, null, null, 'center');
    
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    doc.setFontSize(14);
    doc.text('Detalles del Residente:', 20, 65);
    doc.setFontSize(12);
    doc.text(`Nombre: ${data.nombre}`, 20, 75);
    doc.text(`Apartamento: ${data.depto}`, 20, 85);
    doc.text(`ID Residente: ${data.usuario}`, 20, 95);

    doc.setLineWidth(0.5);
    doc.line(20, 100, 190, 100);

    doc.setFontSize(14);
    doc.text('Detalles de la Factura:', 20, 110);
    doc.setFontSize(12);
    doc.text(`Concepto: ${data.concepto_factura}`, 20, 120);
    doc.text(`Monto: $${data.monto_factura.toLocaleString('es-CO')}`, 20, 130);
    doc.text(`Fecha de Vencimiento: ${data.fecha_factura}`, 20, 140);
    doc.text(`Estado: ${data.factura_estado}`, 20, 150);

    let multa = 0;
    const dueDate = new Date(data.fecha_factura);
    const paidDate = data.fecha_pago ? new Date(data.fecha_pago) : new Date();
    if (paidDate > dueDate && data.factura_estado === 'Pagado') {
        const diffTime = Math.abs(paidDate - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        multa = diffDays * 10000;
        doc.text(`Multa por Mora: $${multa.toLocaleString('es-CO')}`, 20, 160);
    }
    if (data.factura_estado === 'Pagado') {
        doc.text(`Fecha de Pago: ${data.fecha_pago}`, 20, 170);
    }

    doc.setLineWidth(0.5);
    doc.line(20, 180, 190, 180);

    const total = data.monto_factura + multa;
    doc.setFontSize(16);
    doc.text(`TOTAL: $${total.toLocaleString('es-CO')}`, 105, 190, null, null, 'center');

    doc.setFontSize(10);
    doc.text('Este es un recibo generado automáticamente. No requiere firma.', 105, 270, null, null, 'center');
    
    doc.save(`Recibo_Factura_${data.depto}.pdf`);
}

// Lógica de Excel
excelUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const excelMessage = document.getElementById('excel-message');
    if (!file) {
        excelMessage.textContent = 'No se seleccionó ningún archivo.';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        try {
            for (const row of jsonData) {
                const residentData = {
                    depto: row['depto'],
                    nombre: row['nombre'],
                    usuario: row['usuario'],
                    contrasena: row['contrasena'],
                    fecha_factura: row['fecha_factura'] ? new Date(Math.round((row['fecha_factura'] - 25569) * 86400 * 1000)).toISOString().slice(0, 10) : '',
                    monto_factura: parseFloat(row['monto_factura']),
                    factura_estado: row['factura_estado'],
                    concepto_factura: row['concepto_factura'],
                    fecha_pago: row['fecha_pago'] ? new Date(Math.round((row['fecha_pago'] - 25569) * 86400 * 1000)).toISOString().slice(0, 10) : null
                };
                await addDoc(collection(db, 'residents'), residentData);
            }
            showMessage('Datos del Excel importados correctamente.');
        } catch (error) {
            console.error("Error al importar datos del Excel: ", error);
            showMessage('Error al importar datos del Excel.');
        }
    };
    reader.readAsArrayBuffer(file);
});

// Lógica para cambiar credenciales del residente
changeCredentialsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = changeCredentialsForm['new-username'].value;
    const newPassword = changeCredentialsForm['new-password'].value;
    const residentUser = auth.currentUser;

    if (residentUser) {
        try {
            await updateEmail(residentUser, newUsername + '@apartment.com'); // Usar un email proxy para auth
            await updatePassword(residentUser, newPassword);
            showMessage('Credenciales actualizadas correctamente.');
            // Actualizar el usuario en Firestore para que el login funcione
            const residentsCollection = collection(db, 'residents');
            const q = query(residentsCollection, where("usuario", "==", residentUser.email.split('@')[0]));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const residentDocRef = doc(db, 'residents', querySnapshot.docs[0].id);
                await updateDoc(residentDocRef, {
                    usuario: newUsername,
                    contrasena: newPassword
                });
            }
        } catch (error) {
            console.error("Error al cambiar credenciales: ", error);
            showMessage('Error al cambiar las credenciales.');
        }
    } else {
        showMessage('No se pudo encontrar el usuario para actualizar.');
    }
});

// Botones de salir
logoutButton.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
});

residentLogoutButton.addEventListener('click', () => {
    residentPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
});
