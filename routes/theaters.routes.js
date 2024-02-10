const express = require("express");
const Theater = require("../models/Theater.model");
const User = require("../models/User.model");
const Review = require("../models/Review.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");

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
    .populate({ path: "eventReviews", populate: { path: "createdBy" } })
    .populate("createdBy")
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

// Delete a specific theater.
router.delete(
  "/theaters/:theaterId",
  isAuthenticated,
  async (req, res, next) => {
    const { theaterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const theater = await Theater.findByIdAndDelete(theaterId);
      if (theater) {
        // Theater is successfully deleted, associated createdBy user of the Theater event should be removed
        console.log(theater.createdBy);
        await User.findByIdAndUpdate(theater.createdBy, {
          $pull: { reviews: theater._id },
        });

        // Theater is successfully deleted, associated reviews
        if (theater.eventReviews) {
          console.log(
            `There are event reviews and now they need to be deleted`
          );
          theater.eventReviews.forEach(async (reviewId) => {
            const review = await Review.findByIdAndDelete(reviewId);
            if (review) {
              // Review should also be deleted from User Model document
              await User.findByIdAndUpdate(review.createdBy, {
                $pull: { reviews: review._id },
              });
            } else {
              console.log(
                `Document with id ${reviewId} is not found, maybe review doesn't exist or something goes wrong.`
              );
            }
          });
        }

        res.status(200).json({ message: "Theater is succesfully deleted!" });
      } else {
        res
          .status(400)
          .json({ message: `Document with id ${theaterId} is not found` });
      }
    } catch (err) {
      if (err.message) {
        res.status(500).json({ message: err.message, detail: String(err) });
      } else {
        const message =
          "Internal Server Error occurs during theater deletion";
        res.status(500).json({ message: message, detail: String(err) });
      }
    }
  }
);

//route to get all reviews of a spesific theater
router.get("/theaters/:theaterId/reviews", async (req, res, next) => {
  const { theaterId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(theaterId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  try {
    const theater = await Theater.findById(theaterId).populate({
      path: "eventReviews",
      populate: { path: "createdBy" },
    });
    res.status(200).json(theater.eventReviews);
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

router.get("/theaters/:theaterId/reviews/:reviewId", async (req, res, next) => {
  const { theaterId, reviewId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(theaterId)) {
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
  "/theaters/:theatersId/reviews",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { theatersId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(theatersId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const review = await Review.create({ ...req.body, event: theatersId });
      review.populate("createdBy");
      console.log(review);
      await Theater.findByIdAndUpdate(theatersId, {
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
  "/theaters/:theatersId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { theatersId, reviewId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(theatersId)) {
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
          event: theatersId,
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
  "/theaters/:theatersId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { theatersId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theatersId)) {
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
        await Theater.findByIdAndUpdate(theatersId, {
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
