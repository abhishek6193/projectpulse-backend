const { Schema, model } = require("mongoose");

const profileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: { type: String },
  jobTitle: { type: String },
  department: { type: String },
  organization: { type: String },
  location: { type: String },
});

module.exports = model("Profile", profileSchema);
