const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

module.exports = router;