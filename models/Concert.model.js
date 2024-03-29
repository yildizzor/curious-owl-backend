const { Schema, model } = require("mongoose");

const concertSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Concert Name is required."],
      trim: true,
    },

    soloistName: {
      type: String,
      required: [true, "Soloist Name is required."],
      trim: true,
    },
    typeOfMusic: {
      type: String,
      required: [true, "Type of Music is required."],
      trim: true,
    },

    concertPlace: {
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
      required: [true, "Age limit is required."],
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
      required: [true, "Author is required."],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

concertSchema.pre("save", function (next) {
  const properties = [
    "name",
    "soloistName",
    "typeOfMusic",
    "concertPlace",
  ];
  for (element of properties) {
    const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
    this[element] = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  next();
});
const Concert = model("Concert", concertSchema);

module.exports = Concert;
