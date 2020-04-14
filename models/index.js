const dotenv = require("dotenv");
dotenv.config();
const {Sequelize, Op} = require("sequelize");
const cls = require("continuation-local-storage");
const namespace = cls.createNamespace("malaika-namespace");
Sequelize.useCLS(namespace);

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USERNAME,
    process.env.MYSQL_PASSWORD,
    {
        dialect: 'mysql',
        define: {underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at'},
        logging: false,
        host: process.env.MYSQL_HOST,
        maxConcurrentQueries: 50,
        sync: {force: true},
        pool: {
            max: 10,
            min: 0,
            idle: 20000,
            acquire: 20000
        }
    }
);

const UserModel = require("./user");
const Organization = require("./organization");
const Invitation = require("./invitation");
const ChatMessage = require("./chatmessage");
const ChatRoom = require("./chatRoom");

const models = {
    User: UserModel.init(sequelize, Sequelize),
    Organization: Organization.init(sequelize, Sequelize),
    Invitation: Invitation.init(sequelize, Sequelize),
    ChatMessage: ChatMessage.init(sequelize, Sequelize),
    ChatRoom: ChatRoom.init(sequelize, Sequelize)
};

Object.values(models)
    .filter(model => typeof model.associate === "function")
    .forEach(model => model.associate(models));


//sequelize.sync();

models.sequelize = sequelize;
models.Sequelize = Sequelize;
models.Op = Op;
module.exports = models;
