window.onload = () => {
	// DOM loaded
};

const router = new VueRouter({
	routes: []
});

Vue.component("date-display", {
	data: {},

	mounted: function() {
		setInterval(() => {
			this.updateTime();
		}, 1000);
	},
	methods: {
		updateTime() {
			this.date = moment();
			this.date = this.date.tz("Etc/GMT+5").format();
		}
	},
	template: `<div>{{date}}</div>`
});

// vue.js
window.app = new Vue({
	router,
	el: "#app",
	data: {
		date: ""
	},
	filter: {},
	computed: {},
	watch: {},
	methods: {}
});
