const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                message.innerHTML = `
                    <div class="alert alert-success">
                        ${data.mensaje}
                    </div>
                `;

                localStorage.setItem("usuario", JSON.stringify(data.usuario));

                setTimeout(function() {
                    window.location.href = "profile.html";
                }, 1000);

            } else {
                message.innerHTML = `
                    <div class="alert alert-danger">
                        ${data.mensaje}
                    </div>
                `;
            }

        } catch (error) {
            message.innerHTML = `
                <div class="alert alert-danger">
                    No se pudo conectar con el servidor.
                </div>
            `;

            console.error(error);
        }
    });
}

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
    if (terms.checked && privacy.checked) {
        confirmButton.disabled = false;
    } else {
        confirmButton.disabled = true;
    }
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

const userInfo = document.getElementById("userInfo");

if (userInfo) {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (usuario) {
        userInfo.innerHTML = `
            <div class="card p-4">
                <h2>${usuario.nombre}</h2>
                <p>${usuario.email}</p>
            </div>
        `;
    } else {
        userInfo.innerHTML = `
            <div class="alert alert-warning">
                No hay una sesión iniciada.
            </div>
        `;
    }
}