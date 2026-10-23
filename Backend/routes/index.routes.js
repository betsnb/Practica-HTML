const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ mensaje: "Bienvenido a mi REST API" });
});

router.get("/marco", (req, res) => {
    res.json({ mensaje: "Hola, soy Betsy" });
});

router.get("/ping", (req, res) => {
    res.json({ mensaje: "pong" });
});

module.exports = router;