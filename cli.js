var parser = require("./dist/Parser.js");
var generator = require("./dist/Generator.js");
var fs = require("fs");

// var p = new parser.Parser();
// p.parse().then(function(){
//   console.log(2);
// });

var input = {
  "module_name": "embed.",
  "functions": [
    {
      "name": "int_in_int_out",
      "inputs": [
        {
          "name": "input",
          "type": "c_int"
        }
      ],
      "output": "c_int"
    },
    {
      "name": "is_greather_than_42",
      "inputs": [
        {
          "name": "input",
          "type": "c_int"
        }
      ],
      "output": "bool"
    },
    {
      "name": "get_42",
      "inputs": [
        {
          "name": "input",
          "type": "bool"
        }
      ],
      "output": "c_int"
    }
  ]
};

var template = fs.readFileSync("templates/addon.cc", 'utf8');

var g = new generator.Generator(input, template);
console.log(g.generate());
