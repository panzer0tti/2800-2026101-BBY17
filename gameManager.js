const express = require("express");
const router = express.Router();

/* Define routes to game pages here */

// Game's Main Page
router.get("/", (req, res) => {
  if (req.session.authenticated) {
    const player = {
      level: 12,
      currentExp: 1200,
      expToNextLevel: 1500,
    };

    const xpPercentage = (player.currentExp / player.expToNextLevel) * 100;

    const remainingXP = player.expToNextLevel - player.currentExp;

    res.render("games", {
      player,
      xpPercentage,
      remainingXP,
      matches: [],
    });
  }
});

module.exports = router;
