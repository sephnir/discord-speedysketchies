import { config } from "dotenv";
config();

import moment from "moment";
import "moment-timezone";
import routes from "./routes.json";
import crypto from "crypto";
import { Client, MessageAttachment } from "discord.js";
import axios from "axios";
import xml from "fast-xml-parser";
import sfFactory from "./sketchfecta/sfFactory";

import mongoose from "mongoose";
const Token = mongoose.model("Token");
const SFTheme = mongoose.model("SFTheme");

const prefix = process.env.PREFIX;
const apitoken = process.env.BOT_APITOKEN;

const adminRoleId = process.env.DISCORD_ADMIN_ROLEID;
const memberRoleId = process.env.DISCORD_MEMBER_ROLEID;

const notifyRoleCommands = process.env.DISCORD_NOTIFY_ROLECMDS;
const notifyRoleIds = process.env.DISCORD_NOTIFY_ROLEIDS;

const host = process.env.HOST_URL;
const botMsgUrl = process.env.BOT_MESSAGE_URL;
const archiveChId = process.env.CH_ARCHIVE;
const errorCh = process.env.CH_ERROR;
const timezone = process.env.TIMEZONE;

const promptChId = [
	process.env.CH_PROMPT1,
	process.env.CH_PROMPT2,
	process.env.CH_PROMPT3,
	process.env.CH_PROMPT4,
	process.env.CH_PROMPT5,
];

const collection = "token";

class BotManager {
	client;
	botId;
	msgTemplates;

	constructor() {
		this.client = new Client();

		this.client.once("ready", () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
			this.botId = this.client.user.id;
		});
		this.client.on("message", this.receive);
		this.client.login(apitoken);
	}

	receive = (message) => {
		if (message.content.substring(0, prefix.length) != prefix) {
			return;
		}

		if (message.author.id == this.botId) {
			return;
		}

		let processedMsg = message.content
			.replace(/\s\s+/g, " ")
			.replace(prefix, "");

		let msgArr = processedMsg.split(" ");
		if (msgArr[0] === "link") {
			this.fetchTemplate(message, msgArr, this.link);
			return;
		}
		if (msgArr[0] === "notification") {
			this.fetchTemplate(message, msgArr, this.notification);
			return;
		}
		if (msgArr[0] === "sf") {
			this.fetchTemplate(message, msgArr, this.sketchfecta);
			return;
		}
	};

	errorHandling = async (error) => {
		let errCh = await this.client.channels.fetch(errorCh);
		errCh.send(error);
	};

	fetchTemplate = async (message, args, callback) => {
		if (botMsgUrl) {
			axios
				.get(botMsgUrl)
				.then((response) => {
					this.msgTemplates = xml.parse(response.data);
					callback(message, args);
				})
				.catch(async (error) => {
					if (error.response) {
						this.errorHandling(error.response);
					} else {
						this.errorHandling(error.message);
					}
				});
		} else {
			callback(message, args);
		}
	};

	link = (message, args) => {
		let tokenStr = crypto.randomBytes(6).toString("hex");
		let user = message.author;
		let admin = message.member
			? message.member.roles.cache.has(adminRoleId)
			: false;

		Token.findOneAndUpdate(
			{ userId: user.id },
			{
				userId: user.id,
				userName: user.tag,
				token: tokenStr,
				date: null,
				admin: admin ? true : false,
			},
			{ upsert: true },
			(err, doc) => {
				if (err) {
					user.send("Error: " + err);
					return;
				}

				let template = this.msgTemplates.link
					? this.msgTemplates.link
					: "Do not share these links around as these are your private links.\n" +
					  `In case someone managed to get your private link, you can reissue a new link using \`${prefix}link\`.\n` +
					  "For role priviledges, reissue your link from within the server.\n" +
					  "Thank you for your participation!\n";

				let nextLn = "\n";
				let link1 = `Submit prompt: ${host}/${routes.web.promptForm}/${tokenStr}\n`;
				let link2 = admin
					? `Manage prompts: ${host}/${routes.web.managePrompts}/${tokenStr}\n`
					: "";

				user.send(template + nextLn + link1 + link2);
			}
		);
	};

	notification = async (message, args) => {
		let notifyCommandArr = notifyRoleCommands.split(",");
		let notifyIDArr = notifyRoleIds.split(",");
		let channel = message.channel;
		let member = message.member;

		if (!member) return;

		if (!member.roles.cache.has(memberRoleId)) {
			//roles.push(memberRoleId);
			await member.roles.add(memberRoleId);
		}

		let check = false;
		for (let i = 0; i < notifyCommandArr.length; i++) {
			if (args[1] === notifyCommandArr[i]) {
				let promiseList = [];
				for (let j = 0; j < notifyIDArr.length; j++) {
					if (member.roles.cache.has(notifyIDArr[j]))
						promiseList.push(member.roles.remove(notifyIDArr[j]));
				}

				await Promise.all(promiseList);

				member.roles.add(notifyIDArr[i]);
				check = true;
				break;
			}
		}

		if (check) {
			let template =
				this.msgTemplates.notification &&
				this.msgTemplates.notification.success
					? this.msgTemplates.notification.success
					: "Role has been successfully set!";
			channel.send(template);
		} else {
			let template =
				this.msgTemplates.notification &&
				this.msgTemplates.notification.wrong_command
					? this.msgTemplates.notification.wrong_command
					: "You need to specify a valid role for 'notification'.";
			let commandList = `\nUsage: \`${prefix}notification ${notifyCommandArr.join(
				"|"
			)}\``;

			channel.send(`${template}${commandList}`);
		}
	};

	sketchfecta = (message, args) => {
		let channel = message.channel;
		if (args.length < 2) {
			channel.send(`Usage: `);
			return;
		}

		if (args[1] == "make") {
			this.sfMake(message, args);
			return;
		}

		if (args[1] == "preview") {
			this.sfPreview(message, args);
			return;
		}

		if (args[1] == "set") {
			this.sfSet(message, args);
			return;
		}
	};

	sfSet = (message, args) => {
		let channel = message.channel;
		let user = message.author;
		if (args.length > 2) {
			let updatedObj = { userId: user.id, imageUrl: args[2] };
			if (args.length > 3) {
				if (!/^[0-9A-F]{6}$/i.test(args[3])) {
					let template =
						this.msgTemplates.sketchfecta &&
						this.msgTemplates.sketchfecta.invalid_color
							? this.msgTemplates.sketchfecta.invalid_color
							: "Invalid color code. Color code should only include 6 hex values, without #. (Eg. 12AB45)";
					channel.send(template);
					return;
				}
				updatedObj.fontColor = args[3];
			}

			SFTheme.findOneAndUpdate(
				{ userId: user.id },
				updatedObj,
				{ upsert: true },
				(err, doc) => {
					if (err) {
						channel.send("Error: " + err);
						return;
					}

					let template =
						this.msgTemplates.sketchfecta &&
						this.msgTemplates.sketchfecta.set_success
							? this.msgTemplates.sketchfecta.set_success
							: `Your Sketchfecta theme has been successfully set! Use \`${prefix}sf preview\` to preview your sketchfecta.`;
					channel.send(template);
				}
			);
			return;
		}

		SFTheme.findOneAndRemove({ userId: user.id }, (err, doc) => {
			if (err) {
				channel.send("Error: " + err);
				return;
			}

			let template =
				this.msgTemplates.sketchfecta &&
				this.msgTemplates.sketchfecta.unset_success
					? this.msgTemplates.sketchfecta.unset_success
					: "Your Sketchfecta theme has reset to default!";
			channel.send(template);
		});
	};

	sfPreview = async (message, args) => {
		let channel = message.channel;
		let user = message.author;
		let sftheme = await SFTheme.findOne({ userId: user.id });

		channel.send("Generating image...");

		let prompts = [
			__dirname + "/sketchfecta/asset/sample/sample1.jpg",
			__dirname + "/sketchfecta/asset/sample/sample2.jpg",
			__dirname + "/sketchfecta/asset/sample/sample3.jpg",
			__dirname + "/sketchfecta/asset/sample/sample4.jpg",
			__dirname + "/sketchfecta/asset/sample/sample5.jpg",
		];
		let sfTemplate = sftheme
			? sftheme.imageUrl
			: __dirname + "/sketchfecta/asset/sfDefault.png";
		let sff = new sfFactory(channel, sfTemplate, prompts);

		sff.setText(user.tag, "Xth", "");
		sff.fontColor = sftheme ? `#${sftheme.fontColor}` : "black";

		sff.draw(this.sfMakeCallback).catch((error) => {
			let template =
				this.msgTemplates.sketchfecta &&
				this.msgTemplates.sketchfecta.preview_invalid
					? this.msgTemplates.sketchfecta.preview_invalid
					: `An error occurred. Ensure that image URL provided are working properly.`;
			channel.send(template);

			this.errorHandling(`${error.name}: ${error.message}`);
		});
	};

	sfMake = async (message, args) => {
		let admin = message.member
			? message.member.roles.cache.has(adminRoleId)
			: false;
		let mention = message.mentions.users.array()[0];
		let channel = message.channel;
		let user = message.author;

		let sftheme = await SFTheme.findOne({ userId: mention.id });

		if (!admin) return;

		let prompts = [];
		for (let i = 2; i < 7; i++) {
			prompts.push(args[i]);
		}

		channel.send("Generating image...");

		let sfTemplate = sftheme
			? sftheme.imageUrl
			: __dirname + "/sketchfecta/asset/sfDefault.png";
		let sff = new sfFactory(channel, sfTemplate, prompts);

		sff.setText(mention.tag, args[8], args[9]);
		sff.fontColor = sftheme ? `#${sftheme.fontColor}` : "black";

		sff.draw(this.sfMakeCallback).catch((error) => {
			let template =
				this.msgTemplates.sketchfecta &&
				this.msgTemplates.sketchfecta.make_invalid
					? this.msgTemplates.sketchfecta.make_invalid
					: `An error occurred. Ensure that the command is correctly issued. (${prefix}sf prompt1...prompt5, name, count, [date])`;
			channel.send(template);

			this.errorHandling(`${error.name}: ${error.message}`);
		});
	};

	sfMakeCallback = (channel, buffer) => {
		const attachment = new MessageAttachment(buffer, "sketchfecta.png");
		channel.send("", attachment);
	};

	sendPromptsMsg = async (promptsMsg) => {
		let dateCur = moment().tz(timezone).format("MMM Do, YYYY");

		let dateMsg = `**>\n>\n>\n${dateCur}**\n\n`;

		let archCh = await this.client.channels.fetch(archiveChId);
		archCh.send(`${dateMsg}${promptsMsg}`);

		promptChId.forEach(async (chId) => {
			let pmtCh = await this.client.channels.fetch(chId);
			pmtCh.send(dateMsg);
		});
	};

	sendPrompts = (prompts) => {
		let promptsMsg = "";

		let count = 1;
		prompts.forEach((prompt) => {
			promptsMsg += `**Prompt ${count} (Submitted by ${
				prompt.anonymous ? "Anonymous" : "<@" + prompt.userId + ">"
			}):** ${prompt.prompt} [${prompt.duration}] \n`;
			count++;
		});

		this.sendPromptsMsg(promptsMsg);
	};
}

export default BotManager;
