 // TODO: Add more validations if needed
 const express = require("express");
 const { check } = require("express-validator");
 
 const {
   getTaskById,
   getTasksByUserId,
   createTask,
   updateTaskById,
   deleteTaskById,
   getTasksByProjectId
 } = require("../controllers/tasks-controller");
 const authCheck = require("../middleware/check-auth")
 
 const router = express.Router();
 
 router.use(authCheck);

 router.get("/:taskId", getTaskById);
 
 router.get("/user/:userId", getTasksByUserId);

 router.get("/project/:projectId", getTasksByProjectId);
 
 router.post(
   "/",
   [
     check("title").not().isEmpty(),
     check("description").isLength({ min: 10 }),
   ],
   createTask
 );
 
 router.patch(
   "/:taskId",
   [check("title").not().isEmpty(), check("description").isLength({ min: 10 })],
   updateTaskById
 );
 
 router.delete("/:taskId", deleteTaskById);
 
 module.exports = router;
 