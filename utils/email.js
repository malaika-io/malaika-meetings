const Email = require('email-templates');
//var postmark = require("postmark");
/*
// Send an email:
var client = new postmark.ServerClient("62529f4b-87b8-4618-a225-057b9c807baa");

client.sendEmail({
    "From": "contact@malaika.io",
    "To": "contact@karimmhamdi.fr",
    "Subject": "Test",
    "TextBody": "Hello from Postmark!"
});
*/

const email = new Email({
    message: {
        from: 'contact@malaika.io'
    },
    send: true,
    transport: {
        host: 'mail.gandi.net',
        port: 465,
        //587
        ssl: false,
        tls: false,
        auth: {
            user: 'contact@malaika.io',
            pass: 'Katkout198322Karim'
        }
    },
    views: {
        options: {
            extension: 'pug',
        },
        root: 'emails',
    }
});

function send(data) {
    return email.send({
        template: 'invite',
        message: {
            from: 'Malaika <contact@malaika.io>',
            to: data.to
        },
        locals: {
            invitedBy: data.invitedBy,
            organization: data.organization_name,
            url: data.url
        }
    }).catch(console.error);
}

module.exports = {
    send: send
};
