var assert = require('assert');
var fs = require("fs");
var path = require("path");

var parser = require("../dist/Parser.js");

var inputs = {
  'int': 'test/resources/int_to_int.rs',
  'embed': 'test/resources/src/embed.rs'
};

describe('Parser', function() {

  var input = inputs['int'];
  var extname = path.extname(input);

  var inputEmbed = inputs['embed'];
  var extnameEmbed = path.extname(inputEmbed);

  it('should not throw when instatinated with read stream', function () {
    assert.doesNotThrow(function(){
      new parser.Parser(fs.createReadStream(input), path.basename(input,extname), {verbosity: 0});
    }, Error);
  });

  it('int_to_int parse() should return promise like', function () {
    var p = new parser.Parser(fs.createReadStream(input), path.basename(input,extname), {verbosity: 0});
    var promise = p.parse();
    assert.ok(typeof promise.then === 'function');
  });

  it('int_to_int parse() promise should resolve', function () {
    var p = new parser.Parser(fs.createReadStream(input), path.basename(input,extname), {verbosity: 0});
    return p.parse();
  });

  it('int_to_int parse() result should contain data', function () {
    var p = new parser.Parser(fs.createReadStream(input), path.basename(input,extname), {verbosity: 0});
    return p.parse().then(function(result){
      assert.equal(result.module_name, "int_to_int", "result should contain module name");
      assert.deepEqual(result.functions, [{"name":"int_in_int_out","parameters":[{"name":"input","type":"c_int"}],"return":"c_int"}], "result should contain int_to_int func");
    });
  });

  it('embed parse() result should contain data', function () {
    var p = new parser.Parser(fs.createReadStream(inputEmbed), path.basename(inputEmbed,extnameEmbed), {verbosity: 0});
    return p.parse().then(function(result){
      assert.equal(result.module_name, "embed", "result should contain module name");
      assert.deepEqual(result.functions, [
        {"name":"int_in_int_out","parameters":[{"name":"input","type":"c_int"}],"return":"c_int"},
        {"name":"is_greather_than_42","parameters":[{"name":"input","type":"c_int"}],"return":"bool"},
        {"name":"get_42","parameters":[{"name":"input","type":"bool"}],"return":"c_int"},
        {"name": "rs_experimental_string",
            "parameters": [
              {
                "name": "s_raw",
                "type": "*c_char"
              }
            ],
            "return": "*c_char"
        },
        {"name":"float_multiply_plus2","parameters":[{"name":"in1","type":"c_float"},
        {"name":"in2","type":"c_float"}],"return":"c_float"},
        {"name":"double_multiply_plus2","parameters":[{"name":"in1","type":"c_double"},
        {"name":"in2","type":"c_double"}],"return":"c_double"}
      ]);
    });
  });

});
