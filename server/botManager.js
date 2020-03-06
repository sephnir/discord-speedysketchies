import { config } from "dotenv";
config();

import crypto from "crypto";
import { Client } from "discord.js";

import mongoose from "mongoose";
const Token = mongoose.model("Token");

const prefix = process.env.PREFIX;
const apitoken = process.env.API_TOKEN;
const host = process.env.HOST_URL;
const routes = {
	promptForm: "prompt_form"
};

const collection = "token";

class BotManager {
	client;
	botId;

	constructor() {
		this.client = new Client();

		this.client.once("ready", () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
			this.botId = this.client.user.id;
		});
		this.client.on("message", this.message);
		this.client.login(apitoken);
	}

	link = message => {
		let tokenStr = crypto.randomBytes(6).toString("hex");
		let user = message.author;

		Token.findOneAndUpdate(
			{ userId: user.id },
			{
				userId: user.id,
				userName: user.tag,
				token: tokenStr,
				date: null
			},
			{ upsert: true },
			function(err, doc) {
				if (err) {
					user.send("Error: " + err);
					return;
				}

				user.send(`${host}/${routes.promptForm}/${tokenStr}`);
				user.send(
					`Do not share this link around as this is your private link. To reissue a new link, use \`${prefix}link\`. Thank you for your participation!`
				);
			}
		);
	};

	message = message => {
		if (message.content.charAt(0) != prefix) {
			return;
		}

		if (message.author.id == this.botId) {
			return;
		}

		let msgArr = message.content.replace(prefix, "");
		msgArr = msgArr.split(" ");
		if (msgArr[0] === "link") {
			this.link(message);
		}
	};
}

export default BotManager;
