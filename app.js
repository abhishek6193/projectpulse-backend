const fs = require('fs');

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const tasksRoutes = require("./routes/tasks-routes");
const projectsRoutes = require("./routes/projects-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const path = require('path');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  next();
})

app.use("/api/tasks", tasksRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.");
  throw error;
});

app.use((error, req, res, next) => {
  if(req.file) {
    fs.unlink(req.file.path, (err) => console.error(err));
  }
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ifib4l4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => app.listen(process.env.PORT || 8000))
  .catch((err) => console.error(err));
