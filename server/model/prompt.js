import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Prompt = new Schema(
	{
		userId: { type: Number, index: true },
		prompt: { type: String },
		duration: { type: Number, default: 5 },
		anonymous: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

mongoose.model("Prompt", Prompt);
