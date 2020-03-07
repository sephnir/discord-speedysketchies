import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Prompt = new Schema(
	{
		userId: { type: String, index: true },
		userName: { type: String, index: true },
		prompt: { type: String },
		duration: { type: Number, default: 5 },
		anonymous: { type: Boolean, default: true },
		posted: { type: Boolean, default: false }
	},
	{ timestamps: { updatedAt: false } }
);

mongoose.model("Prompt", Prompt);
