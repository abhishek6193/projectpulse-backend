const { validationResult } = require("express-validator");
const { startSession } = require("mongoose");

const HttpError = require("../models/http-error");
const Project = require("../models/project");
const User = require("../models/user");

const getProjectById = async (req, res, next) => {
  const { projectId } = req.params;
  let requestedProject;
  try {
    requestedProject = await Project.findById(projectId);
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  if (!requestedProject) {
    return next(
      new HttpError("Could not find project for the provided id.", 404)
    );
  }
  res.json({ project: requestedProject.toObject({ getters: true }) });
};

const getProjectsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let requestedUserProjects;
  try {
    requestedUserProjects = await Project.find({ members: userId });
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }

  res.json({
    projects: requestedUserProjects.map((project) =>
      project.toObject({ getters: true })
    ),
  });
};

const createProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { name, description, status, members } = req.body;
  let projectMembers;
  try {
    projectMembers = await User.find({ _id: { $in: members } });
  } catch (err) {
    return next(new HttpError("Fetching project members failed, please try again later.", 500));
  }

  if (projectMembers.length !== members.length) {
    return next(new HttpError("One or more project members not found.", 404));
  }
  const newProject = new Project({
    name,
    description,
    status,
    members,
    tasks: [],
    creator: req.userData.userId,
  });
  try {
    const session = await startSession();
    session.startTransaction();
    await newProject.save({ session });
  
    // Add project to each member's projects
    projectMembers.forEach(user => {
      user.projects.push(newProject);
    });

    // Save all member documents
    for (const user of projectMembers) {
      await user.save({ session });
    }
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not create project.", 500);
    return next(error);
  }
  res.status(201).json({ project: newProject.toObject({ getters: true }) });
};

const updateProjectById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { name, description, status, members } = req.body;
  const { projectId } = req.params;

  let projectToUpdate;
  try{
    projectToUpdate = await Project.findById(projectId);
    if(projectToUpdate.creator.toString() !== req.userData.userId) {
      return next(new HttpError("You are not allowed to edit this project.", 401));
    }
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }

  let updatedProject;
  try {
    updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description, status, members },
      { new: true }
    );
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  res.json({ project: updatedProject.toObject({ getters: true }) });
};

const deleteProjectById = async (req, res, next) => {
  const { projectId } = req.params;

  let projectToDelete;
  try {
    projectToDelete = await Project.findById(projectId).populate("creator");
    if(projectToDelete.creator.id !== req.userData.userId) {
      return next(new HttpError("You are not allowed to delete this project.", 401));
    }
  } catch (err) {
    return next(
      new HttpError("Something went wrong while looking for project.", 500)
    );
  }

  if (!projectToDelete) {
    return next(
      new HttpError("Could not find project for the provided id.", 404)
    );
  }

  try {
    const session = await startSession();
    session.startTransaction();
    await Project.findByIdAndDelete(projectId).session(session);
    projectToDelete.creator.projects.pull(projectToDelete);
    await projectToDelete.creator.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }
  res.json({ message: "Delete Success!!" });
};

module.exports = {
  getProjectById,
  getProjectsByUserId,
  createProject,
  updateProjectById,
  deleteProjectById,
};
