var assert = require('assert');
var fs = require("fs");
var path = require("path");

var generatorTemplate = 'DefaultNanGenerator';

var generator = require("../dist/"+generatorTemplate+".js");

describe('Generator', function() {
  var template = fs.readFileSync("templates/DefaultNan.cc", 'utf8');
  var input =  JSON.parse(fs.readFileSync("test/resources/input.json", 'utf8'));

  it('should not throw when instatinated', function () {
    assert.doesNotThrow(function(){
      new generator[generatorTemplate](input, template);
    }, Error);
  });

  it('should not throw when generating', function () {
    assert.doesNotThrow(function(){
      (new generator[generatorTemplate](input, template)).generate();
    }, Error);
  });

  it('generate() should return some C++ code', function () {
    var result = (new generator[generatorTemplate](input, template)).generate();
    assert(template.indexOf('${extern_c_functions}')>=0,"template should contain extern_c_functions template");
    assert(template.indexOf('${inits}')>=0,"template should contain inits template");
    assert(template.indexOf('${methods}')>=0,"template should contain methods template");

    assert(result, "returns non empty value");
    assert(typeof result === 'string', "returns a string value");
    assert(result.length>100, "returns not too short string");
    assert(result.length>100, "returns not too short string");
    assert(result.indexOf('${extern_c_functions}')<0,"result should not contain extern_c_functions template");
    assert(result.indexOf('${inits}')<0,"result should not contain nan_inits template");
    assert(result.indexOf('${methods}')<0,"result should not contain nan_inits template");
  });

});
