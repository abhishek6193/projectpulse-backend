 // TODO: Add more validations if needed
const express = require("express");
const { check } = require("express-validator");

const {
  getProjectById,
  getProjectsByUserId,
  createProject,
  updateProjectById,
  deleteProjectById,
} = require("../controllers/projects-controller");
const authCheck = require("../middleware/check-auth");

const router = express.Router();

router.use(authCheck);

router.get("/:projectId", getProjectById);

router.get("/user/:userId", getProjectsByUserId);

router.post(
  "/",
  [
    check("name").not().isEmpty(),
    check("description").isLength({ min: 10 }),
  ],
  createProject
);

router.patch(
  "/:projectId",
  [check("name").not().isEmpty(), check("description").isLength({ min: 10 })],
  updateProjectById
);

router.delete("/:projectId", deleteProjectById);

module.exports = router;
