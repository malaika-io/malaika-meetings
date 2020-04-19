'use strict';
const bcrypt = require('bcrypt');
const password = "Lyna2009";
const moment = require("moment");
module.exports = {
    up: (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert('Team', [{
            id: 1,
            name: "libheros",
            created_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        }], {});

    },

    down: (queryInterface, Sequelize) => {

    }
};
