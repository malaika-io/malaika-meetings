const express = require('express');
const router = express.Router();
const debug = require('../utils/logger');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
};

router.get('/', isAuthenticated, async function (req, res) {
    debug.info('logout');
    req.logout();
    res.redirect("/login")
});


module.exports = router;
