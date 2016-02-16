var fs = require("fs");
var path = require("path");

var parse = require('./runo-parse.js');
var generate = require('./runo-generate.js');

var rustSourcePath = path.resolve(path.join("src/embed.rs"));
var cppTemplate = fs.readFileSync(path.join(__dirname,"templates/addon.cc"),"utf8");
var outputPath = path.resolve("src/addon.cc");

parse(rustSourcePath, function(functions){
  generate(cppTemplate, outputPath, functions);
});
