import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const commentSchema = new Schema({
  author: { type: Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  likes: [{ type: Types.ObjectId, ref: "User" }],
},
  { timestamps: true }
);

const postSchema = new Schema({
  author: { type: Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [{ type: String }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],
  comments: [commentSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Post || model("Post", postSchema);
