const { hashPassword } = require("../passwordUtils");
const { sql, poolPromise } = require("../db");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function validateUserData({ nombre, email, password }, passwordRequired) {
    if (!nombre || !nombre.trim() || !email || !email.trim()) {
        return "El nombre y el correo son obligatorios";
    }

    if (passwordRequired && !password) {
        return "Todos los campos son obligatorios";
    }

    if (nombre.trim().length > 100) {
        return "El nombre no puede tener más de 100 caracteres";
    }

    if (!EMAIL_REGEX.test(email.trim()) || email.trim().length > 150) {
        return "El correo no es válido";
    }

    if (password && password.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres";
    }

    return null;
}

function isDuplicateEmail(error) {
    return error.number === 2627 || error.number === 2601;
}

exports.getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(
            "SELECT id, nombre, email FROM Users ORDER BY id"
        );

        res.json(result.recordset);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener los usuarios"
        });
    }
};

exports.getUser = async (req, res) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(400).json({ mensaje: "El id no es válido" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, id)
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
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el usuario"
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password } = req.body || {};
        const validationError = validateUserData({ nombre, email, password }, true);

        if (validationError) {
            return res.status(400).json({ mensaje: validationError });
        }

        const hashedPassword = await hashPassword(password);
        const pool = await poolPromise;

        const result = await pool.request()
            .input("nombre", sql.NVarChar(100), nombre.trim())
            .input("email", sql.NVarChar(150), email.trim().toLowerCase())
            .input("password", sql.NVarChar(255), hashedPassword)
            .query(`
                INSERT INTO Users (nombre, email, password)
                OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email
                VALUES (@nombre, @email, @password)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        if (isDuplicateEmail(error)) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        console.error(error);

        res.status(500).json({
            mensaje: "Error al crear el usuario"
        });
    }
};

// La contraseña es opcional al actualizar: si no se envía, se conserva la actual.
exports.updateUser = async (req, res) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(400).json({ mensaje: "El id no es válido" });
        }

        const { nombre, email, password } = req.body || {};
        const validationError = validateUserData({ nombre, email, password }, false);

        if (validationError) {
            return res.status(400).json({ mensaje: validationError });
        }

        const pool = await poolPromise;
        const request = pool.request()
            .input("id", sql.Int, id)
            .input("nombre", sql.NVarChar(100), nombre.trim())
            .input("email", sql.NVarChar(150), email.trim().toLowerCase());

        let passwordSet = "";

        if (password) {
            request.input("password", sql.NVarChar(255), await hashPassword(password));
            passwordSet = ", password = @password";
        }

        const result = await request.query(`
            UPDATE Users
            SET nombre = @nombre,
                email = @email${passwordSet}
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
        if (isDuplicateEmail(error)) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar el usuario"
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(400).json({ mensaje: "El id no es válido" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, id)
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
        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar el usuario"
        });
    }
};
