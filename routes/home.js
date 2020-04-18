const express = require('express');
const router = express.Router();
const debug = require('../utils/logger');

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/clients/');
    }
    next();
};

router.get('/', isNotAuthenticated,async function (req, res) {
    debug.info('home');
    res.render('landing');
});


module.exports = router;
