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
			{ value: "date", text: "Date (DD/MM/YYYY)" }
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
					return -(a < b);
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
				value: "date",
				text: "Date (DD/MM/YYYY)",
				divider: true,
				width: "8%",
				align: "center",
				sort: function(a, b) {
					if (
						moment(a, "DD/MM/YYYY").isAfter(moment(b, "DD/MM/YYYY"))
					)
						return 1;
					if (
						moment(a, "DD/MM/YYYY").isBefore(
							moment(b, "DD/MM/YYYY")
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
								"DD/MM/YYYY"
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
					prompts: idArr
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
