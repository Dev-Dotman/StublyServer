const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const randomatic = require("randomatic");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const axios = require("axios");
const crypto = require('crypto');
const moment = require('moment');
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const { Op } = require("sequelize");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { EventDetails, TicketDetails, GuestDetails } = require("./Schemas/EventDetails");



const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

const app = express();
const port = 3005;
app.use(cors());
app.use(bodyParser.json());
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY;

const generateUserId = () => {
  return uuidv4().replace(/-/g, "").substr(0, 6);
};

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/get-image", (req, res) => {
  const { imagePath } = req.body; // Get the image path from the request body
  const imageFullPath = path.join(__dirname, imagePath); // Construct the full path to the image

  res.sendFile(imageFullPath, (err) => {
    if (err) {
      console.error("Failed to send image:", err);
    }
  });
});

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({
  destination: "./uploads/", // path to save uploaded images
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 4000000 }, // limit file size to 1MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}); // Ensure field name matches

function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

const User = sequelize.define("User", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

const ManagerNotification = sequelize.define(
  "ManagerNotification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);


sequelize
  .sync({ alter: true }) // `alter: true` modifies the existing tables to match the model
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Error synchronizing models:", err);
  });

sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to MySQL database has been established successfully."
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_KEY,
  },
});

async function sendEmail(to, text) {
  const mailOptions = {
    from: "your-email@gmail.com",
    to,
    subject: "Haztech SOS MESSAGE",
    html: text,
  };

  return transporter.sendMail(mailOptions);
}

function generateEmailContent(recipientName, message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatFlow Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border: 1px solid #ddd;
            }
            .header {
                background-color: #725c3a;
                padding: 10px;
                text-align: center;
                color: #ffffff;
            }
            .content {
                padding: 20px;
                color: #333333;
            }
            .footer {
                background-color: #725c3a;
                padding: 10px;
                text-align: center;
                color: #ffffff;
            }
            .button {
                background-color: #725c3a;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                display: inline-block;
                margin: 10px 0;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Stubbly</h1>
            </div>
            <div class="content">
                <h2>Hello, ${recipientName}!</h2>
                <p>${message}</p>
                <a href="#" class="button">Learn More</a>
            </div>
            <div class="footer">
                <p>&copy; 2024 WhatFlow. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  // Generate OTP
  const otp = generateUserId();

  try {
    // Send email with nodemailer

    const message = `Your Email verification OTP is ${otp}, this OTP will expire in 10 minutes `;

    const emailContent = generateEmailContent(email, message);

    await sendEmail(email, emailContent);

    // You can optionally save the OTP in your database for verification purposes

    const message2 = `An OTP was sent to your email`;
    const title = `Stubbly`;

    await Notification.create({
      userEmail: email,
      title,
      message: message2,
    });
    res.status(200).json({ message: "OTP sent successfully.", otp: otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res
      .status(500)
      .json({ error: "Failed to send OTP. Please try again later." });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error("User with this email already exists:", email);
      return res.status(400).json({
        error: `Sorry ${firstName}, a user with this email already exists.`,
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      message: "user registered successfully",
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        error: "User not found. \n Are you sure you have an account?",
      });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const userToken = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }; // Payload to include in the token
    const accessToken = jwt.sign(userToken, process.env.JWT_KEY, {
      expiresIn: TOKEN_EXPIRY,
    });
    res.json({ message: "Login successful", accessToken });

    const now = new Date();

    const message = `Welcome back ${user.firstName}`;
    const title = `Account Sign In`;
    const message2 = `Account login for ${user.firstName} ${
      user.lastName
    } on ${now.toLocaleDateString()} ${now.toLocaleTimeString()} `;
    await Notification.create({
      userEmail: email,
      title,
      message,
    });

    const emailContent = generateEmailContent(user.firstName, message2);
    await sendEmail(email, emailContent);
  } catch (error) {
    res.status(500).json({ error: "Database error: " + error });
    console.error("error: ", error);
  }
});

app.post("/managerLogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        error: "User not found. \n Are you sure you have an account?",
      });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const userToken = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }; // Payload to include in the token
    const accessToken = jwt.sign(userToken, process.env.JWT_KEY, {
      expiresIn: TOKEN_EXPIRY,
    });
    res.json({ message: "Login successful", accessToken });

    const now = new Date();

    const message = `Welcome back ${user.firstName}`;
    const title = `Manager Account Sign In`;
    const message2 = `Manager Account login for ${user.firstName} ${
      user.lastName
    } on ${now.toLocaleDateString()} ${now.toLocaleTimeString()} `;
    await ManagerNotification.create({
      userEmail: email,
      title,
      message,
    });

    const emailContent = generateEmailContent(user.firstName, message2);
    await sendEmail(email, emailContent);
  } catch (error) {
    res.status(500).json({ error: "Database error: " + error });
    console.error("error: ", error);
  }
});

const createEvent = async (eventData, socialData) => {
  try {
    const event = await EventDetails.create(eventData);
    socialData.eventId = event.id;
    const eventSocial = await EventSocial.create(socialData);
    console.log("Event created: ", event, " with social data: ", eventSocial);
  } catch (error) {
    console.error("Error creating event: ", error);
  }
};

app.get("/api/events", async (req, res) => {
  const { category } = req.query;

  try {
    const queryOptions = {
      include: [
        {
          model: EventSocial,
          as: "EventSocial",
        },
      ],
    };

    if (category) {
      queryOptions.where = { category };
    }

    const events = await EventDetails.findAll(queryOptions);
    console.log(events);

    res.json(events);
  } catch (error) {
    console.error("Error fetching events: ", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/allevents", async (req, res) => {
  try {
    const events = await EventDetails.findAll({
      include: [
        {
          model: EventSocial,
          as: "social",
        },
      ],
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events: ", error);
    res.status(500).send("Server error");
  }
});

app.post("/notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const notifications = await Notification.findAll({
      where: { userEmail: email, read: false },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.post("/notifications2", async (req, res) => {
  const { email } = req.query;

  try {
    const notifications = await Notification.findAll({
      where: { userEmail: email },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.put("/notifications/read", async (req, res) => {
  const { ids } = req.body;

  try {
    await Notification.update({ read: 1 }, { where: { id: ids } });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Error marking notifications as read" });
  }
});

app.post("/ManagerNotifications", async (req, res) => {
  const { email } = req.query;

  try {
    const notifications = await ManagerNotification.findAll({
      where: { userEmail: email, read: false },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.post("/ManagerNotifications2", async (req, res) => {
  const { email } = req.query;

  try {
    const notifications = await ManagerNotification.findAll({
      where: { userEmail: email },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.put("/ManagerNotifications/read", async (req, res) => {
  const { ids } = req.body;

  try {
    await ManagerNotification.update({ read: 1 }, { where: { id: ids } });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Error marking notifications as read" });
  }
});

app.post("/banks", async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACKKEY1}`,
      },
    });
    res.json({ banks: response.data.data });
  } catch (error) {
    res.status(500).send("Error fetching banks");
    console.error("error fetching banks :", error);
  }
});

app.post("/verify-bank-account", async (req, res) => {
  try {
    const { bankCode, accountNumber } = req.body;
    const accountInfo = await verifyBankAccount(bankCode, accountNumber);
    res.json(accountInfo);
    console.log(accountInfo);
  } catch (err) {
    console.error("Account Name Error: ", err);
  }
});

const verifyBankAccount = async (bankCode, accountNumber) => {
  const response = await axios.get(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACKKEY1}`,
      },
    }
  );
  return response.data;
};

const parseTicketsFromFormData = (reqBody) => {
  const tickets = reqBody.ticket.map(ticket => {
    return {
      name: ticket.name,
      currency: ticket.currency,
      price: ticket.price,
      quantity: ticket.quantity
    };
  });

  console.log(tickets);
  return tickets;
};


const formatDateForMySQL = (isoDate) => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

app.post("/createEvent", upload.any(), async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      eventTitle,
      date,
      time,
      endTime,
      creator,
      address,
      landmark,
      state,
      city,
      postcode,
      tags,
      description,
      categories,
      bankName,
      accountNumber,
    } = req.body;

    const eventImages = req.files.filter((file) => file.fieldname.startsWith("photos["));
    const eventImage = eventImages[0] ? eventImages[0].filename : null;

    // Parse guests array from the request body
    const guests = [];
    const guestPhotoFiles = req.files.filter((file) =>
      file.fieldname.startsWith("guests[")
    );

    // Extract guests from the request body and associate the corresponding photos
    guestPhotoFiles.forEach((file) => {
      const match = file.fieldname.match(/guests\[(\d+)\]\[photo\]/);
      if (match) {
        const index = parseInt(match[1], 10);
        const guest = guests[index] || {};
        guest.photo = file.filename;
        guests[index] = guest;
      }
    });

    // Fill in the rest of the guest details
    req.body.guests.forEach((guest, index) => {
      guests[index] = {
        ...guests[index],
        name: guest.name,
        title: guest.title,
      };
    });




    // Store the event details in the EventDetails model
    const newEvent = await EventDetails.create(
      {
        title: eventTitle,
        date,
        startTime: formatDateForMySQL(time),
        endTime : formatDateForMySQL(endTime),
        creator,
        address,
        landmark,
        state,
        city,
        postcode,
        tags,
        description,
        categories,
        bankName,
        accountNumber,
        eventImage
      },
      { transaction: t }
    );

    // Store the guests' details in the GuestDetails model
    for (const guest of guests) {
      await GuestDetails.create(
        {
          eventId: newEvent.id,
          name: guest.name,
          title: guest.title,
          photo: guest.photo || null,
        },
        { transaction: t }
      );
    }

    // Store ticket details in the TicketDetails model
    console.log(req.body)
    const tickets = parseTicketsFromFormData(req.body);

    if (tickets.length === 0) {
      throw new Error("No tickets provided.");
    }

    // Validate each ticket
    tickets.forEach((ticket, index) => {
      if (!ticket.name || ticket.name.trim() === "") {
        throw new Error(`Ticket name is required for ticket at index ${index}.`);
      }
      if (!ticket.currency || ticket.currency.trim() === "") {
        throw new Error(`Currency is required for ticket at index ${index}.`);
      }
      if (!ticket.price || isNaN(ticket.price) || Number(ticket.price) <= 0) {
        throw new Error(`Valid price is required for ticket at index ${index}.`);
      }
      if (!ticket.quantity || isNaN(ticket.quantity) || Number(ticket.quantity) <= 0) {
        throw new Error(`Valid quantity is required for ticket at index ${index}.`);
      }
    });

    // Assuming you have `newEvent` object already created that holds the eventI

    // Save each ticket to the database
    for (const ticket of tickets) {
      await TicketDetails.create(
        {
          eventId: newEvent.id,
          name: ticket.name,
          currency: ticket.currency,
          price: ticket.price,
          quantity: ticket.quantity,
        },
        { transaction: t } // Use the transaction for each insert
      );
    }

    // Commit the transaction
    await t.commit();

    res.status(200).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error:", error);
    // Rollback the transaction in case of error
    await t.rollback();
    res.status(500).json({ error: "Failed to create event" });
  }
});

function generateEventToken(event) {
  // Parse the startDate
  const startDate = moment(event.startDate);

  // Extract date from startDate
  const datePart = startDate.format('YYYY-MM-DD'); // '2024-09-11'

  // Combine date with startTime
  const combinedDateTime = moment(`${datePart}T${event.startTime}`);

  // Calculate the expiration time in seconds
  const expiresIn = combinedDateTime.diff(moment(), 'seconds');

  // Define the payload for the JWT
  const payload = {
    id: event.id,
    title: event.title,
    date: event.startDate, // Full start date and time
    city: event.city,
    startTime: event.startTime // Including startTime in the payload
  };

  // Generate the token with expiration
  const token = jwt.sign(payload, process.env.EVENT_EXPIRY_KEY , { expiresIn: expiresIn > 0 ? expiresIn : 0 }); // Token expires at the specified time or immediately if time has passed
  return token;
}





app.post('/eventByCreator', async (req, res) => {
  const { creator } = req.body; // Extract creator from request body

  if (!creator) {
    console.log('message:', 'Creator is required');
    return res.status(400).json({ message: 'Creator is required' });
  }

  try {
    // Fetch all events created by the user
    const events = await EventDetails.findAll({ where: { creator } });

    if (!events || events.length === 0) {
      console.log('message:', 'Events not found for the given creator');
      return res.status(404).json({ message: 'Events not found for the given creator' });
    }

    // Organize guests and tickets for each event
    const response = await Promise.all(events.map(async (event) => {
      const eventId = event.id;

      // Generate URL with the hashed ID
      const eventUrl = `https://stublyevent.web.app/event/${generateEventToken(event)}`;

      // Fetch guests for the event
      const guests = await GuestDetails.findAll({ where: { eventId } });

      // Fetch tickets for the event
      const tickets = await TicketDetails.findAll({ where: { eventId } });

      // Organize each event with its respective guests and tickets
      return {
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          city: event.city,
          eventImage: event.eventImage,
          url: eventUrl // Attach the generated URL
        },
        guests: guests.map(guest => ({
          id: guest.id,
          name: guest.name,
          title: guest.title,
          photo: guest.photo
          // Add other guest fields here
        })),
        tickets: tickets.map(ticket => ({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          currency: ticket.currency,
          quantity: ticket.quantity
          // Add other ticket fields here
        }))
      };
    }));

    // Log the full details in the console using JSON.stringify for better readability
    console.log('events...', JSON.stringify(response, null, 2));

    // Send the response with all events and their respective guests and tickets
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/event/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, 'your-secret-key');
    const eventId = decoded.eventId;

    // Fetch event details based on the eventId
    const event = await EventDetails.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch guests and tickets for the event
    const guests = await GuestDetails.findAll({ where: { eventId } });
    const tickets = await TicketDetails.findAll({ where: { eventId } });

    // Send event details, guests, and tickets to the frontend
    res.json({
      event,
      guests,
      tickets,
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
