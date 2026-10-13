
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);

    return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
    const parts = storedPassword.split(":");

    if (parts.length !== 2) {
        return false;
    }

    const [salt, storedHash] = parts;
    const hash = await scrypt(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (hash.length !== storedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(hash, storedBuffer);
}

module.exports = {
    hashPassword,
    verifyPassword
};
