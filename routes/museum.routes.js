const express = require("express");
const Museum = require("../models/Museum.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");
const Review = require("../models/Review.model");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");

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
    .populate({ path: "eventReviews", populate: { path: "createdBy" } })
    .populate("createdBy")
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

//route to get all reviews of a spesific museum
router.get("/museums/:museumId/reviews", async (req, res, next) => {
  const { museumId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(museumId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  try {
    const museum = await Museum.findById(museumId).populate({
      path: "eventReviews",
      populate: { path: "createdBy" },
    });
    res.status(200).json(museum.eventReviews);
  } catch (err) {
    if (err.message) {
      error.message = err.message;
      error.detail = String(err);
      res.status(500).json(error);
    } else {
      error.message =
        "Internal Server Error occurs during all events retrieval";
      error.detail = String(err);
      res.status(500).json(error);
    }
  }
});

router.get("/museums/:museumId/reviews/:reviewId", async (req, res, next) => {
  const { museumId, reviewId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(muesumId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400).json({ message: "Specified review id is not valid" });
    return;
  }

  try {
    const review = await Review.findById(reviewId);
    res.status(200).json(review);
  } catch (err) {
    if (err.message) {
      error.message = err.message;
      error.detail = String(err);
      res.status(500).json(error);
    } else {
      error.message =
        "Internal Server Error occurs during all events retrieval";
      error.detail = String(err);
      res.status(500).json(error);
    }
  }
});

// create a review to comment.
router.post(
  "/museums/:museumId/reviews",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { museumId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(museumId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const review = await Review.create({ ...req.body, event: museumId });
      review.populate("createdBy");
      console.log(review);
      await Museum.findByIdAndUpdate(museumId, {
        $push: { eventReviews: review._id },
      });

      await User.findByIdAndUpdate(createdBy, {
        $push: { reviews: review._id },
      });

      res.status(201).json(review);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfReview[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfReview);
      } else if (err.message) {
        errorsOfReview.message = err.message;
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      } else {
        errorsOfReview.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      }
    }
  }
);

// update a review to comment.
router.put(
  "/museums/:museumId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { museumId, reviewId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(museumId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: "Specified review id is not valid" });
      return;
    }

    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          ...req.body,
          event: museumId,
        },
        { new: true }
      ).populate("createdBy");
      review.populate("createdBy");
      res.status(200).json(review);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfReview[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfReview);
      } else if (err.message) {
        errorsOfReview.message = err.message;
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      } else {
        errorsOfReview.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      }
    }
  }
);

// Delete a review to comment.
router.delete(
  "/museums/:museumId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { museumId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(museumId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: "Specified review id is not valid" });
      return;
    }

    try {
      const review = await Review.findByIdAndDelete(reviewId);
      if (review) {
        // Review is successfully deleted, now review id should be deleted from associated event
        await Museum.findByIdAndUpdate(museumId, {
          $pull: { eventReviews: review._id },
        });
        // Review should also be deleted from User Model document
        await User.findByIdAndUpdate(review.createdBy, {
          $pull: { reviews: review._id },
        });

        res.status(200).json({ message: "Review is succesfully deleted!" });
      } else {
        res
          .status(400)
          .json({ message: `Document with id ${reviewId} is not found` });
      }
    } catch (err) {
      if (err.message) {
        errorsOfReview.message = err.message;
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      } else {
        errorsOfReview.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfReview.detail = String(err);
        res.status(500).json(errorsOfReview);
      }
    }
  }
);

module.exports = router;
