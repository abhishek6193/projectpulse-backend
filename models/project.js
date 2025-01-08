const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const projectSchema = new Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  });

module.exports = model('Project', projectSchema);
