const express = require('express');
const router = express.Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const xss = require('xss');
const {check, validationResult} = require('express-validator');
const debug = require('../logger');

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/organization');
    }
    next();
};

router.get('/', isNotAuthenticated, async function (req, res) {
    res.render('signup');
});

router.post('/', [
    // username must be an email
    check("email", "L'adresse email n'est pas correcte").isEmail(),
    check("first_name", "Empty first_name").not().isEmpty(),
    check("last_name", "Empty last_name").not().isEmpty(),
    check("organization", "Empty organization").not().isEmpty(),
    check('password', "Le mots de passe n'est pas correcte").isLength({min: 5})
], async function (req, res) {
    debug.info('register');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("signup", {errors: errors.array()});
    }

    const {email, organization, password, last_name, first_name} = req.body;
    const userInfos = {
        password: bcrypt.hashSync(password, 10),
        organization: xss(organization),
        last_name: xss(last_name),
        first_name: xss(first_name),
        email: xss(email.toLowerCase()),
    };

    return execute()
        .then((user) => {
            return req.logIn(user, (err) => {
                if (err) {
                    return res.render("signup", {errors: new Error("Une erreur est survenue. Essayez d\'actualiser cette page")});
                }
                res.redirect(`/organization/${user.Organization.name}`);
            })
        }).catch((err) => {
            return res.render("signup", {errors: errors.array()});
        });

    async function execute() {
        try {
            const new_user = await models.sequelize.transaction(async function (t) {
                let newUser = await models.User.create(userInfos, {transaction: t});
                let newOrganization = await models.Organization.create({name: organization}, {transaction: t});
                await newUser.setOrganization(newOrganization, {transaction: t});
                return newUser
            });
            await new_user.reload({include: [models.Organization]});
            return new_user;
        } catch (err) {
            console.log(err)
            if (err.name === 'SequelizeUniqueConstraintError') {
                throw new Error("Cette adresse email est déjà utilisée.");
            }
            if (err.name === 'SequelizeValidationError') {
                throw new Error("Veuillez vérifier le format de votre adresse email");
            }
            throw new Error("Une erreur s\'est produite lors de la création de votre compte");
        }
    }
});


router.get('/invite/:id', async function (req, res) {
    const invitationId = req.params.id;
    try {
        const invitation = await models.Invitation.findOne({
            where: {
                uuid: invitationId
            }
        });
        if (!invitation) {
            return res.render('404', {message: "inviation n'exsite pas "})
        }
        res.render('signup-invite', {
            organization: invitation.organization_name,
            email: invitation.to
        });
    } catch (e) {

    }
});


router.post('/invite', async function (req, res) {
    const {organization, password, last_name, first_name, email} = req.body;
    const userInfos = {
        password: bcrypt.hashSync(password, 10),
        organization: xss(organization),
        last_name: xss(last_name),
        first_name: xss(first_name),
        email: xss(email.toLowerCase()),
    };

    return execute()
        .then((user) => {
            return req.logIn(user, (err) => {
                if (err) {
                    return res.render("signup", {errors: new Error("Une erreur est survenue. Essayez d\'actualiser cette page")});
                }
                res.redirect(`/organization/${user.Organization.name}`);
            })
        }).catch((err) => {
            return res.render("signup", {
                errors: [{}]
            });
        });

    async function execute() {
        try {
            const new_user = await models.sequelize.transaction(async function (t) {
                let newUser = await models.User.create(userInfos, {transaction: t});
                let newOrganization = await models.Organization.findOne({name: organization}, {transaction: t});
                await newUser.setOrganization(newOrganization, {transaction: t});
                return newUser
            });
            await new_user.reload({include: [models.Organization]});
            return new_user;
        } catch (err) {
            console.log(err)
            if (err.name === 'SequelizeUniqueConstraintError') {
                throw new Error("Cette adresse email est déjà utilisée.");
            }
            if (err.name === 'SequelizeValidationError') {
                throw new Error("Veuillez vérifier le format de votre adresse email");
            }
            throw new Error("Une erreur s\'est produite lors de la création de votre compte");
        }
    }
});

module.exports = router;
