const express = require('express');
const router = express.Router();
const models = require("../models");
const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
    contactPoints: ['localhost:32769'],
    localDataCenter: 'datacenter1',
    //authProvider: new cassandra.auth.PlainTextAuthProvider('developer', 'devpassword'),
    keyspace: 'mykeyspace'
});


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

    const lastContactChat = await models.ChatMessage.findAll({
        limit: 1,
        where: {
            [models.Op.or]: [{sender_id: req.user.id}, {receiver_id: req.user.id}]
        },
        order: [['created_at', 'DESC']]
    });
    console.log('lastContactChat', lastContactChat[0].sender_id)

    const chats = await getMessages(req.user.id, lastContactChat[0].sender_id);

    res.render('home', {
        contact: null,
        contacts: contacts,
        chats: chats,
        messages: [],
        messagesGroupe: []
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
        //contact.fullName = `${contact.first_name} ${contact.last_name}`;
        const chats = await getMessages(contactId, req.user.id);
        console.log('chats', chats.length)
        res.render('home', {
            contact: contact,
            contacts: contacts,
            chats: chats,
            messages: [],
            messagesGroupe: []
        });
    } catch (e) {
        console.log(e)
    }
});

async function getMessages(sender_id, receiver_id) {
    console.log(sender_id, receiver_id)
    try {
        return models.ChatMessage.findAll({
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
            order: [['created_at', 'DESC']]
        })
    } catch (e) {
        console.log(e)
        throw e;
    }
}

module.exports = router;

