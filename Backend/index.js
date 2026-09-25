const express = require("express");
const morgan = require("morgan");
require("dotenv").config();

const indexRoutes = require("./routes/index.routes");
const usersRoutes = require("./routes/users.routes");
const loginRoutes = require("./routes/login.routes");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/", indexRoutes);
app.use("/users", usersRoutes);
app.use("/login", loginRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});