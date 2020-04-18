const express = require('express');
const router = express.Router();
const debug = require('../utils/logger');

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/clients/');
    }
    next();
};

router.get('/', isNotAuthenticated, async function (req, res, next) {
    debug.info('home');
    try {
        res.render('landng');
    } catch (e) {
        next(e);
    }
});


module.exports = router;
