const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const indexRoutes = require("./routes/index.routes");
const usersRoutes = require("./routes/users.routes");
const loginRoutes = require("./routes/login.routes");

const app = express();

const FRONTEND_DIR = path.join(__dirname, "..");


const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
    : "*";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));


app.use("/api", indexRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/login", loginRoutes);


app.use("/users", usersRoutes);
app.use("/login", loginRoutes);
app.get("/ping", (req, res) => res.json({ mensaje: "pong" }));
app.get("/marco", (req, res) => res.json({ mensaje: "Hola, soy Betsy" }));


app.use("/api", (req, res) => {
    res.status(404).json({ mensaje: "Ruta de la API no encontrada" });
});


app.use(["/Backend", "/node_modules", "/.git"], (req, res) => {
    res.status(404).send("No encontrado");
});

app.use(express.static(FRONTEND_DIR, { dotfiles: "ignore" }));

app.use((req, res) => {
    res.status(404).sendFile(path.join(FRONTEND_DIR, "index.html"));
});


app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ mensaje: "El cuerpo de la petición no es un JSON válido" });
    }

    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
    console.log(`Frontend:  http://localhost:${PORT}/`);
    console.log(`API:       http://localhost:${PORT}/api`);
});
