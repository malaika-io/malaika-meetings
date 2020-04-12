const {Sequelize} = require("sequelize");

class Organization extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                name: {type: DataTypes.STRING, allowNull: true}
            }, {
                indexes: [{
                    unique: true,
                    fields: ["name"]
                }],
                tableName: "Organization",
                modelName: "Organization",
                underscored: true,
                sequelize: sequelize
            }
        );
    }
    static associate(models) {
        this.hasMany(models.User);
    }
}

module.exports = Organization;
