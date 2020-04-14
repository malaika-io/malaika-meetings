const {Sequelize} = require("sequelize");

class ChatRoom extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                name: DataTypes.STRING,
            }, {
                tableName: "ChatRooms",
                modelName: "ChatRoom",
                underscored: true,
                sequelize: sequelize
            }
        );
    }

    static associate(models) {
        this.hasMany(models.ChatMessage, {
            foreignKey: "chatRoomId",
            sourceKey: "id",
        });
    }
}

module.exports = ChatRoom;
