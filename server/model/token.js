import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Token = new Schema(
	{
		userId: { type: String, index: true },
		userName: { type: String },
		token: { type: String, index: true },
		valid: { type: Boolean, default: true },
		admin: { type: Boolean, default: false }
	},
	{ timestamps: true }
);

mongoose.model("Token", Token);
