const { sql, poolPromise } = require("../db");

exports.getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(
            "SELECT id, nombre, email FROM Users"
        );

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(
                "SELECT id, nombre, email FROM Users WHERE id = @id"
            );

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("nombre", sql.NVarChar(100), nombre)
            .input("email", sql.NVarChar(150), email)
            .input("password", sql.NVarChar(255), password)
            .query(`
                INSERT INTO Users (nombre, email, password)
                OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email
                VALUES (@nombre, @email, @password)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .input("nombre", sql.NVarChar(100), nombre)
            .input("email", sql.NVarChar(150), email)
            .input("password", sql.NVarChar(255), password)
            .query(`
                UPDATE Users
                SET nombre = @nombre,
                    email = @email,
                    password = @password
                OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                DELETE FROM Users
                OUTPUT DELETED.id
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Usuario eliminado correctamente"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};