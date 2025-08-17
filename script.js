// script.js

// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, updateEmail, updatePassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase proporcionada por el usuario
const firebaseConfig = {
    apiKey: "AIzaSyBQQbZeHBV9thJ0iy3c3c30k3ERCYvRoDQMM",
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
const userMessage = document.getElementById('user-message');
const passMessage = document.getElementById('pass-message');
const saveOrAddButton = document.getElementById('save-or-add-button');
const clearFormButton = document.getElementById('clear-form-button');

let isEditing = false;
let currentResidentId = null;
let currentResidentDocId = null;

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
            if (username === 'admin' && password === 'admin123') {
                loginPanel.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                loginMessage.textContent = '';
            } else {
                loginMessage.textContent = 'Credenciales de administrador incorrectas.';
            }
            return;
        }

        // Autenticación de residente
        const residentsCollection = collection(db, 'residents');
        const q = query(residentsCollection, where("usuario", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            loginMessage.textContent = 'Usuario no encontrado.';
            return;
        }

        const residentDoc = querySnapshot.docs[0];
        const residentData = residentDoc.data();

        if (residentData.contrasena === password) {
            loginPanel.classList.add('hidden');
            residentPanel.classList.remove('hidden');
            residentNameDisplay.textContent = residentData.nombre;
            residentDeptoDisplay.textContent = residentData.depto;
            renderResidentInvoices(residentData);
            currentResidentDocId = residentDoc.id;
            loginMessage.textContent = '';
        } else {
            loginMessage.textContent = 'Contraseña incorrecta.';
        }

    } catch (error) {
        console.error("Error al iniciar sesión: ", error);
        showMessage('Error al iniciar sesión: ' + error.message);
    }
});

// Lógica para guardar o agregar datos del residente (Admin)
residentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const depto = residentForm.depto.value;
    const name = residentForm['resident-name'].value;
    const user = residentForm.user.value;
    const pass = residentForm.pass.value;
    const dueDate = residentForm['due-date'].value;
    const amount = parseFloat(residentForm.amount.value.replace(/\./g, ''));
    const concept = residentForm.concept.value;
    const paid = paidStatusCheckbox.checked;
    const paymentDate = paid ? residentForm['payment-date'].value : null;

    const newInvoice = {
        fecha_factura: dueDate,
        monto_factura: amount,
        factura_estado: paid ? 'Pagado' : 'Pendiente',
        concepto_factura: concept,
        fecha_pago: paymentDate
    };

    try {
        if (isEditing && currentResidentId) {
            // Lógica para actualizar (agregar una nueva factura)
            const residentRef = doc(db, 'residents', currentResidentId);
            const residentDoc = await getDoc(residentRef);
            const residentData = residentDoc.data();

            const updatedInvoices = residentData.invoices ? [...residentData.invoices, newInvoice] : [newInvoice];

            await updateDoc(residentRef, {
                invoices: updatedInvoices
            });
            showMessage('Factura agregada correctamente.');
        } else {
            // Lógica para agregar un nuevo residente
            await addDoc(collection(db, 'residents'), {
                depto: depto,
                nombre: name,
                usuario: user,
                contrasena: pass,
                invoices: [newInvoice],
                credentials_updated: false
            });
            showMessage('Residente agregado correctamente.');
        }

        // Limpiar formulario y resetear estado
        residentForm.reset();
        paymentDateContainer.classList.add('hidden');
        saveOrAddButton.textContent = 'Agregar Residente';
        isEditing = false;
        currentResidentId = null;
    } catch (e) {
        console.error("Error al guardar/actualizar el documento: ", e);
        showMessage('Error al guardar los datos.');
    }
});

// Lógica para limpiar el formulario
clearFormButton.addEventListener('click', () => {
    residentForm.reset();
    paymentDateContainer.classList.add('hidden');
    saveOrAddButton.textContent = 'Agregar Residente';
    isEditing = false;
    currentResidentId = null;
    userMessage.textContent = '';
    passMessage.textContent = '';
    residentForm.user.removeAttribute('disabled');
    residentForm.pass.removeAttribute('disabled');
});

// Escuchar cambios en la colección de residentes y renderizar la tabla
onSnapshot(collection(db, 'residents'), (querySnapshot) => {
    residentsTableBody.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement('tr');

        const latestInvoice = data.invoices && data.invoices.length > 0 ? data.invoices[data.invoices.length - 1] : {};

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${data.depto}</td>
            <td class="px-6 py-4 whitespace-nowrap">${data.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap">${data.usuario}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${latestInvoice.monto_factura ? latestInvoice.monto_factura.toLocaleString('es-CO') : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${latestInvoice.factura_estado || 'N/A'}</td>
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

                // Llena el formulario con los datos del residente
                residentForm.depto.value = data.depto;
                residentForm['resident-name'].value = data.nombre;
                residentForm.user.value = data.usuario;
                residentForm.pass.value = data.contrasena;

                // Lógica para deshabilitar campos si el residente ya los actualizó
                if (data.credentials_updated) {
                    residentForm.user.setAttribute('disabled', 'true');
                    residentForm.pass.setAttribute('disabled', 'true');
                    userMessage.textContent = 'El residente ha actualizado sus credenciales.';
                    passMessage.textContent = 'El residente ha actualizado sus credenciales.';
                } else {
                    residentForm.user.removeAttribute('disabled');
                    residentForm.pass.removeAttribute('disabled');
                    userMessage.textContent = '';
                    passMessage.textContent = '';
                }

                // Cambiar el texto del botón y setear el estado
                saveOrAddButton.textContent = 'Agregar Factura';
                isEditing = true;
                currentResidentId = residentId;

                // Limpiar campos de factura para que el usuario pueda agregar una nueva
                residentForm['due-date'].value = '';
                residentForm.amount.value = '';
                residentForm.concept.value = '';
                paidStatusCheckbox.checked = false;
                paymentDateContainer.classList.add('hidden');
                residentForm['payment-date'].value = '';
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

    if (!data.invoices || data.invoices.length === 0) {
        invoicesList.innerHTML = '<p class="text-gray-500">No hay facturas disponibles.</p>';
        return;
    }

    data.invoices.forEach(invoice => {
        const invoiceItem = document.createElement('div');
        invoiceItem.classList.add('p-4', 'rounded-lg', 'shadow-md');

        const dueDate = new Date(invoice.fecha_factura + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let multa = 0;

        if (invoice.factura_estado === 'Pendiente' && today > dueDate) {
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            multa = diffDays * 10000;
        }

        const totalAmount = invoice.monto_factura + multa;

        invoiceItem.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-lg font-bold">${invoice.concepto_factura}</h4>
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${invoice.factura_estado === 'Pagado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">${invoice.factura_estado}</span>
            </div>
            <p><strong>Monto:</strong> $${invoice.monto_factura.toLocaleString('es-CO')}</p>
            <p><strong>Fecha de Vencimiento:</strong> ${invoice.fecha_factura}</p>
            ${multa > 0 ? `<p class="text-red-500 font-semibold"><strong>Multa por Mora:</strong> $${multa.toLocaleString('es-CO')}</p>` : ''}
            <p><strong>Total a Pagar:</strong> $${totalAmount.toLocaleString('es-CO')}</p>
            ${invoice.fecha_pago ? `<p><strong>Fecha de Pago:</strong> ${invoice.fecha_pago}</p>` : ''}
            <div class="mt-4 flex space-x-2">
                <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all text-sm download-invoice-btn" data-type="recibo" data-invoice='${JSON.stringify({ ...invoice, multa, nombre: data.nombre, depto: data.depto, usuario: data.usuario })}'>Descargar Recibo</button>
            </div>
        `;
        invoicesList.appendChild(invoiceItem);
    });
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
    doc.text('RECIBO DE PAGO', 105, 20, null, null, 'center');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Edificio Bahia S.A.S', 105, 28, null, null, 'center');
    doc.text('Calle 123 # 45 - 67, Bogotá, Colombia', 105, 33, null, null, 'center');
    doc.text('Tel: (1) 555-1234 | Email: contacto@edificiobahia.com', 105, 38, null, null, 'center');
    doc.setTextColor(0);

    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(12);
    doc.text(`Fecha de Emisión: ${today}`, 20, 55);
    doc.text(`Recibo N°: ${Math.floor(Math.random() * 100000)}`, 140, 55);

    doc.setFontSize(16);
    doc.text('Detalles del Residente', 20, 70);
    doc.setLineWidth(0.1);
    doc.line(20, 72, 80, 72);

    doc.setFontSize(12);
    doc.text(`Nombre: ${data.nombre}`, 20, 80);
    doc.text(`Apartamento: ${data.depto}`, 20, 87);
    doc.text(`Usuario: ${data.usuario}`, 20, 94);

    doc.setFontSize(16);
    doc.text('Resumen de la Factura', 20, 110);
    doc.line(20, 112, 80, 112);

    doc.autoTable({
        startY: 120,
        head: [['Descripción', 'Vencimiento', 'Monto', 'Estado']],
        body: [
            [data.concepto_factura, data.fecha_factura, `$${data.monto_factura.toLocaleString('es-CO')}`, data.factura_estado]
        ],
        theme: 'striped',
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [40, 40, 40],
            textColor: 255
        }
    });

    const total = data.monto_factura + data.multa;

    doc.setFontSize(12);
    doc.text(`Monto de la Factura: $${data.monto_factura.toLocaleString('es-CO')}`, 140, doc.lastAutoTable.finalY + 10);
    if (data.multa > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text(`Multa por Mora: $${data.multa.toLocaleString('es-CO')}`, 140, doc.lastAutoTable.finalY + 17);
        doc.setTextColor(0);
    }
    if (data.factura_estado === 'Pagado') {
        doc.setTextColor(0, 128, 0);
        doc.text(`Fecha de Pago: ${data.fecha_pago}`, 140, doc.lastAutoTable.finalY + 24);
        doc.setTextColor(0);
    }

    doc.setLineWidth(0.5);
    doc.line(140, doc.lastAutoTable.finalY + 28, 190, doc.lastAutoTable.finalY + 28);

    doc.setFontSize(16);
    doc.text(`TOTAL PAGADO: $${total.toLocaleString('es-CO')}`, 140, doc.lastAutoTable.finalY + 38);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Este es un recibo generado automáticamente. No se requiere firma.', 105, 270, null, null, 'center');

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
                    invoices: [{
                        fecha_factura: row['fecha_factura'] ? new Date(Math.round((row['fecha_factura'] - 25569) * 86400 * 1000)).toISOString().slice(0, 10) : '',
                        monto_factura: parseFloat(String(row['monto_factura']).replace(/\./g, '')),
                        factura_estado: row['factura_estado'],
                        concepto_factura: row['concepto_factura'],
                        fecha_pago: row['fecha_pago'] ? new Date(Math.round((row['fecha_pago'] - 25569) * 86400 * 1000)).toISOString().slice(0, 10) : null
                    }],
                    credentials_updated: false
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
    const oldPassword = changeCredentialsForm['old-password'].value;
    const newUsername = changeCredentialsForm['new-username'].value;
    const newPassword = changeCredentialsForm['new-password'].value;

    if (currentResidentDocId) {
        try {
            const residentDocRef = doc(db, 'residents', currentResidentDocId);
            const residentDoc = await getDoc(residentDocRef);
            const residentData = residentDoc.data();

            if (residentData.contrasena !== oldPassword) {
                showMessage('La contraseña antigua es incorrecta.');
                return;
            }

            await updateDoc(residentDocRef, {
                usuario: newUsername,
                contrasena: newPassword,
                credentials_updated: true
            });
            showMessage('Credenciales actualizadas correctamente.');
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
    currentResidentDocId = null;
});

residentLogoutButton.addEventListener('click', () => {
    residentPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    currentResidentDocId = null;
});
