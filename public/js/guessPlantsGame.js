const express = require("express");
const router = express.Router();

const PlantName = require("./plantName");
const PlantInfo = require("./plantInfo");
const {sendErrorMessage} = require("./authentication")

async function getRandomPlant(req) {
  if (!req.session.usedPlants) {
    req.session.usedPlants = [];
  }

  const total = await PlantName.estimatedDocumentCount();

  if (req.session.usedPlants.length >= total) {
    req.session.usedPlants = [];
  }

  let plant = null;

  for (let i = 0; i < 10; i++) {
    const random = Math.floor(Math.random() * total);

    const candidate = await PlantName.findOne().skip(random);

    if (!req.session.usedPlants.includes(candidate._id.toString())) {
      plant = candidate;
      break;
    }

    attempts++;
  }

  if (!plant) {
    plant = await PlantName.findOne().skip(Math.floor(Math.random() * total));
  }

  req.session.usedPlants.push(plant._id.toString());

  return plant;
}

/* Start Plant Quiz */
router.get("/", async (req, res) => {
  /* Initializate session's plant storage */
  if (!req.session.usedPlants) {
    req.session.usedPlants = [];
  }

  try {
    const plantName = await getRandomPlant(req);

    // Find matching Plant's ID in plant_info
    const plantInfo = await PlantInfo.findOne({
      plantId: plantName._id,
    });

    // Combine both plantName and plantInfo to get plant in Object form
    const plant = {
      ...(plantName ? plantName.toObject() : {}),
      ...(plantInfo ? plantInfo.toObject() : {}),
    };

    console.log("plant: ", plant);

    req.session.currentPlantById = plantName._id.toString();
    req.session.correctPlant = plantName.commonName;

    res.render("guessPlant", {
      title: "Guess The Plant",
      user: req.session.authenticated,
      cssFiles: ["games.css"],
      plant,
      result: null,
    });
  } catch (err) {
    console.error(err);
    sendErrorMessage(req, res, "Error - Failed Quiz Loading", ["Loading Quiz Failed"], "/plant-game", "Games");
  }
});

// Check User's Guess
router.post("/guess", async (req, res) => {
  /* Initializate session's plant storage */
  if (!req.session.usedPlants) {
    req.session.usedPlants = [];
  }

  try {
    const userGuess = req.body.userGuess.trim().toLowerCase();
    const correctAnswer = req.session.correctPlant.toLowerCase();

    let result = "";

    if (userGuess == correctAnswer) {
      result = "Correct!";
    } else {
      result = `Wrong! The correct answer was "${req.session.correctPlant}"`;
    }

    const plantName = await PlantName.findById(req.session.currentPlantById);

    const plantInfo = await PlantInfo.findOne({
      plantId: plantName._id,
    });

    const plant = {
      ...(plantName ? plantName.toObject() : {}),
      ...(plantInfo ? plantInfo.toObject() : {}),
    };

    console.log("plant: ", plant);

    req.session.correctPlant = plantName.commonName;

    res.render("guessPlant", {
      title: "Guess The Plant",
      user: req.session.authenticated,
      cssFiles: ["games.css"],
      plant,
      result,
    });
  } catch (err) {
    console.error(err);
    sendErrorMessage(req, res, "Error - Failed Quiz Check", ["Failed User Guess Check"], "/plant-game", "Games");
  }
});

/* Next Question Route */
router.get("/next", async (req, res) => {
  const plantName = await getRandomPlant(req);

  const plantInfo = await PlantInfo.findOne({
    plantId: plantName._id.toString(),
  });

  const plant = {
    ...plantName.toObject(),
    ...(plantInfo ? plantInfo.toObject() : {}),
  };

  req.session.currentPlantId = plantName._id.toString();
  req.session.correctPlant = plantName.commonName;

  res.render("guessPlant", {
    title: "Guess The Plant",
    user: req.session.authenticated,
    cssFiles: ["games.css"],
    plant,
    result: null,
  });
});

module.exports = router;
