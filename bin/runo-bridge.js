#!/usr/bin/env node

process.title = 'runo-bridge';

var generatorTemplate = 'DefaultNanGenerator';

var parser = require("../dist/Parser.js");
var generator = require("../dist/"+generatorTemplate+".js");
var fs = require("fs");
var path = require("path");
var program = require('commander');

var defaultTemplate =path.join(__dirname,"..","templates","DefaultNan.cc");

program
  .version('0.0.1')
  .description('RuNo bridge is a command-line utility to generate C++ boilerplate to call Rust natively from Node JS, using the C ABI');


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
      var result = (new generator[generatorTemplate](inputVal, template)).generate();
      fs.writeFileSync(output,result,'utf8');
      console.log("wrote content to "+output);
    }).catch(function(reason){
      console.error(reason);
    });
  });

program
  .command('parse <input>')
  .description('parse Rust file and output JSON')
  .action(function(input, output) {
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
          case ".rs":
            (new parser.Parser(fs.createReadStream(input), path.basename(input,extname), {verbosity: 1})).parse().then(resolve);
            break;
          default:
            reject("Unexpected input file extension, need .json or .rs");
        }
      })
    }).then(function(inputVal){
      console.log(JSON.stringify(inputVal,null,'  '));
    }).catch(function(reason){
      console.error(reason);
    });
  });

program
  .command('*')
  .action(function(){
    program.outputHelp();
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
