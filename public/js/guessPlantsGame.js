const express = require('express');
const router = express.Router();

const PlantName = require('./plantName.js');
const PlantInfo = require('./plantInfo.js');
const plantName = require('./plantName.js');

/* Start Plant Quiz */
router.get('/', async (req, res) => {
  try {
    // Pick random plant name(s)
    const randomPlantsArray = await PlantName.aggregate([
      { $sample: { size: 1 } },
    ]);

    const plantName = randomPlantsArray[0];

    // Find matching Plant's ID in plant_info
    const plantInfo = await PlantInfo.findOne({
      plantId: plantName._id,
    });

    // Combine both plantName and plantInfo to get plant in Object form
    const plant = {
      ...plantName.toObject(),
      ...plantInfo.toObject(),
    };

    // Save answer in a game session
    req.session.correctPlant = plantName.commonName;

    res.render('guessPlant', {
      title: 'Guess The Plant',
      user: req.session.user,
      cssFiles: ['games.css'],
      plant,
      result: null,
    });
  } catch (err) {
    console.error(err);
    res.render('errorMessage', {
      title: 'Error - Failed Quiz Loading',
      user: req.session.user,
      cssFiles: [''],
    });
  }
});

// Check User's Guess
router.post('/guess', async (req, res) => {
  try {
    const userGuess = req.body.trim().toLowerCase();
    const correctAnswer = req.session.correctPlant.toLowerCase();

    let result = '';

    if (userGuess == correctAnswer) {
      result = 'Correct!';
    } else {
      result = `Wrong! The correct answer was ${req.session.correctPlant}`;
    }

    // Load the next question, or random plant
    const randomPlantsArray = await PlantName.aggregate([
      { $sample: { size: 1 } },
    ]);

    const plantName = randomPlantsArray[0];

    const plantInfo = plantName.findOne({
      plantId: plantName._id,
    });

    const plant = {
      ...plantName.toObject(),
      ...plantInfo.toObject(),
    };

    req.session.correctPlant = plantName.commonName;

    res.render('guessPlant', {
      title: 'Guess The Plant',
      user: req.session.user,
      cssFiles: ['games.css'],
      plant,
      result,
    });
  } catch (err) {
    console.error(err);
    res.render('errorMessage', {
      title: 'Error - Failed Quiz Check',
      user: req.session.user,
      cssFiles: [],
    });
  }
});

module.exports = router;
