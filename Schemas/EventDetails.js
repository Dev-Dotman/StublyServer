const { Sequelize, DataTypes } = require("sequelize");

require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME2, process.env.USER, process.env.PASSWORD, {
  host: process.env.DB_HOST2,
  dialect: "postgres",
  // protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // This line is important for connecting to Supabase
    },
  },
  port: 6543, // Default PostgreSQL port
});

const EventDetails = sequelize.define(
  "EventDetails",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    creator: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    landmark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categories: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventImage: {
      type: DataTypes.STRING,
      allowNull: true, // allow null in case no image is uploaded
    },
  },
  {
    timestamps: true,
    tableName: "EventDetails",
  }
);

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

// GuestDetails Model
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
        key: "id", // Referencing the id field in EventDetails
      }, // Optional: Cascade update behavior
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
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
    tableName: "GuestDetails", // Explicitly define the table name
  }
);

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_request_id: {
      type: DataTypes.TEXT, // Change to STRING for the key obtained from the frontend
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    amount_platform: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    amount_merchant: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    transaction_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    payer_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    merchantWalletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "transactions",
    timestamps: false,
  }
);

// Define associations
GuestDetails.belongsTo(EventDetails, {
  foreignKey: "eventId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Sync the models with the database
sequelize.sync({ alter: true }).then(() => {
  console.log("Database & tables created!");
});

module.exports = {
  EventDetails,
  TicketDetails,
  GuestDetails,
  Transaction
};
