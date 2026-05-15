const express = require("express");
const router = express.Router();

/* Define routes to game pages here */

// Game's Main Page
router.get("/", (req, res) => {
  const player = {
    level: 12,
    currentExp: 1200,
    expToNextLevel: 1500,
  };

  const xpPercentage = (player.currentExp / player.expToNextLevel) * 100;

  const remainingXP = player.expToNextLevel - player.currentExp;

  res.render("games", {
    title: "Plant Games",
    user: req.session.user,
    cssFiles: ["games.css"],
    player,
    xpPercentage,
    remainingXP,
    matches: [],
  });
});

// Plant Quiz Game Route
const guessPlantsGame = require("./guessPlantsGame.js");
router.use("/guess-plants", guessPlantsGame);

// Ranked Match Game Route

module.exports = router;
