/* dbManager - wrapper over node-mongodb driver */
import { config } from "dotenv";
config();
import mongoose from "mongoose";

import "./model/token";
import "./model/prompt";

const url = process.env.MONGO_URL;

class DbManager {
	constructor() {
		mongoose.connect(url, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
			useFindAndModify: false
		});
		this.db = mongoose.connection;

		this.db.on("error", console.error.bind(console, "connection error:"));
		this.db.once("open", function() {
			console.log("Connected to mongodb!");
		});
	}
}

export default DbManager;
