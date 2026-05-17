const mongoose = require("mongoose");

const plantInfoSchema = new mongoose.Schema({
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  scientificName: String,

  family: String,

  clues: [String],

  imageUrl: String,

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
});

module.exports = mongoose.model("PlantInfo", plantInfoSchema, "plant_info");
