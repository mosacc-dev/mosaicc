import mongoose from "mongoose";
const { Schema, model } = mongoose;
const UserSchema = new Schema({
    clerkUserId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, required: true },
    username: { type: String, required: true },
    profilepic: { type: String,default: "" }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)
export default mongoose.models.User || model("User", UserSchema);