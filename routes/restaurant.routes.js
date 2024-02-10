const express = require("express");
const Restaurant = require("../models/Restaurant.model");
const User = require("../models/User.model");
const Review = require("../models/Review.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");

// Get all restaurant
router.get("/restaurants", (req, res, next) => {
  const restaurants = Restaurant.find()

    .then((restaurants) => {
      res.status(200).json(restaurants);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal Server Error During Restaurants Retrival" });
    });
});

router.get("/restaurants/:restaurantId", (req, res, next) => {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Restaurant.findById(restaurantId)
    .populate({ path: "eventReviews", populate: { path: "createdBy" } })
    .populate("createdBy")
    .then((restaurant) => res.status(200).json(restaurant))
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Internal Server Error During Restaurant Retrival" })
    );
});

// Update the restaurant
router.put(
  "/restaurants/:id",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { id } = req.params;
    const {
      name,
      typeOfCuisine,
      restaurantPlace,
      establishDate,
      ageLimit,
      review,
    } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedRestaurant = {};
    try {
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }
      const updatedRestaurant = await Restaurant.findOneAndUpdate(
        { _id: id },
        {
          name,
          typeOfCuisine,
          restaurantPlace,
          establishDate,
          ageLimit,
          review,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedRestaurant);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfUpdatedRestaurant[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfUpdatedRestaurant);
      } else {
        errorsOfUpdatedRestaurant.message = "Internal server error occurs";
        res.status(500).json(errorsOfUpdatedRestaurant);
      }
    }
  }
);
// Create a restaurant
router.post(
  "/restaurants",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const {
      name,
      typeOfCuisine,
      restaurantPlace,
      establishDate,
      ageLimit,
      createdBy,
      review,
    } = req.body;

    console.log(req.body);
    const errorsOfRestaurants = {};

    try {
      let imageUrl;
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }

      const createdRestaurant = await Restaurant.create({
        name,
        typeOfCuisine,
        restaurantPlace,
        establishDate,
        ageLimit,
        review,
        imageUrl,
        createdBy,
      });

      // Add created restaurant id to the User's events field
      await User.findByIdAndUpdate(createdBy, {
        $push: { events: createdRestaurant._id },
      });

      res.status(201).json(createdRestaurant);
    } catch (err) {
      console.log(err);
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfRestaurants[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfRestaurants);
      } else if (err.message) {
        errorsOfRestaurants.message = err.message;
        errorsOfRestaurants.detail = String(err);
        res.status(500).json(errorsOfRestaurants);
      } else {
        errorsOfRestaurants.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfRestaurants.detail = String(err);
        res.status(500).json(errorsOfRestaurants);
      }
    }
  }
);

//route to get all reviews of a spesific restaurant
router.get("/restaurants/:restaurantId/reviews", async (req, res, next) => {
  const { restaurantId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId).populate({
      path: "eventReviews",
      populate: { path: "createdBy" },
    });
    res.status(200).json(restaurant.eventReviews);
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

router.get(
  "/restaurants/:restaurantId/reviews/:reviewId",
  async (req, res, next) => {
    const { restaurantId, reviewId } = req.params;
    const error = {};

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
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
  }
);

// create a review to comment.
router.post(
  "/restaurants/:restaurantId/reviews",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { restaurantId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const review = await Review.create({ ...req.body, event: restaurantId });
      review.populate("createdBy");
      console.log(review);
      await Restaurant.findByIdAndUpdate(restaurantId, {
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
  "/restaurants/:restaurantId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { restaurantId, reviewId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
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
          event: restaurantId,
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
  "/restaurants/:restaurantId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { restaurantId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
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
        await Restaurant.findByIdAndUpdate(restaurantId, {
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
