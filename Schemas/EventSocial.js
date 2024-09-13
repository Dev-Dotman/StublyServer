const { Sequelize, DataTypes } = require("sequelize");

require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

const EventSocial = sequelize.define("EventSocial", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    references: {
      model: "EventDetails",
      key: "id",
    },
    allowNull: false,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  guest1Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guest1Photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guest2Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guest2Photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guest3Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guest3Photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

sequelize
  .sync()
  .then(() => {
    console.log("Tables have been created if not exists");
  })
  .catch((err) => {
    console.error("Unable to sync models to the database:", err);
  });

module.exports = EventSocial;
