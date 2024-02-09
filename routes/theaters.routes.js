const express = require("express");
const Theater = require("../models/Theater.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");
const User = require("../models/User.model");

// Get all theaters
router.get("/theaters", (req, res, next) => {
  const theaters = Theater.find()

    .then((theaters) => {
      res.status(200).json(theaters);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal Server Error During Theaters Retrival" });
    });
});

router.get("/theaters/:theaterId", (req, res, next) => {
  const { theaterId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(theaterId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Theater.findById(theaterId)
    .then((theater) => res.status(200).json(theater))
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Internal Server Error During Theater Retrival" })
    );
});

// Update the theater
router.put(
  "/theaters/:id",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { id } = req.params;
    const {
      name,
      directorName,
      writerName,
      actorsName,
      typeOfTheater,
      theaterPlace,
      date,
      ageLimit,
      review,
    } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedTheater = {};
    try {
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }
      const updatedTheater = await Theater.findOneAndUpdate(
        { _id: id },
        {
          name,
          directorName,
          writerName,
          actorsName,
          typeOfTheater,
          theaterPlace,
          date,
          ageLimit,
          review,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedTheater);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfUpdatedTheater[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfUpdatedTheater);
      } else {
        errorsOfUpdatedTheater.message = "Internal server error occurs";
        res.status(500).json(errorsOfUpdatedTheater);
      }
    }
  }
);
// Create a theater
router.post(
  "/theaters",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const {
      name,
      directorName,
      writerName,
      actorsName,
      typeOfTheater,
      theaterPlace,
      date,
      ageLimit,
      review,
      createdBy,
    } = req.body;

    const errorsOfTheaters = {};

    try {
      let imageUrl;
      if (req.file) {
        imageUrl = req.file.path;
      }

      const createdTheater = await Theater.create({
        name,
        directorName,
        writerName,
        actorsName,
        typeOfTheater,
        theaterPlace,
        date,
        ageLimit,
        imageUrl,
        review,
        createdBy,
      });

      // When I create the event, I push event(theater)._id to the User model.
      //Yildiz kullanicisinin event alanina eventin ID sini push ediyorum.
      await User.findByIdAndUpdate(createdBy, {
        $push: { events: createdTheater._id },
      });

      res.status(201).json(createdTheater);
    } catch (err) {
      console.log(err);
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfTheaters[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfTheaters);
      } else if (err.message) {
        errorsOfTheaters.message = err.message;
        errorsOfTheaters.detail = String(err);
        res.status(500).json(errorsOfTheaters);
      } else {
        errorsOfTheaters.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfTheaters.detail = String(err);
        res.status(500).json(errorsOfTheaters);
      }
    }
  }
);

module.exports = router;
