const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Email should consist '@' characters",
      ],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/,

        "Password should consist of at least 1 lower, 1 upper, 1 digit, 1 any character and min 6 characters.",
      ],
    },

    imageUrl: {
      type: String,
      default: "/src/assets/avatar.png",
    },

    country: String,

    events: [
      {
        type: Schema.Types.ObjectId, // When I create an event, (concert._id) is pushed hier (or theater._id etc.)
        refPath: "eventType",
      },
    ],
    eventType: {
      type: String,
      enam: ["Concert", "Theater", "Museum", "Book", "Restaurant"],
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },

  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  const properties = ["name", "country"];
  for (element of properties) {
    if (this.element) {
      const words = this[element].split(" "); // This is a middelware for database. It makes name and surname with uppercase for database.
      this[element] = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  next();
});

const User = model("User", userSchema);

module.exports = User;
