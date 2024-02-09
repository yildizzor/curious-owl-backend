const { Schema, model } = require("mongoose");

const bookSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Book Name is required."],
      trim: true,
    },

    writer: {
      type: String,
      required: [true, "Writer Name is required."],

      trim: true,
    },
    genre: {
      type: String,
      required: [true, "Genre is required."],
      trim: true,
    },

    publishedDate: {
      type: Date,
      required: [true, "Publish Date is required."],
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

bookSchema.pre("save", function (next) {
  const properties = ["name", "writer", "genre"];
  for (element of properties) {
    const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
    this[element] = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  next();
});
const Book = model("Book", bookSchema);

module.exports = Book;
