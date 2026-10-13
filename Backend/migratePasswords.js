
require("dotenv").config();

const { sql, poolPromise } = require("./db");
const { hashPassword } = require("./passwordUtils");

async function migratePasswords() {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT id, password
            FROM Users
            WHERE password IS NOT NULL
        `);

        for (const user of result.recordset) {
            if (user.password.includes(":")) {
                continue;
            }

            const hashedPassword = await hashPassword(user.password);

            await pool.request()
                .input("id", sql.Int, user.id)
                .input("password", sql.NVarChar(255), hashedPassword)
                .query(`
                    UPDATE Users
                    SET password = @password
                    WHERE id = @id
                `);

            console.log(`Contraseña actualizada para el usuario ${user.id}`);
        }

        console.log("Migración terminada");
    } catch (error) {
        console.error("Error en la migración:", error);
    } finally {
        process.exit();
    }
}

migratePasswords();
