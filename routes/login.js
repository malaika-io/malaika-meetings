const express = require('express');
const router = express.Router();
const models = require('../models');
const {check, validationResult} = require('express-validator');
const debug = require('../utils/logger');


const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/organization');
    }
    next();
};

router.get('/',isNotAuthenticated, async function (req, res) {
    res.render('auth/login');

});

router.post('/', [
    check("email", "Empty email").isEmail(),
    check('password', "Le mots de passe n'est pas correcte").isLength({min: 5})
], async function (req, res) {
    debug.info('login');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("login", {errors: errors.array()});
    }
    const {email, password} = req.body;

    return execute().then((user) => {
        delete user.dataValues.password;

        return req.logIn(user.dataValues, (err) => {
            if (err) {
                return res.render("auth/login", {errors: new Error("Une erreur est survenue. Essayez d\'actualiser cette page")});
            }
            res.redirect(`/organization/${user.Organization.name}`);
        })
    }).catch((err) => {
        console.log(err);
        return res.render("auth/login", {
            errors: [{
                value: err,
                msg: err,
            }]
        });
    });


    async function execute() {
        try {
            const user = await models.User.findOne({
                where: {
                    email: email
                },
                include: [models.Organization]
            });

            if (!user) {
                throw new Error("Aucun compte n'est associé à cette adresse mail")
            }

            const isMatch = await user.comparePassword(password, user.password);
            if (!isMatch) {
                throw new Error("Mot de passe incorrect")
            }

            if (!user.active) {
                throw new Error("Votre compte a été bloqué")
            }

            if (!user.comparePassword(password, user.password)) {
                throw new Error("Mot de passe incorrect")
            }
            return user;

        } catch (e) {
            throw (e);
        }
    }
});

module.exports = router;
