const { Schema, model } = require("mongoose");

const museumSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Museum Name is required."],
      trim: true,
    },

    typeOfSubject: {
      type: String,
      required: [true, "Subject is required."],
      trim: true,
    },

    museumPlace: {
      type: String,
      required: [true, "Place is required."],
      trim: true,
    },
    builtBy: {
      type: String,
      required: [true, "Constructor(s) is required."],
      trim: true,
    },
    builtDate: {
      type: String,
      required: [true, "Built Date is required."],
      trim: true,
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

museumSchema.pre("save", function (next) {
  const properties = ["name", "typeOfSubject", "museumPlace", "builtBy"];
  console.log(this);
  for (element of properties) {
    const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
    this[element] = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  next();
});
const Museum = model("Museum", museumSchema);

module.exports = Museum;
