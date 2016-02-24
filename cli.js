var parser = require("./dist/Parser.js");
var generator = require("./dist/Generator.js");
var fs = require("fs");
var path = require("path");
var program = require('commander');

// var p = new parser.Parser();
// p.parse().then(function(){
//   console.log(2);
// });

var defaultTemplate =path.join(__dirname,"templates","addon.cc");

program
  .version('0.0.1');


program
  .command('generate <input>')
  .description('generate C++ addon from Rust or JSON input')
  .action(function(input) {
    console.log("generating from "+input);
    var template = fs.readFileSync(defaultTemplate, 'utf8');
    var inputVal = JSON.parse(fs.readFileSync(input, 'utf8'));
    var g = new generator.Generator(inputVal, template);
    console.log(g.generate());
  });

program.parse(process.argv);
