const { sql, poolPromise } = require("../db");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                mensaje: "Correo y contraseña son obligatorios"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.NVarChar(150), email)
            .input("password", sql.NVarChar(255), password)
            .query(`
                SELECT id, nombre, email
                FROM Users
                WHERE email = @email AND password = @password
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        res.json({
            mensaje: "Inicio de sesión correcto",
            usuario: result.recordset[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};