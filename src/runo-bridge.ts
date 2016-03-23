#!/usr/bin/env node

process.title = 'runo-bridge';

import {Parser, ASYNC, IParserSettings} from "./Parser";
import * as fs from "fs";
import * as path from "path";
import * as program from "commander";


var generatorTemplate = 'DefaultNan';
var generatorName = generatorTemplate+'Generator';
var generator = require("../dist/generators/"+generatorTemplate+"/"+generatorName+".js");
const asyncHelp = `[values] NO|ALL|DETECT.
  NO      do not wrap functions into async wrappers (default);
  ALL     all functions will be called in a separate thread,
          adding last param as a callback with result argument;
  DETECT  detect functions with 'async' and
          make them async as described above;
`;

program
  .version('0.2.0')
  .description('RuNo bridge is a command-line utility to generate C++ boilerplate to call Rust natively from Node JS, using the C ABI');


program
  .command('generate <input> <output>')
  .description('generate C++ addon from Rust or JSON input')
  .option('--async [value]', asyncHelp)
  .action(function(input, output, options) {
    var extname = path.extname(input);
    let settings:IParserSettings = {
      verbosity: 1
    }
    if (options.async && typeof options.async == 'string') {
      let async: number = ASYNC[options.async.toUpperCase() as string];
      if (typeof async == 'number') settings.async = async;
    }
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
            (new Parser(fs.createReadStream(input), path.basename(input,extname), settings)).parse().then(resolve);
            break;
          default:
            reject("Unexpected input file extension, need .json or .rs");
        }
      })
    }).then(function(inputVal){
      var result = (new generator[generatorName](inputVal)).generate();
      fs.writeFileSync(output,result,'utf8');
      console.log("wrote content to "+output);
    }).catch(function(reason){
      console.error(reason);
    });
  });

program
  .command('parse <input>')
  .description('parse Rust file and output JSON')
  .option('--async [value]', asyncHelp)
  .action(function(input, options) {
    //options.async
    let settings:IParserSettings = {
      verbosity: 1
    }
    if (options.async && typeof options.async == 'string') {
      let async: number = ASYNC[options.async.toUpperCase() as string];
      if (typeof async == 'number') settings.async = async;
    }
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
            (new Parser(fs.createReadStream(input), path.basename(input,extname), settings)).parse().then(resolve);
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
