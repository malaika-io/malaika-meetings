const {Sequelize} = require("sequelize");

class Room extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                name: DataTypes.STRING,
            }, {
                tableName: "Rooms",
                modelName: "Room",
                underscored: true,
                sequelize: sequelize
            }
        );
    }

    static associate(models) {
        this.hasMany(models.Message, {
            foreignKey: "chatRoomId",
            sourceKey: "id",
        });
    }
}

module.exports = Room;
