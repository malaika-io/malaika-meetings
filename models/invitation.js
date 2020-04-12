const {Sequelize} = require("sequelize");

class Invitation extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                uuid: {type: DataTypes.STRING(1234), allowNull: true},
                from: {type: DataTypes.STRING, allowNull: true},
                to: {type: DataTypes.STRING, allowNull: true},
                organization_name: {type: Sequelize.STRING, allowNull: true}
            }, {
                tableName: "Invitations",
                modelName: "Invitation",
                underscored: true,
                sequelize: sequelize
            }
        );
    }
}

module.exports = Invitation;
