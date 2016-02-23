var parser = require("./dist/Parser.js");

var p = new parser.Parser();
p.parse().then(function(){
  console.log(2);
});
