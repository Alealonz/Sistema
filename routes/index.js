const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

router.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'productos.html'));
});

router.get('/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'contacto.html'));
});

module.exports = router;
