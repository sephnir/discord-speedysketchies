import mongoose from "mongoose";

const Schema = mongoose.Schema;

const SFTheme = new Schema(
	{
		userId: { type: String, index: true },
		imageUrl: { type: String },
		fontColor: { type: String },
		bgColor: { type: String },
	},
	{ timestamps: {} }
);

mongoose.model("SFTheme", SFTheme);
