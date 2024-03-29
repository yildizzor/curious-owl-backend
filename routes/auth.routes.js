const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const saltRounds = 10;
const { isAuthenticated } = require("./../middelwares/jwt.midelware");

const isObjectEmpty = (objectName) => {
  return Object.keys(objectName).length === 0;
};

router.post("/signup", uploader.single("imageUrl"), async (req, res, next) => {
  const errors = {};
  const { name, email, password } = req.body;

  // Input validation
  if (!name) errors.name = "Name is required!";
  if (!email) errors.email = "Email is required!";
  if (!password) errors.password = "Password is required!";

  if (!isObjectEmpty(errors)) {
    res.status(400).json(errors);
    return;
  }

  // Check user is not in database

  try {
    let response = await User.findOne({ email: req.body.email });

    if (response) {
      errors.email = "User already exist.";
      res.status(400).json(errors);
    } else {
      const salt = bcryptjs.genSaltSync(saltRounds);
      const hashedPassword = bcryptjs.hashSync(password, salt);

      let profilePhoto;
      if (req.file) {
        profilePhoto = req.file.path;
        console.log(req.file.path);
      }
      const newUser = await User.create({
        ...req.body,

        imageUrl: profilePhoto,
      });

      newUser.password = hashedPassword;
      await newUser.save();

      res.status(201).json({ name: newUser.name });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof mongoose.Error.ValidationError) {
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
      res.status(400).json(errors);
    } else if (err.code === 11000) {
      errors.email = "Email is already used.";
      res.status(500).json(errors);
    } else {
      errors.message = "Internal server error occurs";
      res.status(500).json(errors);
    }
  }
});

router.post("/login", (req, res, next) => {
  const errors = {};
  const { email, password } = req.body;

  console.log(req.body);

  // Input validation
  if (!email) errors.email = "Email is required!";
  if (!password) errors.password = "Password is required!";

  if (!isObjectEmpty(errors)) {
    res.status(400).json(errors);
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        errors.message = "User is not found.";
        res.status(401).json(errors);
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcryptjs.compareSync(
        password,
        foundUser.password
      );

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, name, imageUrl, country } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name, imageUrl, country };

        // Create and sign the token
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "46h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Email and password do not match" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

router.get("/verify", isAuthenticated, (req, res, next) => {
  console.log("req.payload", req.payload);

  res.status(200).json(req.payload);
});

module.exports = router;
