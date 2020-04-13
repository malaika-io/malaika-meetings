const express = require('express');
const router = express.Router();
const models = require("../models");

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
};


router.get('/', isAuthenticated, async function (req, res) {
    const organizationName = req.user.Organization.name;
    res.redirect('organization/' + organizationName);
});

router.get('/:name', isAuthenticated, async function (req, res) {
    let organization = await models.Organization.findOne({
        where: {
            name: req.user.Organization.name
        },
        include: [models.User]
    });
    const users = organization.Users;
    const contacts = users.filter(item => {
        return item.id !== req.user.id;
    });
    res.render('admin', {
        contacts: contacts
    });
});


// About page route.
router.get('/:organisation/contact/:id', isAuthenticated, async function (req, res) {
    const contactId = req.params.id;
    let organization = await models.Organization.findOne({
        where: {
            name: req.user.Organization.name
        },
        include: [{model: models.User}]
    });
    const users = organization.Users;
    const contacts = users.filter(item => {
        return item.id !== req.user.id;
    });
    try {
        const contact = await models.User.findByPk(contactId);
        res.render('home', {
            contact: contact,
            contacts: contacts,
            chats: [1, 2]
        });
    } catch (e) {

    }
});

module.exports = router;
