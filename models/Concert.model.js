const { Schema, model } = require("mongoose");

const concertSchema = new Schema({
  concertName: {
    type: String,
    required: [true, "Concert Name is required."],
    lowercase: true,
    trim: true,
  },

  soloistName: {
    type: String,
    required: [true, "Soloist Name is required."],
    lowercase: true,
    trim: true,
  },
  typeOfMusic: {
    type: String,
    required: [true, "Type of Music is required."],
    lowercase: true,
    trim: true,
  },

  concertPlace: {
    type: String,
    required: [true, "Place is required."],
    lowercase: true,
    trim: true,
  },
  date: {
    type: Date,
    required: [true, "Date is required."],
    lowercase: true,
    trim: true,
  },
  ageLimit: {
    type: Number,
    required: [true],
  },
  imageUrl: {
    type: String,
  },
});

const Concert = model("Concert", concertSchema);

module.exports = Concert;
