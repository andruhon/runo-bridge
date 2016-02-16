var fs = require("fs");
var path = require("path");
var os = require("os");
const readline = require('readline');

var rustLibName = "embed";
var rustSourceFile = path.resolve(path.join("src/"+rustLibName+".rs"));
var noManglePattern = '#[no_mangle]';
var fnDefPattern = 'pub extern "C" fn ';
var fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*->\\s*(\\w*)";

var results = {
  module_name: rustLibName,
  functions: []
};

const rl = readline.createInterface({
  input: fs.createReadStream(rustSourceFile)
});

var parseFunc = function(fnDef) {
  var fnSig = fnDef.substr(fnDefPattern.length)
  var fnSigRegex = new RegExp(fnSigPattern, "g");
  var parsed = fnSigRegex.exec(fnSig);
  if (!parsed) {
    console.error("can't parse "+fnSig);
    return;
  }
  var inputs = [];
  parsed[2].split(",").forEach(function(v){
    inputs.push.apply(inputs, v.split(":").map(function(v){
      return {name: v[0].trim(), type: v[0].trim()};
    }));
  });
  return {
    name: parsed[1],
    inputs: inputs,
    output: parsed[3]
  }
}

/* search for no_mangle functions with extern "C" */
var prevMangle = false;
rl.on('line', (line) => {
  if (prevMangle) {
    var fnDef = line.trim().replace(/\s+/g," ");
    if (fnDef.startsWith(fnDefPattern)) {
      var fnParsed = parseFunc(fnDef);
      if (fnParsed) {
        results.functions.push(fnParsed);
      }
    } else {
      console.error(noManglePattern+" is not followed by the line with"+fnDefPattern);
    }
  }
  if(line.trim().startsWith(noManglePattern)) {
    prevMangle = true;
  } else {
    prevMangle = false;
  }
});
rl.on('close',function(){
  //TODO: wrap into async func and export
  console.log(results);
});
