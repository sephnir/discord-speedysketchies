window.onload = () => {
	// DOM loaded
};

var base_url = window.location.origin;
var host = window.location.host;

const router = new VueRouter({
	mode: "history",
	routes: [
		{
			path: "/prompt_form/:token"
		}
	]
});

var app = new Vue({
	router,
	el: "#app",
	data: {
		state: 0,
		message: "",
		name: "",
		token: "",
		prompt: "",
		promptError: "",
		duration: "5",
		anon: true
	},
	mounted: function() {
		this.token = this.$route.params.token;
		this.authToken();
	},
	methods: {
		authToken: function() {
			axios
				.post("/api/auth_token", {
					token: this.token
				})
				.then(res => {
					if (res.data) {
						this.name = res.data.userName.split("#")[0];
						this.state = 2;
						return;
					}
					this.state = 1;
				})
				.catch(err => {
					this.state = -1;
					this.message = err;
				});
		},

		validate: function(e) {
			if (this.promptUpdate()) {
				this.submitPrompt();
			}

			e.preventDefault();
		},

		submitPrompt: function() {
			this.state = 0;
			axios
				.post("/api/submit_prompt", {
					token: this.token,
					prompt: this.prompt,
					duration: this.duration,
					anon: this.anon
				})
				.then(res => {
					this.state = -1;
					this.message =
						"You have successfully submitted a prompt! Thank you for your participation!";
				})
				.catch(err => {
					this.state = 3;
					this.message = err;
				});
		},

		back: function() {
			this.state = 2;
		},

		promptUpdate: function(e) {
			if (this.prompt === "" || this.prompt == null) {
				this.promptError = "is-invalid";
				return false;
			}
			this.promptError = "";
			return true;
		}
	}
});
