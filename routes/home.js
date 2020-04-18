const express = require('express');
const router = express.Router();
const debug = require('../utils/logging');

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/clients/');
    }
    next();
};

router.get('/', isNotAuthenticated, async function (req, res, next) {
    debug.log.info('home');
    try {
        res.render('landing');
    } catch (e) {
        next(e);
    }
});


module.exports = router;
