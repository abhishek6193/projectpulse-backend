const express = require("express");
const { check } = require("express-validator");

const {
  getUsers,
  signUp,
  login,
  getUserById,
  updateUserProfile,
} = require("../controllers/users-controller");
const fileUpload = require("../middleware/file-upload");
const authCheck = require("../middleware/check-auth");

const router = express.Router();

router.get("/", getUsers);

router.get("/:userId", getUserById);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  signUp
);

router.post(
  "/login",
  [check("email").trim().isEmail(), check("password").isLength({ min: 8 })],
  login
);

router.use(authCheck);

router.patch(
  "/profile/:profileId",
  fileUpload.single("image"),
  updateUserProfile
);

module.exports = router;
