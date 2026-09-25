const express = require("express");
const router = express.Router();

const indexController = require("../controllers/index.controllers");

router.get("/", indexController.home);
router.get("/marco", indexController.marco);
router.get("/ping", indexController.ping);

module.exports = router;