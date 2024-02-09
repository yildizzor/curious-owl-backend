const express = require("express");
const Book = require("../models/Book.model");
const mongoose = require("mongoose");
const uploader = require("../middelwares/cloudinary.config");
const router = express.Router();
const { isAuthenticated } = require("../middelwares/jwt.midelware");
const User = require("../models/User.model");
const Review = require("../models/Review.model");

// Get all books
router.get("/books", (req, res, next) => {
  const books = Book.find()

    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal Server Error During Books Retrival" });
    });
});

router.get("/books/:bookId", (req, res, next) => {
  const { bookId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Book.findById(bookId)
    .populate({ path: "eventReviews", populate: { path: "createdBy" } })
    .populate("createdBy")
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Internal Server Error During Book Retrival" })
    );
});

// Update the book
router.put(
  "/books/:id",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { id } = req.params;
    const { name, writer, genre, publishedDate, review } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }
    let imageUrl;
    const errorsOfUpdatedBook = {};
    try {
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }
      const updatedBook = await Book.findOneAndUpdate(
        { _id: id },
        {
          name,
          writer,
          genre,
          publishedDate,
          review,
          imageUrl,
        },
        { new: true }
      );

      res.status(200).json(updatedBook);
    } catch (err) {
      console.log(error);
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfUpdatedBook[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfUpdatedBook);
      } else {
        errorsOfUpdatedBook.message = "Internal server error occurs";
        res.status(500).json(errorsOfUpdatedBook);
      }
    }
  }
);
// Create a book
router.post(
  "/books",
  isAuthenticated,
  uploader.single("imageUrl"),
  async (req, res, next) => {
    const { name, writer, genre, publishedDate, review, createdBy } = req.body;

    const errorsOfBooks = {};

    try {
      let imageUrl;
      if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path;
        console.log(req.file.path);
      }

      const createdBook = await Book.create({
        name,
        writer,
        genre,
        publishedDate,
        review,
        imageUrl,
        createdBy,
      });

      // Add created book id to the User's events field
      await User.findByIdAndUpdate(createdBy, {
        $push: { events: createdBook._id },
      });

      res.status(201).json(createdBook);
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        //Object is a built in JS global object. This "Object.keys" is a global method which gives us property names of given object!
        // element = as cocertName, soloistName (field of model)
        // message is inside err.errors, so we can see it if the error occurs.
        Object.keys(err.errors).forEach((element) => {
          errorsOfBooks[element] = err.errors[element].message;
        });
        res.status(400).json(errorsOfBooks);
      } else if (err.message) {
        errorsOfBooks.message = err.message;
        errorsOfBooks.detail = String(err);
        res.status(500).json(errorsOfBooks);
      } else {
        errorsOfBooks.message =
          "Internal Server Error occurs during all events retrieval";
        errorsOfBooks.detail = String(err);
        res.status(500).json(errorsOfBooks);
      }
    }
  }
);

//route to get all reviews of a spesific book
router.get("/books/:bookId/reviews", async (req, res, next) => {
  const { bookId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  try {
    const book = await Book.findById(bookId).populate({
      path: "eventReviews",
      populate: { path: "createdBy" },
    });
    res.status(200).json(book.eventReviews);
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

router.get("/books/:bookId/reviews/:reviewId", async (req, res, next) => {
  const { bookId, reviewId } = req.params;
  const error = {};

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
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
  "/books/:bookId/reviews",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { bookId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    try {
      const review = await Review.create({ ...req.body, event: bookId });
      review.populate("createdBy");
      console.log(review);
      await Book.findByIdAndUpdate(bookId, {
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
  "/books/:bookId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { bookId, reviewId } = req.params;

    const { rating, comment, createdBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
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
          event: bookId,
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
  "/books/:bookId/reviews/:reviewId",
  isAuthenticated,
  async (req, res, next) => {
    const errorsOfReview = {};
    const { bookId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
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
        await Book.findByIdAndUpdate(bookId, {
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
