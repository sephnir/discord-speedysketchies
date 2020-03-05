window.onload = () => {
	// DOM loaded
};

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
		name: "",
		token: "",
		prompt: "",
		duration: "5",
		anon: true
	},
	mounted: function() {
		this.token = this.$route.params.token;
	}
});
