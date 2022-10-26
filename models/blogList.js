const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const blogList = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

blogList.index({ title: "text", description: "text" });

module.exports = mongoose.model("Blog", blogList);
