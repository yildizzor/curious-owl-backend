const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId, // This field has an id which belongs to other document.This id belongs one of the event type.
      refPath: "eventType",
    },

    eventType: {
      type: String,
      enam: ["Concert", "Theater", "Museum", "Book", "Restaurant"],
    },

    // date: {
    //   type: Date,
    //   default: Date.now,
    //   required: true,
    // },

    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      maxLength: 300,
      required: [true, "Comment is required."],
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      required: [true, "Author is required."],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Review = model("Review", reviewSchema);

module.exports = Review;
