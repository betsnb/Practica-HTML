const API_URL = window.location.port === "3000"
    ? "/api"
    : "http://localhost:3000/api";


async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" }
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    let response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, config);
    } catch (error) {
        console.error(error);
        throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const apiError = new Error(data.mensaje || "Ocurrió un error inesperado");
        apiError.status = response.status;
        throw apiError;
    }

    return data;
}


function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function showMessage(container, text, type = "success") {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${escapeHTML(text)}
        </div>
    `;
}

function clearMessage(container) {
    if (container) {
        container.innerHTML = "";
    }
}



function getSessionUser() {
    try {
        return JSON.parse(localStorage.getItem("usuario"));
    } catch (error) {
        return null;
    }
}

function setSessionUser(usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
}

function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "index.html";
}


function updateNavbar() {
    const usuario = getSessionUser();

    document.querySelectorAll("[data-auth]").forEach(function(element) {
        element.classList.toggle("d-none", !usuario);
    });

    document.querySelectorAll("[data-guest]").forEach(function(element) {
        element.classList.toggle("d-none", Boolean(usuario));
    });

    const navUserName = document.getElementById("navUserName");

    if (navUserName) {
        navUserName.textContent = usuario ? `(${usuario.nombre})` : "";
    }
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

updateNavbar();


const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");
        const submitButton = loginForm.querySelector("button[type='submit']");

        submitButton.disabled = true;

        try {
            const data = await apiRequest("/login", {
                method: "POST",
                body: { email, password }
            });

            showMessage(message, data.mensaje, "success");
            setSessionUser(data.usuario);

            setTimeout(function() {
                window.location.href = "profile.html";
            }, 1000);
        } catch (error) {
            showMessage(message, error.message, "danger");
            submitButton.disabled = false;
        }
    });
}

/* ------------------------- Registro ------------------------- */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const nombre = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirm = document.getElementById("registerConfirm").value;
        const message = document.getElementById("registerMessage");
        const submitButton = registerForm.querySelector("button[type='submit']");

        if (password !== confirm) {
            showMessage(message, "Las contraseñas no coinciden", "danger");
            return;
        }

        submitButton.disabled = true;

        try {
            // 1) Crear el usuario  2) Iniciar sesión con él
            await apiRequest("/users", {
                method: "POST",
                body: { nombre, email, password }
            });

            const data = await apiRequest("/login", {
                method: "POST",
                body: { email, password }
            });

            setSessionUser(data.usuario);
            showMessage(message, "Cuenta creada correctamente. Entrando a tu perfil...", "success");

            setTimeout(function() {
                window.location.href = "profile.html";
            }, 1000);
        } catch (error) {
            showMessage(message, error.message, "danger");
            submitButton.disabled = false;
        }
    });
}

/* ------------------------- Perfil ------------------------- */

const userInfo = document.getElementById("userInfo");

function renderUserCard(usuario) {
    userInfo.innerHTML = `
        <div class="user-card">
            <h2>${escapeHTML(usuario.nombre)}</h2>
            <p>${escapeHTML(usuario.email)}</p>
        </div>
    `;
}

async function loadProfile() {
    const sessionUser = getSessionUser();
    const accountSection = document.getElementById("accountSection");

    if (!sessionUser) {
        userInfo.innerHTML = `
            <div class="alert alert-warning d-inline-block">
                No hay una sesión iniciada. <a href="index.html">Inicia sesión</a>
                o <a href="registro.html">regístrate</a>.
            </div>
        `;
        return;
    }

    renderUserCard(sessionUser);

    try {
        // Se consultan los datos actualizados en la base de datos
        const usuario = await apiRequest(`/users/${sessionUser.id}`);

        setSessionUser(usuario);
        updateNavbar();
        renderUserCard(usuario);

        document.getElementById("accountName").value = usuario.nombre;
        document.getElementById("accountEmail").value = usuario.email;
        accountSection.classList.remove("d-none");
    } catch (error) {
        if (error.status === 404) {
            // El usuario ya no existe en la base de datos
            localStorage.removeItem("usuario");
            updateNavbar();
            showMessage(userInfo, "Tu usuario ya no existe. Inicia sesión de nuevo.", "warning");
        } else {
            showMessage(userInfo, error.message, "danger");
        }
    }
}

if (userInfo) {
    loadProfile();
}

const accountForm = document.getElementById("accountForm");

if (accountForm) {
    accountForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const sessionUser = getSessionUser();
        const message = document.getElementById("accountMessage");
        const passwordInput = document.getElementById("accountPassword");

        const body = {
            nombre: document.getElementById("accountName").value.trim(),
            email: document.getElementById("accountEmail").value.trim()
        };

        if (passwordInput.value) {
            body.password = passwordInput.value;
        }

        try {
            const usuario = await apiRequest(`/users/${sessionUser.id}`, {
                method: "PUT",
                body
            });

            setSessionUser(usuario);
            updateNavbar();
            renderUserCard(usuario);
            passwordInput.value = "";
            showMessage(message, "Datos actualizados correctamente", "success");
        } catch (error) {
            showMessage(message, error.message, "danger");
        }
    });
}

const deleteAccountButton = document.getElementById("deleteAccountButton");

if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", async function() {
        const sessionUser = getSessionUser();
        const message = document.getElementById("accountMessage");

        if (!confirm("¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            await apiRequest(`/users/${sessionUser.id}`, { method: "DELETE" });
            logout();
        } catch (error) {
            showMessage(message, error.message, "danger");
        }
    });
}

/* ------------------------- Usuarios (CRUD) ------------------------- */

const usersTableBody = document.getElementById("usersTableBody");

async function loadUsers() {
    const message = document.getElementById("usersMessage");

    clearMessage(message);

    try {
        const users = await apiRequest("/users");
        const sessionUser = getSessionUser();

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr><td colspan="4" class="text-center text-muted">No hay usuarios registrados.</td></tr>
            `;
            return;
        }

        usersTableBody.innerHTML = users.map(function(user) {
            const isMe = sessionUser && sessionUser.id === user.id;

            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${escapeHTML(user.nombre)} ${isMe ? '<span class="badge rounded-pill ms-1">Tú</span>' : ""}</td>
                    <td>${escapeHTML(user.email)}</td>
                    <td class="text-end text-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-primary" data-edit="${user.id}">Editar</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${user.id}">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        usersTableBody.innerHTML = "";
        showMessage(message, error.message, "danger");
    }
}

if (usersTableBody) {
    if (!getSessionUser()) {
        window.location.href = "index.html";
    } else {
        const userModalElement = document.getElementById("userModal");
        const userModal = new bootstrap.Modal(userModalElement);
        const userForm = document.getElementById("userForm");
        const userFormMessage = document.getElementById("userFormMessage");
        const passwordInput = document.getElementById("userPassword");

        function openUserModal(user) {
            clearMessage(userFormMessage);
            userForm.reset();

            document.getElementById("userId").value = user ? user.id : "";
            document.getElementById("userName").value = user ? user.nombre : "";
            document.getElementById("userEmail").value = user ? user.email : "";
            document.getElementById("userModalTitle").textContent = user ? `Editar usuario #${user.id}` : "Nuevo usuario";
            document.getElementById("userPasswordHelp").textContent = user
                ? "Déjalo vacío para conservar la contraseña actual."
                : "Mínimo 6 caracteres.";
            passwordInput.required = !user;

            userModal.show();
        }

        document.getElementById("newUserButton").addEventListener("click", function() {
            openUserModal(null);
        });

        document.getElementById("reloadUsersButton").addEventListener("click", loadUsers);

        usersTableBody.addEventListener("click", async function(event) {
            const editId = event.target.dataset.edit;
            const deleteId = event.target.dataset.delete;
            const message = document.getElementById("usersMessage");

            if (editId) {
                try {
                    const user = await apiRequest(`/users/${editId}`);
                    openUserModal(user);
                } catch (error) {
                    showMessage(message, error.message, "danger");
                }
            }

            if (deleteId) {
                if (!confirm(`¿Eliminar al usuario #${deleteId}?`)) {
                    return;
                }

                try {
                    const data = await apiRequest(`/users/${deleteId}`, { method: "DELETE" });
                    const sessionUser = getSessionUser();

                    if (sessionUser && String(sessionUser.id) === deleteId) {
                        logout();
                        return;
                    }

                    await loadUsers();
                    showMessage(message, data.mensaje, "success");
                } catch (error) {
                    showMessage(message, error.message, "danger");
                }
            }
        });

        userForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const id = document.getElementById("userId").value;
            const body = {
                nombre: document.getElementById("userName").value.trim(),
                email: document.getElementById("userEmail").value.trim()
            };

            if (passwordInput.value) {
                body.password = passwordInput.value;
            }

            try {
                const user = await apiRequest(id ? `/users/${id}` : "/users", {
                    method: id ? "PUT" : "POST",
                    body
                });

                const sessionUser = getSessionUser();

                if (sessionUser && sessionUser.id === user.id) {
                    setSessionUser(user);
                    updateNavbar();
                }

                userModal.hide();
                await loadUsers();
                showMessage(
                    document.getElementById("usersMessage"),
                    id ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
                    "success"
                );
            } catch (error) {
                showMessage(userFormMessage, error.message, "danger");
            }
        });

        loadUsers();
    }
}

/* =========================================================
   Formulario interactivo (práctica de JavaScript)
   ========================================================= */

const radioButtons = document.querySelectorAll(".option-radio");
const radioContent = document.getElementById("radioContent");

radioButtons.forEach(function(radio) {
    radio.addEventListener("change", function() {
        radioContent.classList.remove("d-none");

        if (this.value === "developer") {
            radioContent.textContent = "Seleccionaste Desarrollo de software.";
        }

        if (this.value === "data") {
            radioContent.textContent = "Seleccionaste Data Science.";
        }

        if (this.value === "security") {
            radioContent.textContent = "Seleccionaste Ciberseguridad.";
        }
    });
});

const terms = document.getElementById("terms");
const privacy = document.getElementById("privacy");
const confirmButton = document.getElementById("confirmButton");

function validateCheckboxes() {
    confirmButton.disabled = !(terms.checked && privacy.checked);
}

if (terms && privacy) {
    terms.addEventListener("change", validateCheckboxes);
    privacy.addEventListener("change", validateCheckboxes);
}

if (confirmButton) {
    confirmButton.addEventListener("click", function() {
        alert("Formulario confirmado correctamente.");
    });
}

const countrySelect = document.getElementById("country");
const regionSelect = document.getElementById("region");

if (countrySelect && regionSelect) {
    fetch("country-region-data.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            data.forEach(function(country) {
                const option = document.createElement("option");

                option.value = country.countryShortCode;
                option.textContent = country.countryName;

                countrySelect.appendChild(option);
            });

            countrySelect.addEventListener("change", function() {
                regionSelect.innerHTML = '<option value="">Selecciona una región</option>';

                const selectedCountry = data.find(function(country) {
                    return country.countryShortCode === countrySelect.value;
                });

                if (selectedCountry && selectedCountry.regions) {
                    regionSelect.disabled = false;

                    selectedCountry.regions.forEach(function(region) {
                        const option = document.createElement("option");

                        option.value = region.shortCode;
                        option.textContent = region.name;

                        regionSelect.appendChild(option);
                    });
                } else {
                    regionSelect.disabled = true;
                }
            });
        })
        .catch(function(error) {
            console.error("Error al cargar los países:", error);
        });
}
