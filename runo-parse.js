var fs = require("fs");
var os = require("os");
var path = require("path");
const readline = require('readline');

var noManglePattern = '#[no_mangle]';
var fnDefPattern = 'pub extern "C" fn ';
var fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*(\\w*)";

var parseFunc = function(fnDef) {
  var fnSig = fnDef.substr(fnDefPattern.length)
  var fnSigRegex = new RegExp(fnSigPattern, "g");
  var parsed = fnSigRegex.exec(fnSig);
  if (!parsed) {
    console.error("can't parse "+fnSig);
    return;
  }
  var inputs = parsed[2].split(",").map(function(v){
      var input = v.split(":");
      console.log(input[1].replace(/(const|mut)/,"").replace(/\s*/g,""));
      return {name: input[0].trim(), type: input[1].replace(/(const|mut)*/g,"").replace(/\s*/g,"")};
  });
  if (parsed[4]) {
    var output = parsed[4].replace(/(const|mut)/,"").replace(/\s*/g,"")
  } else {
    var output = "void";
  }
  return {
    name: parsed[1],
    inputs: inputs,
    output: output
  }
}

/* search for no_mangle functions with extern "C" */
module.exports = function(rustSourcePath, callback) {
  var results = {
    module_name: path.basename(rustSourcePath,'rs'),
    functions: []
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(rustSourcePath)
  });

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
    console.log("found following extern functions:");
    console.log(JSON.stringify(results,null,"  "));
    callback(results);
  });
};
