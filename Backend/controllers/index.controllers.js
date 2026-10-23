
const { sql, poolPromise } = require("../db");
const { verifyPassword } = require("../passwordUtils");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                mensaje: "Correo y contraseña son obligatorios"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.NVarChar(150), email)
            .query(`
                SELECT id, nombre, email, password
                FROM Users
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const user = result.recordset[0];
        const validPassword = await verifyPassword(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        res.json({
            mensaje: "Inicio de sesión correcto",
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};
