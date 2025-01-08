const { validationResult } = require("express-validator");
const { startSession } = require("mongoose");

const HttpError = require("../models/http-error");
const Task = require("../models/task")
const Project = require("../models/project");

const getTaskById = async (req, res, next) => {
  const { taskId } = req.params;
  let requestedTask;
  try {
    requestedTask = await Task.findById(taskId);
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  if (!requestedTask) {
    return next(
      new HttpError("Could not find task for the provided id.", 404)
    );
  }
  res.json({ task: requestedTask.toObject({ getters: true }) });
};

const getTasksByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let requestedUserTasks;
  try {
    requestedUserTasks = await Task.find({ assignedTo: userId });
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }

  res.json({
    tasks: requestedUserTasks.map((task) =>
      task.toObject({ getters: true })
    ),
  });
};

const getTasksByProjectId = async (req, res, next) => {
  const { projectId } = req.params;
  let requestedProjectTasks;
  try {
    requestedProjectTasks = await Task.find({ project: projectId });
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }

  res.json({
    tasks: requestedProjectTasks.map((task) =>
      task.toObject({ getters: true })
    ),
  });
};

const createTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { title, description, status, assignedTo, startDate, dueDate, projectId } = req.body;
  let projectDetails;
  try {
    projectDetails = await Project.findById(projectId);
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  if (!projectDetails) {
    return next(
      new HttpError("Could not find user.", 404)
    );
  }
  const newTask = new Task({
    title,
    description,
    status,
    assignedTo,
    startDate,
    dueDate,
    project: projectId
  });
  try {
    const session = await startSession();
    session.startTransaction();
    await newTask.save({ session });
    projectDetails.tasks.push(newTask);
    await projectDetails.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not create task.", 500);
    return next(error);
  }
  res.status(201).json({ task: newTask.toObject({ getters: true }) });
};

const updateTaskById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { title, description, status, assignedTo, startDate, dueDate } = req.body;
  const { taskId } = req.params;

// TODO: to add any authorization check if needed
//   let taskToUpdate;
//   try{
//     taskToUpdate = await Task.findById(taskId);
//     if(taskToUpdate.assignedTo.toString() !== req.userData.userId) {
//       return next(new HttpError("You are not allowed to edit this task.", 401));
//     }
//   } catch (err) {
//     return next(new HttpError("Something went wrong.", 500));
//   }

  let updatedTask;
  try {
    updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { title, description, status, assignedTo, startDate, dueDate },
      { new: true }
    );
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  res.json({ task: updatedTask.toObject({ getters: true }) });
};

const deleteTaskById = async (req, res, next) => {
  const { taskId } = req.params;

  let taskToDelete;
  try {
    taskToDelete = await Task.findById(taskId).populate("assignedTo");

// TODO: to add any authorization check if needed
    // if(taskToDelete.creator.id !== req.userData.userId) {
    //   return next(new HttpError("You are not allowed to delete this project.", 401));
    // }
  } catch (err) {
    return next(
      new HttpError("Something went wrong while looking for task.", 500)
    );
  }

  if (!taskToDelete) {
    return next(
      new HttpError("Could not find task for the provided id.", 404)
    );
  }

  try {
    const session = await startSession();
    session.startTransaction();
    await Task.findByIdAndDelete(taskId).session(session);
    taskToDelete.assignedTo.tasks.pull(taskToDelete);
    await taskToDelete.assignedTo.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  res.json({ message: "Delete Success!!" });
};

module.exports = {
  getTaskById,
  getTasksByUserId,
  createTask,
  updateTaskById,
  deleteTaskById,
  getTasksByProjectId
};
