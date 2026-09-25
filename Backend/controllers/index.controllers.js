exports.home = (req, res) => {
    res.json({
        mensaje: "Bienvenido a mi REST API"
    });
};

exports.marco = (req, res) => {
    res.json({
        mensaje: "Hola, soy Betsy"
    });
};

exports.ping = (req, res) => {
    res.json({
        mensaje: "pong"
    });
};