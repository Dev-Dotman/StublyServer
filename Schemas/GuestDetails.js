const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

// Import EventDetails model to establish the foreign key relationship
const EventDetails = require("./EventDetails");

// Define the GuestDetails model
const GuestDetails = sequelize.define(
  "GuestDetails",
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
        model: EventDetails, // Reference the EventDetails model
        key:'id',           // Referencing the id field in EventDetails
      }  // Optional: Cascade update behavior
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null if no photo is uploaded
    },
  },
  {
    timestamps: true,        // Automatically add createdAt and updatedAt timestamps
    tableName: "GuestDetails", // Explicitly define the table name
  }
);

// Define associations
GuestDetails.belongsTo(EventDetails, {
  foreignKey: "eventId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Sync the model with the database
sequelize
  .sync() // Use alter: true for development, but be cautious in production
  .then(() => {
    console.log("Tables have been created or altered if they already exist");
  })
  .catch((err) => {
    console.error("Unable to sync models to the database:", err.message);
    console.error(err.stack); // Log stack trace for more details
  });

module.exports = GuestDetails;
