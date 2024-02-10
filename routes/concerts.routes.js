const express = require("express");
const Concert = require("../models/Concert.model");
const User = require("../models/User.model");
const Review = require("../models/Review.model");

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
    .populate({ path: "eventReviews", populate: { path: "createdBy" } })
    .populate("createdBy")
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
      name,
      soloistName,
      typeOfMusic,
      concertPlace,
      date,
      ageLimit,
      review,
    } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedConcert = {};
    try {
      if (req.file) {
        imageUrl = req.file.path;
      }
      const updatedConcert = await Concert.findOneAndUpdate(
        { _id: id },
        {
          name,
          soloistName,
          typeOfMusic,
          concertPlace,
          date,
          ageLimit,
          review,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedConcert);
    } catch (err) {
      console.log("Error occurs!!!");
      console.log(err);
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

//route to get all reviews of a spesific concert
router.get("/concerts/:concertId/reviews", async (req, res, next) => {
  const { concertId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(concertId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  try {
    const concert = await Concert.findById(concertId).populate({
      path: "eventReviews",
      populate: { path: "createdBy" },
    });
    res.status(200).json(concert.eventReviews);
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

router.get("/concerts/:concertId/reviews/:reviewId", async (req, res, next) => {
  const { concertId, reviewId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(concertId)) {
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

// Create a concert
router.post(
  "/concerts",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const {
      name,
      soloistName,
      typeOfMusic,
      concertPlace,
      date,
      review,
      ageLimit,
      createdBy,
    } = req.body;

    const errorsOfConcerts = {};

    try {
      let imageUrl;
      if (req.file) {
        imageUrl = req.file.path;
      }

      // Create concert
      const createdConcert = await Concert.create({
        name,
        soloistName,
        typeOfMusic,
        concertPlace,
        date,
        ageLimit,
        imageUrl,
        review,
        createdBy,
      });
      // Add created concert id to the User's events field
      await User.findByIdAndUpdate(createdBy, {
        $push: { events: createdConcert._id },
      });

      res.status(201).json(createdConcert);
    } catch (err) {
      console.log(err);
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfConcerts[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfConcerts);
      } else if (err.message) {
        errorsOfConcerts.message = err.message;
        errorsOfConcerts.detail = String(err);
        res.status(500).json(errorsOfConcerts);
      } else {
        errorsOfConcerts.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfConcerts.detail = String(err);
        res.status(500).json(errorsOfConcerts);
      }
    }
  }
);

// create a review to comment.
router.post(
  "/concerts/:concertId/reviews",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { concertId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concertId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const review = await Review.create({ ...req.body, event: concertId });
      review.populate("createdBy");
      console.log(review);
      await Concert.findByIdAndUpdate(concertId, {
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
  "/concerts/:concertId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { concertId, reviewId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concertId)) {
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
          event: concertId,
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
  "/concerts/:concertId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { concertId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(concertId)) {
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
        await Concert.findByIdAndUpdate(concertId, {
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
      console.log(err)
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
