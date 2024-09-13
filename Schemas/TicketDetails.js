const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

const EventDetails = require("./EventDetails");
const TicketDetails = sequelize.define(
  "TicketDetails",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EventDetails, // Should match the model name exactly
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "TicketDetails",
  }
);

TicketDetails.belongsTo(EventDetails, {
  foreignKey: "eventId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});



sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Tables have been created if not exists");
  })
  .catch((err) => {
    console.error("Unable to sync models to the database:", err);
  });

module.exports = TicketDetails;
