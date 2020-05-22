import { config } from "dotenv";
config();

import { createCanvas, loadImage } from "canvas";
import moment from "moment";
import "moment-timezone";

const PROMPT_COUNT = 5;
const WIDTH = 1036;
const HEIGHT = 677;
const PROMPT_WIDTH = 255;
const PROMPT_HEIGHT = 255;
const PROMPT_POS_X = [68, 68, 391, 713, 713];
const PROMPT_POS_Y = [59, 382, 382, 382, 59];

const FONT_SIZE = 26;
const NAME_X = WIDTH / 2;
const NAME_Y = 80;
const NAME_W = 283;
const COUNTER_X = 458;
const COUNTER_Y = 160;
const COUNTER_W = 71;
const DATE_X = 543;
const DATE_Y = 240;
const DATE_W = 141;

const TIMEZONE = process.env.TIMEZONE;

export default class sfFactory {
	channel;
	canvas;
	context;
	baseUrl;
	fontColor = "black";
	promptsUrl = [];
	name = "";
	counter = "";
	date = "";

	constructor(channel, baseUrl, promptsUrlArr) {
		this.channel = channel;
		this.canvas = createCanvas(WIDTH, HEIGHT);
		this.context = this.canvas.getContext("2d");
		this.baseUrl = baseUrl;
		this.promptsUrl = promptsUrlArr;
	}

	setText = (name, counter, date) => {
		this.name = name;
		this.counter = counter;
		this.date = date;
	};

	currentDate = () => {
		this.date = moment().tz(TIMEZONE).format("MM-DD-yyyy");
	};

	draw = async (callback) => {
		let promises = [];

		for (let prompt of this.promptsUrl) {
			promises.push(loadImage(prompt));
		}
		promises.push(loadImage(this.baseUrl));

		let images = await Promise.all(promises);

		this.context.fillStyle = "white";
		this.context.fillRect(0, 0, WIDTH, HEIGHT);

		for (let i = 0; i < images.length; i++) {
			if (i == images.length - 1) {
				this.context.drawImage(images[i], 0, 0, WIDTH, HEIGHT);
			} else {
				let di = i; // - 1;

				let imgW = images[i].width;
				let imgH = images[i].height;
				let newW = PROMPT_WIDTH;
				let newH = PROMPT_HEIGHT;
				let newX = PROMPT_POS_X[di];
				let newY = PROMPT_POS_Y[di];
				if (imgW > imgH) {
					newH = (imgH / imgW) * PROMPT_WIDTH;
					newY = PROMPT_POS_Y[di] + (PROMPT_HEIGHT - newH) / 2;
				}
				if (imgW < imgH) {
					newW = (imgW / imgH) * PROMPT_HEIGHT;
					newX = PROMPT_POS_X[di] + (PROMPT_WIDTH - newW) / 2;
				}

				this.context.drawImage(images[i], newX, newY, newW, newH);
			}
		}

		this.context.font = "24px serif";
		this.context.fillStyle = this.fontColor;
		this.context.textBaseline = "top";
		this.context.textAlign = "center";

		if (this.date == "" || this.date == undefined) this.currentDate();

		this.context.fillText(this.name, NAME_X, NAME_Y, NAME_W);
		this.context.fillText(this.counter, COUNTER_X, COUNTER_Y, COUNTER_W);
		this.context.fillText(this.date, DATE_X, DATE_Y, DATE_W);

		callback(this.channel, this.canvas.toBuffer());
	};
}
