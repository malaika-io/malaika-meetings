const {Sequelize} = require("sequelize");

class ChatMessage extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                chatRoomId: DataTypes.INTEGER,
                receiver_id: DataTypes.STRING,
                receiver_name: DataTypes.STRING,
                sender_id: DataTypes.STRING ,
                sender_name: DataTypes.STRING ,
                content: DataTypes.TEXT,
                read: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false, allowNull: false
                },
            }, {
                tableName: "ChatMessages",
                modelName: "ChatMessage",
                underscored: true,
                sequelize: sequelize
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.ChatRoom, {
            foreignKey: 'chatRoomId',
            targetKey: 'id'
        });
    }
}

module.exports = ChatMessage;
