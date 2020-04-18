const {Sequelize} = require("sequelize");

class Team extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                name: {type: DataTypes.STRING, allowNull: true},
                uuid: {type: DataTypes.STRING(1234), allowNull: true}
            }, {
                indexes: [{
                    unique: true,
                    fields: ["name"]
                }],
                tableName: "Teams",
                modelName: "Team",
                underscored: true,
                sequelize: sequelize
            }
        );
    }
    static associate(models) {
        this.hasMany(models.User);
    }
}

module.exports = Team;
