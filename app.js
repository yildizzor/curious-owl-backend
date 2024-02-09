// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");
const { isAuthenticated } = require("./middelwares/jwt.midelware.js");
const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const profileRoutes = require("./routes/profile.routes");
app.use("/api", profileRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const concertsRoutes = require("./routes/concerts.routes.js");
app.use("/api", concertsRoutes);

const theatersRoutes = require("./routes/theaters.routes.js");
app.use("/api", theatersRoutes);

const muesumsRoutes = require("./routes/museum.routes.js");
app.use("/api", muesumsRoutes);

const restaurantsRoutes = require("./routes/restaurant.routes.js");
app.use("/api", restaurantsRoutes);

const booksRoutes = require("./routes/book.routes.js");
app.use("/api", booksRoutes);

const eventsRoutes = require("./routes/event.routes.js");
app.use("/api", eventsRoutes);

const reviewRoutes = require("./routes/review.routes.js");
app.use("/api", reviewRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
