const axios = require('axios');

module.exports.send = async function (body) {

    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic YmU3OTIwOTEtZmQ1YS00YWU3LTg1YTUtZDIxNzQ1MDJkZmVk"
    };

    let message = {
        app_id: "87997d16-ab3a-478f-ace8-a640af97cfc5",
        include_player_ids: body.tokens,
        contents: {"en": body.content}
    };
    console.log('message', message)

    try {
        const response =  await axios({
            method: 'POST',
            url: 'https://onesignal.com/api/v1/notifications',
            data: message,
            headers: headers,
            json: true
        });
        console.log(response)
    } catch (e) {
        console.log('ENotfication', e)
        const err = e.response.data.errors[0];
        throw (new Error(err));
    }

};
