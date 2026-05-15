const mongoose = require('mongoose');

const plantNameSchema = new mongoose.Schema({
  commonName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('PlantName', plantNameSchema, 'plant_names');
