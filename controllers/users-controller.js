// TODO: Add apis for deleting and updating user.
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const Profile = require("../models/profile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch {
    return next(new HttpError("Something went wrong"), 500);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getUserById = async (req, res, next) => {
  const { userId } = req.params;
  let user;
  try {
    user = await User.findById(userId).populate("profile");
  } catch {
    return next(new HttpError("Something went wrong.", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for the provided id.", 404));
  }
  res.json({
    user: user.toObject({ getters: true }),
    profile: user.profile ? user.profile.toObject({ getters: true }) : null,
  });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { name, email, password, role } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }
  if (existingUser) {
    return next(
      new HttpError("Could not create user, email already exists."),
      422
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again!",
      500
    );
    return next(error);
  }
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role,
    projects: [],
    tasks: [],
  });
  try {
    const createdUser = await newUser.save();
    const newUserProfile = new Profile({
      user: createdUser._id,
      image: null,
      jobTitle: "",
      department: "",
      organization: "",
      location: "",
    });
    const createdProfile = await newUserProfile.save();
    createdUser.profile = createdProfile._id;
    await createdUser.save();
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }
  res.status(201).json({ userId: newUser.id, email: newUser.email, token });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { email, password } = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }
  if (!identifiedUser) {
    return next(
      new HttpError("Could not find anyone with these credentials.", 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }

  if (!isValidPassword) {
    return next(
      new HttpError("Could not find anyone with these credentials.", 401)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
  } catch (err) {
    return next(new HttpError("Something went wrong"), 500);
  }
  res.json({ userId: identifiedUser.id, email: identifiedUser.email, token });
};

const updateUserProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors);
  }
  const { jobTitle, image, department, organization, location } = req.body;
  const { profileId } = req.params;
  let profileToUpdate;
  try {
    if (profileId === "new") {
      const profileUser = await User.findById(req.userData.userId);
      const newUserProfile = new Profile({
        user: profileUser._id,
        image: null,
        jobTitle: "",
        department: "",
        organization: "",
        location: "",
      });
      const createdProfile = await newUserProfile.save();
      profileUser.profile = createdProfile._id;
      await profileUser.save();
      profileToUpdate = createdProfile;
      res.json({ profile: createdProfile.toObject({ getters: true }) });
    } else {
      profileToUpdate = await Profile.findById(profileId);
      if (profileToUpdate.user.toString() !== req.userData.userId) {
        return next(
          new HttpError("You are not allowed to edit this profile.", 401)
        );
      }
    }
  } catch (err) {
    return next(new HttpError("Something went wrong.", 500));
  }

  if (profileId !== "new") {
    let updatedProfile;
    try {
      updatedProfile = await Profile.findByIdAndUpdate(
        profileId,
        {
          jobTitle,
          image: req.file?.path || image,
          department,
          organization,
          location,
        },
        { new: true }
      );
    } catch (err) {
      console.log("err", err)
      return next(new HttpError("Something went wrong.", 500));
    }
    res.json({ profile: updatedProfile.toObject({ getters: true }) });
  }
};

module.exports = { getUsers, signUp, login, getUserById, updateUserProfile };
