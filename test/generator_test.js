var assert = require('assert');
var fs = require("fs");
var path = require("path");

var generator = require("../dist/Generator.js");

describe('Generator', function() {
  var template = fs.readFileSync("templates/addon.cc", 'utf8');
  var input =  JSON.parse(fs.readFileSync("test/resources/input.json", 'utf8'));

  it('should not throw when instatinated', function () {
    assert.doesNotThrow(function(){
      new generator.Generator(input, template);
    }, Error);
    assert.ok(false);
  });

  it('should not throw when generating', function () {
    assert.doesNotThrow(function(){
      (new generator.Generator(input, template)).generate();
    }, Error);
  });

  it('generate() should return some C++ code', function () {
    var result = (new generator.Generator(input, template)).generate();
    assert(template.indexOf('{{extern_c_functions}}')>=0,"template should contain extern_c_functions template");
    assert(template.indexOf('{{nan_inits}}')>=0,"template should contain nan_inits template");
    assert(template.indexOf('{{nan_methods}}')>=0,"template should contain nan_inits template");

    assert(result, "returns non empty value");
    assert(typeof result === 'string', "returns a string value");
    assert(result.length>100, "returns not too short string");
    assert(result.length>100, "returns not too short string");
    assert(result.indexOf('{{extern_c_functions}}')<0,"result should not contain extern_c_functions template");
    assert(result.indexOf('{{nan_inits}}')<0,"result should not contain nan_inits template");
    assert(result.indexOf('{{nan_methods}}')<0,"result should not contain nan_inits template");
  });

});
