window.onload = () => {
	// DOM loaded
};

const router = new VueRouter({
	routes: []
});

// vue.js
window.app = new Vue({
	router,
	el: "#app",
	data: {
		token: ""
	},
	filter: {},
	computed: {},
	watch: {},
	methods: {}
});

Vue.component("button-counter", {
	data: function() {
		return {
			count: 0
		};
	},
	template:
		'<button v-on:click="count++">You clicked me {{ count }} times.</button>'
});
