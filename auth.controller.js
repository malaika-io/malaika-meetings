const models = require('./models');
const bcrypt = require('bcrypt');
const xss = require('xss');
const {check, validationResult} = require('express-validator');
const debug = require('./logger');

exports.register = (req, res, next) => {
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

};


exports.login = async function (req, res) {
    debug.info('login');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("login", {errors: errors.array()});
    }
    const {email, password} = req.body;

    return execute()
        .then((user) => {
            delete user.dataValues.password;

            return req.logIn(user.dataValues, (err) => {
                if (err) {
                    console.log('err', err)
                    return res.render("login", {errors: new Error("Une erreur est survenue. Essayez d\'actualiser cette page")});
                }
                res.redirect(`/organization/${user.Organization.name}`);
            })
        }).catch((err) => {
            console.log(err);
            return res.render("login", {
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
                }
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
};

exports.resetPassword = function (req, res, next) {
    let {email} = req.body;

    return execute()
        .then(() => {
            res.json({"OK": true});
        })
        .catch((err) => {
            next(err);
        });

    async function execute() {
        try {
            const user = await models.User.findOne({
                where: {
                    email: email
                }
            });
            if (!user) {
                //return Promise.reject(new errors.AuthFailed("Aucun compte n'est associé à cette adresse mail"));
            }
            if (!user.active) {
                //return Promise.reject(new errors.AuthFailed("ACCOUNT_REVOKED"));
            }

        } catch (e) {
            throw e;
        }
    }

};

exports.logout = async function (req, res) {
    if (req.isAuthenticated()) {
        req.logout();
        res.redirect("/login");
    }
};

