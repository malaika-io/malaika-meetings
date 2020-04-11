const {Sequelize} = require("sequelize");
const bcrypt = require('bcrypt');

class User extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                username: {type: Sequelize.STRING, allowNull: true},
                online: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false, allowNull: false
                },
                password: {
                    type: DataTypes.STRING, allowNull: false
                },
                first_name: {type: Sequelize.STRING, allowNull: true},
                last_name: {type: Sequelize.STRING, allowNull: true},
                email: {
                    type: DataTypes.STRING, allowNull: false, unique: true, validate: {isEmail: true}
                },
                peer: {type: Sequelize.STRING, allowNull: true, defaultValue: null},
                socketId: {type: Sequelize.STRING(45), allowNull: true},
                sdpOffer: {type: Sequelize.TEXT('tiny'), allowNull: true, defaultValue: null},
                active: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true, allowNull: false
                },
                fullName: {
                    type: DataTypes.VIRTUAL,
                    get() {
                        return `${this.first_name} ${this.last_name}`;
                    },
                    set(value) {
                        throw new Error('Do not try to set the `fullName` value!');
                    }
                }
            }, {
                indexes: [{
                    unique: true,
                    fields: ["username"]
                },
                    {
                        unique: true,
                        fields: ["email"]
                    }
                ],
                tableName: "Users",
                modelName: "User",
                underscored: true,
                sequelize: sequelize
            }
        );
    }

    comparePassword = (password, hash) => {
        return !!bcrypt.compareSync(password, hash)
    };

    resetPassword = async function (hash) {
        this.update({password: hash});
    };

    deactivate() {
        return this.update({active: false});
    }
}

module.exports = User;
