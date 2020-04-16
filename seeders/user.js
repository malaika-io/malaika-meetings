'use strict';
const bcrypt = require('bcrypt');
const password = "Lyna2009";
const moment = require("moment");


module.exports = {
    up: (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert('Users', [{
            id: 1,
            organization_id: 1,
            organization: "libheros",
            online: '0',
            password: bcrypt.hashSync(password, 10),
            first_name: "mhamdi",
            last_name: "karim",
            email: "kmhamdi@libheros.fr",
            active: '1',
            created_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        },
            {
                id: 2,
                organization: "libheros",
                organization_id: 1,
                online: '0',
                password: bcrypt.hashSync(password, 10),
                first_name: "oliveira",
                last_name: "angelique",
                email: "kmhamdi@fiducial.fr",
                active: '1',
                created_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
            }], {});

    },

    down: (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.bulkDelete('People', null, {});
        */
    }
};
