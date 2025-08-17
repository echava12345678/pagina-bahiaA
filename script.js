// script.js

// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variables globales proporcionadas por el entorno de Canvas
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
const saveOrAddButton = document.getElementById('save-or-add-button'); // Asumimos que este ID ha sido agregado al botón
const clearFormButton = document.getElementById('clear-form-button'); // Asumimos que este ID ha sido agregado al botón

let isEditing = false;
let currentResidentDocId = null;

// Función para mostrar mensajes modales
function showMessage(message) {
    modalText.textContent = message;
    modal.classList.remove('hidden');
}

// Escuchadores de eventos del modal
closeBtn.onclick = function() {
    modal.classList.add('hidden');
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
}

// Lógica para el manejo de la autenticación de Firebase
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuario autenticado, obtener su rol
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    loginPanel.classList.add('hidden');
                    residentPanel.classList.add('hidden');
                    adminPanel.classList.remove('hidden');
                    // Escuchar cambios en la tabla de residentes solo si es admin
                    onSnapshot(collection(db, 'residents'), (querySnapshot) => {
                        renderAdminTable(querySnapshot);
                    });
                } else if (userData.role === 'resident') {
                    loginPanel.classList.add('hidden');
                    adminPanel.classList.add('hidden');
                    residentPanel.classList.remove('hidden');
                    const residentDoc = await getDoc(doc(db, 'residents', user.uid));
                    if (residentDoc.exists()) {
                        const residentData = residentDoc.data();
                        residentNameDisplay.textContent = residentData.nombre;
                        residentDeptoDisplay.textContent = residentData.depto;
                        renderResidentInvoices(residentData);
                        currentResidentDocId = residentDoc.id;
                    } else {
                        showMessage('No se encontraron datos de residente para este usuario.');
                        signOut(auth);
                    }
                }
            } else {
                showMessage('No se encontraron datos de usuario. Por favor, contacte a un administrador.');
                signOut(auth);
            }
        } catch (error) {
            console.error("Error al obtener el rol del usuario: ", error);
            showMessage('Error al obtener los datos del usuario.');
            signOut(auth);
        }
    } else {
        // No hay usuario, mostrar panel de inicio de sesión
        loginPanel.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        residentPanel.classList.add('hidden');
    }
});

// Autenticar automáticamente al usuario con el token de Canvas
if (initialAuthToken) {
    signInWithCustomToken(auth, initialAuthToken).catch(error => {
        console.error("Error al iniciar sesión con token personalizado: ", error);
        showMessage('Error de autenticación. Por favor, recargue la página.');
    });
} else {
    // Si no hay token, el usuario debe iniciar sesión manualmente (solo si se implementa un formulario de login)
    // El código actual del HTML tiene un formulario, pero se recomienda usar el token de Canvas.
    // Para este ejercicio, el formulario de login no se usará.
}

// Listener para el checkbox de estado de pago
paidStatusCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        paymentDateContainer.classList.remove('hidden');
    } else {
        paymentDateContainer.classList.add('hidden');
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
    const amount = parseFloat(residentForm.amount.value.replace(/\./g, '').replace(',', '.')); // Soporta comas y puntos
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

    if (isEditing && currentResidentDocId) {
        // Lógica para actualizar (agregar una nueva factura)
        try {
            const residentRef = doc(db, 'residents', currentResidentDocId);
            const residentDoc = await getDoc(residentRef);
            const residentData = residentDoc.data();

            const updatedInvoices = residentData.invoices ? [...residentData.invoices, newInvoice] : [newInvoice];

            await updateDoc(residentRef, {
                invoices: updatedInvoices
            });
            showMessage('Factura agregada correctamente.');
        } catch (e) {
            console.error("Error al agregar la factura: ", e);
            showMessage('Error al agregar la factura.');
        }
    } else {
        // Lógica para agregar un nuevo residente
        try {
            // Verificar si el usuario ya existe para evitar duplicados
            const userQuery = query(collection(db, 'residents'), where('usuario', '==', user));
            const userSnapshot = await getDocs(userQuery);
            if (!userSnapshot.empty) {
                showMessage('El usuario ya existe. Use un nombre de usuario diferente.');
                return;
            }

            // Crear el documento del residente
            const newResidentRef = doc(collection(db, 'residents'));
            await setDoc(newResidentRef, {
                depto: depto,
                nombre: name,
                usuario: user,
                contrasena: pass,
                invoices: [newInvoice],
                credentials_updated: false
            });
            // Crear el documento de usuario con el mismo ID y un rol
            await setDoc(doc(db, 'users', newResidentRef.id), {
                email: user, // Usamos el usuario como email
                role: 'resident',
            });
            showMessage('Residente y usuario agregados correctamente.');
        } catch (e) {
            console.error("Error al agregar el nuevo residente: ", e);
            showMessage('Error al guardar los datos del residente.');
        }
    }

    // Limpiar formulario y resetear estado
    residentForm.reset();
    paymentDateContainer.classList.add('hidden');
    if (saveOrAddButton) saveOrAddButton.textContent = 'Guardar Residente';
    isEditing = false;
    currentResidentDocId = null;
    if (userMessage) userMessage.textContent = '';
    if (passMessage) passMessage.textContent = '';
    residentForm.user.removeAttribute('disabled');
    residentForm.pass.removeAttribute('disabled');
});

// Lógica para limpiar el formulario
if (clearFormButton) {
    clearFormButton.addEventListener('click', () => {
        residentForm.reset();
        paymentDateContainer.classList.add('hidden');
        if (saveOrAddButton) saveOrAddButton.textContent = 'Guardar Residente';
        isEditing = false;
        currentResidentDocId = null;
        if (userMessage) userMessage.textContent = '';
        if (passMessage) passMessage.textContent = '';
        residentForm.user.removeAttribute('disabled');
        residentForm.pass.removeAttribute('disabled');
    });
}

// Escuchar cambios en la colección de residentes y renderizar la tabla
function renderAdminTable(querySnapshot) {
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
}

// Lógica de edición y eliminación
residentsTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const residentId = e.target.dataset.id;
        try {
            await deleteDoc(doc(db, 'residents', residentId));
            await deleteDoc(doc(db, 'users', residentId));
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
                    if (userMessage) userMessage.textContent = 'El residente ha actualizado sus credenciales.';
                    if (passMessage) passMessage.textContent = 'El residente ha actualizado sus credenciales.';
                } else {
                    residentForm.user.removeAttribute('disabled');
                    residentForm.pass.removeAttribute('disabled');
                    if (userMessage) userMessage.textContent = '';
                    if (passMessage) passMessage.textContent = '';
                }

                // Cambiar el texto del botón y setear el estado
                if (saveOrAddButton) saveOrAddButton.textContent = 'Agregar Factura';
                isEditing = true;
                currentResidentDocId = residentId;

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
        const workbook = XLSX.read(data, { type: 'array' });
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
                        fecha_factura: row['fecha_factura'] ? XLSX.utils.format_date(row['fecha_factura'], 'yyyy-mm-dd') : '',
                        monto_factura: parseFloat(String(row['monto_factura']).replace(/\./g, '').replace(',', '.')),
                        factura_estado: row['factura_estado'],
                        concepto_factura: row['concepto_factura'],
                        fecha_pago: row['fecha_pago'] ? XLSX.utils.format_date(row['fecha_pago'], 'yyyy-mm-dd') : null
                    }],
                    credentials_updated: false
                };

                // Verificar si el usuario ya existe para evitar duplicados
                const userQuery = query(collection(db, 'residents'), where('usuario', '==', residentData.usuario));
                const userSnapshot = await getDocs(userQuery);
                if (!userSnapshot.empty) {
                    console.warn(`Usuario ${residentData.usuario} ya existe. Saltando.`);
                    continue;
                }
                
                // Agregar el residente a la colección 'residents'
                const newResidentRef = doc(collection(db, 'residents'));
                await setDoc(newResidentRef, residentData);

                // Agregar el usuario a la colección 'users'
                await setDoc(doc(db, 'users', newResidentRef.id), {
                    email: residentData.usuario, // Usamos el usuario como email
                    role: 'resident',
                });
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

    const user = auth.currentUser;
    if (user && currentResidentDocId) {
        try {
            // Re-autenticar al usuario para actualizar las credenciales sensibles
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
    signOut(auth).then(() => {
        showMessage('Sesión de administrador cerrada.');
    }).catch((error) => {
        console.error("Error al cerrar sesión: ", error);
    });
});

residentLogoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        showMessage('Sesión de residente cerrada.');
    }).catch((error) => {
        console.error("Error al cerrar sesión: ", error);
    });
});
