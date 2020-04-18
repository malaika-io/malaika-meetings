const express = require('express');
const router = express.Router();
const models = require("../models");
const uuidv4 = require('uuid/v4')


router.get('/', async function (req, res) {
    res.send('Wiki home page');
});

router.post('/invite', async function (req, res) {
    let uuid4 = uuidv4();
    const url = process.env.INVITE_URL + uuid4;
    const organization = req.user.Organization.name;
    await models.Invitation.create({
        organization_name: organization,
        from: req.user.email,
        to: req.body.email,
        uuid: uuid4
    });
    await models.User.inviteUser({
        url,
        organization_name: req.user.Organization.name,
        to: req.body.email,
        from: req.user.fullName
    });

    res.redirect(`/organization/${organization}`);
});

module.exports = router;