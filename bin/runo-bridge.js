#!/usr/bin/env node

process.title = 'runo-bridge';

var parser = require("../dist/Parser.js");
var generator = require("../dist/Generator.js");
var fs = require("fs");
var path = require("path");
var program = require('commander');

var defaultTemplate =path.join(__dirname,"..","templates","addon.cc");

program
  .version('0.0.1');


program
  .command('generate <input> <output>')
  .description('generate C++ addon from Rust or JSON input')
  .action(function(input, output) {
    console.log("generating from "+input);
    var template = fs.readFileSync(defaultTemplate, 'utf8');
    var extname = path.extname(input);
    var p;
    new Promise(function(resolve, reject){
      fs.stat(input, function(err, stats){
        if (err || !stats.isFile()) {
          reject("File does not exist or not readible");
        } else {
          resolve()
        }
      })
    }).then(function(){
      return new Promise(function(resolve, reject){
        switch (extname) {
          case ".json":
            resolve(JSON.parse(fs.readFileSync(input, 'utf8')));
            break;
          case ".rs":
            (new parser.Parser(fs.createReadStream(input), path.basename(input,extname))).parse().then(resolve);
            break;
          default:
            reject("Unexpected input file extension, need .json or .rs");
        }
      })
    }).then(function(inputVal){
      var result = (new generator.Generator(inputVal, template)).generate();
      fs.writeFileSync(output,result,'utf8');
      console.log("wrote content to "+output);
    }).catch(function(reason){
      console.error(reason);
    });
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
