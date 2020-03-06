import { config } from "dotenv";
config();

import routes from "./routes.json";
import crypto from "crypto";
import { Client } from "discord.js";

import mongoose from "mongoose";
const Token = mongoose.model("Token");

const prefix = process.env.PREFIX;
const apitoken = process.env.BOT_APITOKEN;
const adminRole = process.env.DISCORD_ADMIN_ROLEID;
const host = process.env.HOST_URL;

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
		let admin = message.member
			? message.member.roles.cache.has(adminRole)
			: false;

		Token.findOneAndUpdate(
			{ userId: user.id },
			{
				userId: user.id,
				userName: user.tag,
				token: tokenStr,
				date: null,
				admin: admin ? true : false
			},
			{ upsert: true },
			function(err, doc) {
				if (err) {
					user.send("Error: " + err);
					return;
				}

				let template =
					"Do not share these links around as these are your private links.\n" +
					`In case someone managed to get your private link, you can reissue a new link using \`${prefix}link\`.\n` +
					"For role priviledges, reissue your link from within the server.\n" +
					"Thank you for your participation!\n\n";

				let link1 = `Submit prompt: ${host}/${routes.web.promptForm}/${tokenStr}\n`;
				let link2 = admin
					? `Manage prompts: ${host}/${routes.web.managePrompts}/${tokenStr}\n`
					: "";

				user.send(template + link1 + link2);
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
