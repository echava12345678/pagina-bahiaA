//
// Archivo: script.js
// Lógica principal de la aplicación. Maneja la autenticación, la conexión a Firestore,
// la gestión de datos y la generación de PDF.
//

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, query, where, onSnapshot, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Credenciales del administrador (simulado)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123";
const LATE_FEE_PERCENTAGE = 0.10; // 10% de multa

// Variables globales para la app y la base de datos
let db, auth;
let currentUserId;

// --- Configuración de Firebase y Autenticación ---
const setupFirebase = async () => {
    try {
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUserId = user.uid;
                console.log("Usuario autenticado con ID:", currentUserId);
                // Iniciar la lógica de la app después de la autenticación
                initApp();
            } else {
                console.log("Usuario no autenticado. Mostrando panel de login.");
                showPanel('login');
            }
        });
        
    } catch (error) {
        console.error("Error al inicializar Firebase:", error);
    }
};

// --- Manejo de la Interfaz de Usuario (UI) ---
const showPanel = (panelId) => {
    const panels = {
        'login': document.getElementById('login-container'),
        'admin': document.getElementById('admin-panel'),
        'resident': document.getElementById('resident-panel')
    };

    Object.values(panels).forEach(panel => {
        if (panel) panel.classList.add('hidden');
    });

    if (panels[panelId]) {
        panels[panelId].classList.remove('hidden');
    }
};

// Muestra un modal de mensaje
const showMessageModal = (title, message, isSuccess) => {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    const titleElement = document.getElementById('modal-title');
    if (isSuccess) {
        titleElement.classList.add('text-green-600');
        titleElement.classList.remove('text-red-600');
    } else {
        titleElement.classList.add('text-red-600');
        titleElement.classList.remove('text-green-600');
    }
    
    modal.classList.remove('hidden');
};

// Cierra el modal de mensaje
document.getElementById('close-message-modal').addEventListener('click', () => {
    document.getElementById('message-modal').classList.add('hidden');
});

// --- Lógica del Panel de Administración ---
const setupAdminPanel = () => {
    // Escuchar cambios en la colección de residentes en tiempo real
    const q = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`);
    onSnapshot(q, (querySnapshot) => {
        const residents = [];
        querySnapshot.forEach((doc) => {
            residents.push({ id: doc.id, ...doc.data() });
        });
        renderResidentsTable(residents);
        renderInvoiceResidentSelect(residents);
    });
};

const renderResidentsTable = (residents) => {
    const tableBody = document.getElementById('residents-table-body');
    tableBody.innerHTML = '';
    if (!residents.length) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No hay residentes registrados.</td></tr>`;
        return;
    }
    residents.forEach(resident => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 table-cell text-sm font-medium text-gray-900">${resident.id_residente}</td>
            <td class="px-6 py-4 table-cell text-sm text-gray-500">${resident.nombre}</td>
            <td class="px-6 py-4 table-cell text-sm text-gray-500">${resident.depto}</td>
            <td class="px-6 py-4 table-cell text-sm font-medium">
                <button data-id="${resident.id}" class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-yellow-600">Editar</button>
                <button data-id="${resident.id}" class="add-invoice-btn bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600">Añadir Factura</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Event listeners para los botones de la tabla
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const residentId = e.target.dataset.id;
            const docRef = doc(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`, residentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('edit-resident-id-input').value = residentId;
                document.getElementById('edit-resident-name').value = data.nombre;
                document.getElementById('edit-resident-apt').value = data.depto;
                document.getElementById('edit-resident-username').value = data.usuario;
                document.getElementById('edit-resident-password').value = data.contrasena_plain || '';
                
                const usernameInput = document.getElementById('edit-resident-username');
                const passwordInput = document.getElementById('edit-resident-password');

                if (data.credentials_changed) {
                     usernameInput.disabled = true;
                     passwordInput.disabled = true;
                     showMessageModal("Aviso", "Este residente ya cambió sus credenciales. No se pueden editar desde el panel de administrador.", false);
                } else {
                     usernameInput.disabled = false;
                     passwordInput.disabled = false;
                }
                
                document.getElementById('edit-modal').classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('.add-invoice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const residentId = e.target.dataset.id;
            document.getElementById('invoice-resident-id-modal').value = residentId;
            document.getElementById('add-invoice-modal').classList.remove('hidden');
        });
    });
};

const renderInvoiceResidentSelect = (residents) => {
    const select = document.getElementById('invoice-resident');
    select.innerHTML = '';
    residents.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = `${resident.nombre} (Depto: ${resident.depto})`;
        select.appendChild(option);
    });
};

// Maneja el envío del formulario de residente
document.getElementById('resident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('resident-name').value;
    const apt = document.getElementById('resident-apt').value;
    const username = document.getElementById('resident-username').value;
    const password = document.getElementById('resident-password').value;

    if (!name || !apt || !username || !password) {
        showMessageModal("Error", "Todos los campos de residente son obligatorios.", false);
        return;
    }

    try {
        const residentsCollection = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`);
        await addDoc(residentsCollection, {
            id_residente: crypto.randomUUID(), // Genera un ID único
            nombre: name,
            depto: apt,
            usuario: username,
            contrasena: password, // Almacenado como texto plano, considerar hashing en un entorno real
            credentials_changed: false
        });
        showMessageModal("Éxito", "Residente guardado correctamente.", true);
        document.getElementById('resident-form').reset();
    } catch (error) {
        console.error("Error al guardar residente:", error);
        showMessageModal("Error", "No se pudo guardar el residente.", false);
    }
});

// Maneja el envío del formulario de factura
document.getElementById('invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = document.getElementById('invoice-resident').value;
    await saveInvoice(residentId, document.getElementById('invoice-form'));
});

// Maneja el envío del formulario de factura del modal
document.getElementById('add-invoice-form-modal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = document.getElementById('invoice-resident-id-modal').value;
    await saveInvoice(residentId, document.getElementById('add-invoice-form-modal'));
    document.getElementById('add-invoice-modal').classList.add('hidden');
});

const saveInvoice = async (residentId, form) => {
    const concept = form.querySelector('#invoice-concept, #modal-invoice-concept').value;
    const amount = parseFloat(form.querySelector('#invoice-amount, #modal-invoice-amount').value);
    const dueDate = form.querySelector('#invoice-due-date, #modal-invoice-due-date').value;
    const paidDate = form.querySelector('#invoice-paid-date, #modal-invoice-paid-date').value;
    const status = form.querySelector('#invoice-status, #modal-invoice-status').value;

    if (!concept || isNaN(amount) || !dueDate) {
        showMessageModal("Error", "Los campos de la factura son obligatorios.", false);
        return;
    }

    try {
        const invoicesCollection = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents/${residentId}/invoices`);
        await addDoc(invoicesCollection, {
            concepto_factura: concept,
            monto_factura: amount,
            fecha_factura: dueDate,
            fecha_pago: paidDate || null,
            factura_estado: status
        });
        showMessageModal("Éxito", "Factura guardada correctamente.", true);
        form.reset();
    } catch (error) {
        console.error("Error al guardar factura:", error);
        showMessageModal("Error", "No se pudo guardar la factura.", false);
    }
};

// Cierra el modal de edición
document.getElementById('close-edit-modal').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.add('hidden');
});

// Cierra el modal de añadir factura
document.getElementById('close-add-invoice-modal').addEventListener('click', () => {
    document.getElementById('add-invoice-modal').classList.add('hidden');
});


// Maneja el envío del formulario de edición de residente
document.getElementById('edit-resident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const residentId = document.getElementById('edit-resident-id-input').value;
    const name = document.getElementById('edit-resident-name').value;
    const apt = document.getElementById('edit-resident-apt').value;
    const username = document.getElementById('edit-resident-username').value;
    const password = document.getElementById('edit-resident-password').value;

    const residentRef = doc(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`, residentId);

    try {
        await updateDoc(residentRef, {
            nombre: name,
            depto: apt,
            usuario: username,
            contrasena: password
        });
        showMessageModal("Éxito", "Residente actualizado correctamente.", true);
        document.getElementById('edit-modal').classList.add('hidden');
    } catch (error) {
        console.error("Error al actualizar residente:", error);
        showMessageModal("Error", "No se pudo actualizar el residente.", false);
    }
});

// --- Lógica del Panel de Residente ---
const setupResidentPanel = (residentId) => {
    const invoicesCollection = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents/${residentId}/invoices`);
    onSnapshot(invoicesCollection, (querySnapshot) => {
        const invoices = [];
        querySnapshot.forEach(doc => {
            invoices.push({ id: doc.id, ...doc.data() });
        });
        renderResidentInvoices(invoices);
    });
};

const renderResidentInvoices = (invoices) => {
    const invoicesList = document.getElementById('invoices-list');
    invoicesList.innerHTML = '';

    if (!invoices.length) {
        invoicesList.innerHTML = `<p class="text-center text-gray-500">No tienes facturas pendientes.</p>`;
        return;
    }
    
    invoices.forEach(invoice => {
        const invoiceDiv = document.createElement('div');
        invoiceDiv.className = 'bg-gray-50 p-6 rounded-lg shadow-inner flex flex-col md:flex-row justify-between items-center';
        
        const invoiceDate = new Date(invoice.fecha_factura + 'T00:00:00');
        const today = new Date();
        const isOverdue = invoiceDate < today && invoice.factura_estado !== 'Pagado';
        
        invoiceDiv.innerHTML = `
            <div>
                <h3 class="text-lg font-bold text-gray-800">${invoice.concepto_factura}</h3>
                <p class="text-sm text-gray-600">Monto: <span class="font-semibold">$${invoice.monto_factura.toLocaleString('es-CO')}</span></p>
                <p class="text-sm text-gray-600">Vencimiento: ${invoice.fecha_factura}</p>
                <p class="text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-green-500'}">Estado: ${invoice.factura_estado} ${isOverdue ? '(¡Vencida!)' : ''}</p>
                ${invoice.fecha_pago ? `<p class="text-sm text-gray-600">Fecha de Pago: ${invoice.fecha_pago}</p>` : ''}
            </div>
            <div class="mt-4 md:mt-0">
                <button data-invoice-id="${invoice.id}" class="download-pdf-btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300">Descargar Recibo</button>
            </div>
        `;
        invoicesList.appendChild(invoiceDiv);
    });

    document.querySelectorAll('.download-pdf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const invoiceId = e.target.dataset.invoiceId;
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                generatePDF(invoice);
            }
        });
    });
};

// Lógica para cambiar credenciales
document.getElementById('change-credentials-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resident = JSON.parse(localStorage.getItem('currentResident'));
    const currentUsername = document.getElementById('current-username').value;
    const currentPassword = document.getElementById('current-password').value;
    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;

    const statusMessage = document.getElementById('credentials-status-message');

    if (resident.usuario !== currentUsername || resident.contrasena !== currentPassword) {
        statusMessage.textContent = "Usuario o contraseña actual incorrecta.";
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add('text-red-500');
        return;
    }

    try {
        const residentRef = doc(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`, resident.id);
        await updateDoc(residentRef, {
            usuario: newUsername,
            contrasena: newPassword,
            credentials_changed: true // Previene que el admin los cambie
        });
        
        // Actualizar datos en localStorage
        resident.usuario = newUsername;
        resident.contrasena = newPassword;
        localStorage.setItem('currentResident', JSON.stringify(resident));
        
        statusMessage.textContent = "Credenciales actualizadas con éxito.";
        statusMessage.classList.remove('hidden');
        statusMessage.classList.remove('text-red-500');
        statusMessage.classList.add('text-green-500');
        document.getElementById('change-credentials-form').reset();
    } catch (error) {
        console.error("Error al cambiar credenciales:", error);
        statusMessage.textContent = "Error al actualizar credenciales.";
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add('text-red-500');
    }
});

// --- Lógica de Autenticación y Carga de Datos ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    errorMsg.classList.add('hidden');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        showPanel('admin');
        setupAdminPanel();
    } else {
        const residentsCollection = collection(db, `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/residents`);
        const q = query(residentsCollection, where("usuario", "==", username), where("contrasena", "==", password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const residentDoc = querySnapshot.docs[0];
            const residentData = { id: residentDoc.id, ...residentDoc.data() };
            localStorage.setItem('currentResident', JSON.stringify(residentData));
            showPanel('resident');
            document.getElementById('resident-title').textContent = `Bienvenido, ${residentData.nombre}`;
            setupResidentPanel(residentData.id);
        } else {
            errorMsg.textContent = "Usuario o contraseña incorrectos.";
            errorMsg.classList.remove('hidden');
        }
    }
});

// Botones de cerrar sesión
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentResident');
    showPanel('login');
});

document.getElementById('resident-logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentResident');
    showPanel('login');
});

// --- Generación de PDF ---
const generatePDF = async (invoice) => {
    const resident = JSON.parse(localStorage.getItem('currentResident'));
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const today = new Date();
    const dueDate = new Date(invoice.fecha_factura);
    let totalAmount = invoice.monto_factura;
    let lateFee = 0;
    
    // Calcular la multa si la fecha de pago es posterior a la de vencimiento y no está pagada
    if (invoice.factura_estado !== 'Pagado' && today > dueDate) {
        lateFee = totalAmount * LATE_FEE_PERCENTAGE;
        totalAmount += lateFee;
    }
    
    // Título del recibo
    doc.setFontSize(22);
    doc.text("Recibo de Pago", 20, 20);
    
    // Información del Edificio (Simulada)
    doc.setFontSize(10);
    doc.text("Gestión de Edificio XYZ", 20, 30);
    doc.text("Dirección: Calle Falsa 123", 20, 35);
    doc.text("Teléfono: 555-1234", 20, 40);
    doc.text(`Fecha de Emisión: ${today.toLocaleDateString()}`, doc.internal.pageSize.getWidth() - 20, 40, { align: 'right' });
    
    // Información del Residente
    doc.setFontSize(12);
    doc.text(`A nombre de: ${resident.nombre}`, 20, 55);
    doc.text(`Departamento: ${resident.depto}`, 20, 60);

    // Detalles de la Factura con jspdf-autotable
    const tableData = [
        ['ID Factura', invoice.id],
        ['Concepto', invoice.concepto_factura],
        ['Monto Original', `$${invoice.monto_factura.toLocaleString('es-CO')}`],
        ['Fecha de Vencimiento', invoice.fecha_factura],
        ['Estado', invoice.factura_estado],
        ... (lateFee > 0 ? [['Multa', `$${lateFee.toLocaleString('es-CO')}`]] : []),
        ... (invoice.fecha_pago ? [['Fecha de Pago', invoice.fecha_pago]] : []),
        ['Monto Total', `$${totalAmount.toLocaleString('es-CO')}`]
    ];
    
    doc.autoTable({
        startY: 70,
        head: [['Detalle', 'Valor']],
        body: tableData,
        theme: 'striped',
        styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [22, 101, 242], // Azul de Tailwind 600
            textColor: 255
        },
        bodyStyles: {
            fillColor: [243, 244, 246] // Gris claro de Tailwind 100
        }
    });

    // Pie de página
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(10);
    doc.text("Gracias por su pago.", 20, finalY + 10);
    doc.text("Este es un recibo generado automáticamente.", 20, finalY + 15);
    
    doc.save(`Recibo_Factura_${invoice.concepto_factura}_${invoice.fecha_factura}.pdf`);
};

// --- Inicio de la Aplicación ---
setupFirebase();
