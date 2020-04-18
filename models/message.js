const {Sequelize} = require("sequelize");

class Message extends Sequelize.Model {

    static init(sequelize, DataTypes) {
        return super.init(
            {
                chatRoomId: DataTypes.INTEGER,
                receiver_id: DataTypes.INTEGER,
                receiver_name: DataTypes.STRING,
                sender_id: DataTypes.INTEGER,
                sender_name: DataTypes.STRING,
                content: DataTypes.TEXT,
                read: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false, allowNull: false
                },
            }, {
                tableName: "Messages",
                modelName: "Message",
                underscored: true,
                sequelize: sequelize
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Room, {
            foreignKey: 'chatRoomId',
            targetKey: 'id'
        });
    }
}

module.exports = Message;
