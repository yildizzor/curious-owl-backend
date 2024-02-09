const { Schema, model } = require("mongoose");

const theaterSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Theater Name is required."],
      trim: true,
    },
    actorsName: {
      type: String,
      required: [true, "Actors Name is required."],
      trim: true,
    },
    directorName: {
      type: String,
      required: [true, "Director(s) Name is required."],
      trim: true,
    },
    writerName: {
      type: String,
      required: [true, "Writer(s) Name is required."],
      trim: true,
    },

    typeOfTheater: {
      type: String,
      required: [true, "Type of Theater is required."],
      trim: true,
    },

    theaterPlace: {
      type: String,
      required: [true, "Place is required."],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required."],
      trim: true,
    },
    ageLimit: {
      type: Number,
      required: [true],
    },
    imageUrl: {
      type: String,
    },
    review: {
      type: String,
      required: [true, "Author comment is required."],
      maxLength: 400,
    },
    eventReviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

theaterSchema.pre("save", function (next) {
  const properties = [
    "name",
    "actorsName",
    "directorName",
    "writerName",
    "typeOfTheater",
    "theaterPlace",
  ];
  for (element of properties) {
    const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
    this[element] = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  next();
});

const Theater = model("Theater", theaterSchema);

module.exports = Theater;
