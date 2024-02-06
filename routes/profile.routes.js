const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const { isAuthenticated } = require("../middelwares/jwt.midelware");
const router = express.Router();
const saltRounds = 10;

router.put("/user", isAuthenticated, uploader.single("imageUrl"), async (req, res, next) => {
  const errorsOfUser = {};
  let { email, password, country } = req.body;
  console.log(req.body);
  try {
    let imageUrl;
    if (req.file) {
      console.log(req.file);
      imageUrl = req.file.path;
      console.log(req.file.path);
    }

    const user = await User.findOne({ email: email });
    if (password || country || imageUrl) {
      if (password) {
        user.password = password;
      }
      if (country) {
        user.country = country;
      }
      if (imageUrl) {
        user.imageUrl = imageUrl;
      }

      await user.save(); // User db model: pasword regex checked

      if (password) {
        const salt = bcryptjs.genSaltSync(saltRounds);
        const hashedPassword = bcryptjs.hashSync(password, salt);

        user.password = hashedPassword;
        await user.save();
      }

      // Deconstruct the user object to omit the password
      const { _id, name } = user;
      imageUrl = user.imageUrl;
      country = user.country;

      // Create an object that will be set as the token payload
      const payload = { _id, email, name, imageUrl, country };

      // Create and sign the token
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "46h",
      });

      // Send the token as the response
      res.status(200).json({ authToken: authToken });
    } else res.status(400).json({ message: "There is no data to update!" });
  } catch (err) {
    console.log(err);
    if (err instanceof mongoose.Error.ValidationError) {
      Object.keys(err.errors).forEach((element) => {
        errorsOfUser[element] = err.errors[element].message;
      });
      res.status(400).json(errorsOfUser);
    } else {
      errorsOfUser.message = "Internal server error occurs";
      res.status(500).json(errorsOfUser);
    }
  }
});

module.exports = router;
