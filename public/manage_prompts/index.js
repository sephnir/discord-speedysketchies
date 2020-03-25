window.onload = () => {};

const router = new VueRouter({
	mode: "history",
	routes: [
		{
			path: "/manage_prompts/:token"
		}
	]
});

var app = new Vue({
	router,
	el: "#app",
	data: {
		state: 0,
		postDialog: false,
		postMessage: "",
		token: "",
		pagination: {
			sortBy: "name"
		},
		selected: [],
		search: "",
		group: null,
		groupdesc: false,
		grouping: null,
		grouplist: [
			{ value: "posted", text: "Status" },
			{ value: "duration", text: "Duration (Mins)" },
			{ value: "anonymous", text: "Anonymous" },
			{ value: "userName", text: "Author" },
			{ value: "date", text: "Date Posted (DD/MM/YYYY)" }
		],
		headers: [
			{
				value: "posted",
				text: "Status",
				filterable: true,
				width: "5%",
				divider: true,
				align: "center"
			},
			{
				value: "prompt",
				text: "Prompt",
				divider: true
			},
			{
				value: "duration",
				text: "Duration (Mins)",
				divider: true,
				width: "5%",
				align: "center",
				filterable: false,
				sort: function(a, b) {
					if (a > b) return 1;
					if (a < b) return -1;
					return 0;
				}
			},
			{
				value: "anonymous",
				text: "Anonymous",
				divider: true,
				width: "5%",
				align: "center"
			},
			{
				value: "userName",
				text: "Author",
				divider: true,
				width: "10%",
				align: "center"
			},
			{
				value: "userId",
				text: "Author ID",
				divider: true,
				width: "10%",
				align: "center"
			},
			{
				value: "date",
				text: "Date Posted (DD/MM/YYYY)",
				divider: true,
				width: "8%",
				align: "center",
				sort: function(a, b) {
					if (
						moment(a, "DD/MM/YYYY HH:mm").isAfter(
							moment(b, "DD/MM/YYYY HH:mm")
						)
					)
						return 1;
					if (
						moment(a, "DD/MM/YYYY HH:mm").isBefore(
							moment(b, "DD/MM/YYYY HH:mm")
						)
					)
						return -1;
					return 0;
				}
			}
		],
		prompts: []
	},
	mounted: function() {
		this.token = this.$route.params.token;
		this.fetchPrompts();
	},
	methods: {
		checkGrouping() {
			this.grouping =
				this.group && this.group.length ? this.groupdesc : null;
		},
		fetchPrompts() {
			axios
				.post("/api/fetch_prompts", {
					token: this.token
				})
				.then(res => {
					if (res.data) {
						this.prompts = res.data;
						this.prompts.forEach(prompt => {
							prompt.date = moment(prompt.createdAt).format(
								"DD/MM/YYYY HH:mm"
							);
						});
						this.state = 2;
						return;
					}
					this.state = 1;
				})
				.catch(err => {
					console.log(err);
					if (err.status == 401) {
						this.state = 1;
						this.message = err;
					}
					this.state = -1;
					this.message = err;
				});
		},
		statusChange(id, val) {
			val = !val;
			this.updatePromptsStatus([id], [val]);
		},

		updatePromptMessage() {
			if (this.selected.length == 5) {
				let strBuilder = "";

				for (let i = 0; i < 5; i++) {
					strBuilder += `**Prompt ${i + 1} (Submitted by ${
						this.selected[i].anonymous
							? "Anonymous"
							: "<@" + this.selected[i].userId + ">"
					}):** ${this.selected[i].prompt} [${
						this.selected[i].duration
					}] \n`;
				}

				this.postMessage = strBuilder;
			}
		},

		updatePromptsStatus(idArr, statusArr) {
			axios
				.post("/api/update_prompts_status", {
					token: this.token,
					prompts: idArr,
					statuses: statusArr
				})
				.then(res => {
					this.fetchPrompts();
				})
				.catch(err => {
					console.log(err);
					if (err.status == 401) {
						this.state = 1;
						this.message = err;
					}
					this.state = -1;
					this.message = err;
				});
		},

		postPrompts() {
			let idArr = [];

			for (let i = 0; i < this.selected.length; i++) {
				idArr.push(this.selected[i]._id);
			}

			axios
				.post("/api/post_prompts", {
					token: this.token,
					prompts: idArr,
					message: this.postMessage
				})
				.then(res => {
					this.fetchPrompts();
				})
				.catch(err => {
					console.log(err);
					if (err.status == 401) {
						this.state = 1;
						this.message = err;
					}
					this.state = -1;
					this.message = err;
				});

			this.selected = [];
		}
	},
	vuetify: new Vuetify()
});
