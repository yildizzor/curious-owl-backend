const { Schema, model } = require("mongoose");

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Restaurant Name is required."],
      trim: true,
    },

    typeOfCuisine: {
      type: String,
      required: [true, "Type of Cuisine is required."],
      trim: true,
    },

    restaurantPlace: {
      type: String,
      required: [true, "Place is required."],

      trim: true,
    },
    establishDate: {
      type: Date,
      required: [true, "Establish Date is required."],
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

restaurantSchema.pre("save", function (next) {
  const properties = ["name", "typeOfCuisine", "restaurantPlace"];
  for (element of properties) {
    const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
    this[element] = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  next();
});
const Restaurant = model("Restaurant", restaurantSchema);

module.exports = Restaurant;
