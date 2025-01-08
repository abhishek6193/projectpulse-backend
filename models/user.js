const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
  profile: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
  },
});

userSchema.plugin(uniqueValidator);

module.exports = model("User", userSchema);
