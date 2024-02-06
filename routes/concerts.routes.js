const express = require("express");
const Concert = require("../models/Concert.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("./../middelwares/jwt.midelware");

// Get all concerts
router.get("/concerts", (req, res, next) => {
  const concerts = Concert.find()

    .then((concerts) => {
      res.status(200).json(concerts);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal Server Error During Concerts Retrival" });
    });
});

router.get("/concerts/:concertId", (req, res, next) => {
  const { concertId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(concertId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Concert.findById(concertId)
    .then((concert) => res.status(200).json(concert))
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Internal Server Error During Concert Retrival" })
    );
});

// Update the concert
router.put(
  "/concerts/:id",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { id } = req.params;
    const {
      concertName,
      soloistName,
      typeOfMusic,
      concertPlace,
      date,
      ageLimit,
    } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedConcert = {};
    try {
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }
      const updatedConcert = await Concert.findOneAndUpdate(
        { _id: id },
        {
          concertName,
          soloistName,
          typeOfMusic,
          concertPlace,
          date,
          ageLimit,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedConcert);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfUpdatedConcert[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfUpdatedConcert);
      } else {
        errorsOfUpdatedConcert.message = "Internal server error occurs";
        res.status(500).json(errorsOfUpdatedConcert);
      }
    }
  }
);
// Create a concert
router.post(
  "/concerts",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const {
      concertName,
      soloistName,
      typeOfMusic,
      concertPlace,
      date,
      ageLimit,
    } = req.body;

    const errorsOfConcerts = {};

    try {
      let imageUrl;
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }

      const createdConcert = await Concert.create({
        concertName,
        soloistName,
        typeOfMusic,
        concertPlace,
        date,
        ageLimit,
        imageUrl,
      });

      res.status(201).json(createdConcert);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfConcerts[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfConcerts);
      } else {
        errorsOfConcerts.message = "Internal server error occurs";
        res.status(500).json(errorsOfConcerts);
      }
    }
  }
);

module.exports = router;
