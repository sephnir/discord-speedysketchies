import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Token = new Schema(
	{
		userId: { type: Number, index: true },
		userName: { type: String },
		token: { type: String, index: true },
		valid: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

mongoose.model("Token", Token);
