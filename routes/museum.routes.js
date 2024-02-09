const express = require("express");
const Museum = require("../models/Museum.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");
const User = require("../models/User.model");

// Get all museums
router.get("/museums", (req, res, next) => {
  const museums = Museum.find()

    .then((museums) => {
      res.status(200).json(museums);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal Server Error During Museums Retrival" });
    });
});

router.get("/museums/:museumId", (req, res, next) => {
  const { museumId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(museumId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Museum.findById(museumId)
    .then((museum) => res.status(200).json(museum))
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Internal Server Error During Museum Retrival" })
    );
});

// Update the museum
router.put(
  "/museums/:id",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { id } = req.params;
    const { name, typeOfSubject, museumPlace, builtBy, builtDate, review } =
      req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedMuseum = {};
    try {
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }
      const updatedMuseum = await Museum.findOneAndUpdate(
        { _id: id },
        {
          name,
          typeOfSubject,
          museumPlace,
          builtBy,
          builtDate,
          review,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedMuseum);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfUpdatedMuseum[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfUpdatedMuseum);
      } else {
        errorsOfUpdatedMuseum.message = "Internal server error occurs";
        res.status(500).json(errorsOfUpdatedMuseum);
      }
    }
  }
);
// Create a museum
router.post(
  "/museums",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const {
      name,
      typeOfSubject,
      museumPlace,
      builtBy,
      builtDate,
      review,
      createdBy,
    } = req.body;

    const errorsOfmuseums = {};

    try {
      let imageUrl;
      if (req.file) {
        imageUrl = req.file.path;
      }

      const createdMuseum = await Museum.create({
        name,
        typeOfSubject,
        museumPlace,
        builtBy,
        builtDate,
        imageUrl,
        review,
        createdBy,
      });
      await User.findByIdAndUpdate(createdBy, {
        $push: { events: createdMuseum._id },
      });

      res.status(201).json(createdMuseum);
    } catch (err) {
      console.log(err);
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfmuseums[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfmuseums);
      } else if (err.message) {
        errorsOfmuseums.message = err.message;
        errorsOfmuseums.detail = String(err);
        res.status(500).json(errorsOfmuseums);
      } else {
        errorsOfmuseums.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfmuseums.detail = String(err);
        res.status(500).json(errorsOfmuseums);
      }
    }
  }
);

module.exports = router;
