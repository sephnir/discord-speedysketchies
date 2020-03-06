//Hook for babel, dotenv

// Set options as a parameter, environment variable, or rc file.
require = require("esm")(module /*, options*/);
module.exports = require("./server/server.js");

require("dotenv").config();

// var fs = require("fs");
// var browserify = require("browserify");
// browserify("./script.js")
//   .transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"]})
//   .bundle()
//   .pipe(fs.createWriteStream("bundle.js"));
