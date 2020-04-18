const express = require('express');
const router = express.Router();
const models = require("../models");
const debug = require('../utils/logging');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
};


router.get('/', isAuthenticated, async function (req, res,next) {
    const uuid = req.user.uuid;
    console.log('uuid', uuid)
    if (uuid) {
        return res.redirect(`/clients/${uuid}`);
    }

});

router.get('/:uuid', isAuthenticated, async function (req, res,next) {
    const uuid = req.params.uuid;
    const user_uuid = req.user.uuid;
    if (uuid !== user_uuid) {
        res.redirect(`/clients/${user_uuid}`);
    }
    try {
        const organizationName = req.user.Team.name;
        const user_id = req.user.id;
        let organization = await models.Team.findOne({
            where: {
                name: organizationName
            },
            include: [models.User]
        });
        const contacts = organization.Users.filter(contact => {
            return contact.id !== req.user.id;
        });

        const lastContactChatArray = await models.Message.findAll({
            limit: 1,
            where: {
                [models.Op.or]: [{sender_id: user_id}, {receiver_id: user_id}]
            },
            order: [['created_at', 'DESC']]
        });

        let lastContactId;
        let chats = [];
        let contact = null;

        if (lastContactChatArray.length > 0) {
            let lastContactChat = lastContactChatArray[0];
            /***
             * TODO  delete JSON.parse  after next migration
             */
            if (JSON.parse(lastContactChat.sender_id) === user_id) {
                lastContactId = lastContactChat.receiver_id;
            } else if (JSON.parse(lastContactChat.receiver_id) === user_id) {
                lastContactId = lastContactChat.sender_id;
            } else {
                lastContactId = null;
            }
        }
        if (lastContactId) {
            contact = await models.User.findByPk(lastContactId);
            chats = await getMessages(lastContactId, user_id);
        }
        const data = {
            contact: contact,
            contacts: contacts,
            chats: chats,
            messages: [],
            messagesGroupe: []
        };
        return res.render('account/home', data);
    } catch (error) {
        next(error);
    }
});

router.get('/:uuid/contacts/:contact_uuid', isAuthenticated, async function (req, res,next) {
    const contactUuid = req.params.contact_uuid;
    const uuid = req.params.uuid;
    const user_uuid = req.user.uuid;
    const user_id = req.user.id;

    if (uuid !== user_uuid) {
        res.redirect(`/clients/${user_uuid}`);
    }
    try {
        const organizationName = req.user.Team.name;
        let organization = await models.Team.findOne({
            where: {
                name: organizationName
            },
            include: [models.User]
        });
        const contacts = organization.Users.filter(contact => {
            return contact.id !== req.user.id;
        });

        let contact = await models.User.findOne({
            where: {
                uuid: contactUuid
            }
        });
        let chats = await getMessages(contact.id, user_id);

        return res.render('account/home', {
            contact: contact,
            contacts: contacts,
            chats: chats,
            messages: [],
            messagesGroupe: []
        });
    }
    catch (e) {
        next(e);
    }
});

async function getMessages(sender_id, receiver_id) {
    console.log(sender_id, receiver_id)
    try {
        return models.Message.findAll({
            where: {
                [models.Op.or]: [{
                    [models.Op.and]: [
                        {
                            sender_id: {
                                [models.Op.eq]: sender_id
                            }
                        }, {
                            receiver_id: {
                                [models.Op.eq]: receiver_id
                            }
                        }
                    ]
                },
                    {
                        [models.Op.and]: [
                            {
                                sender_id: {
                                    [models.Op.eq]: receiver_id
                                }
                            }, {
                                receiver_id: {
                                    [models.Op.eq]: sender_id
                                }
                            }
                        ]
                    }]
            },
            order: [['created_at', 'ASC']]
        })
    } catch (e) {
        console.log(e)
        throw e;
    }
}

module.exports = router;

