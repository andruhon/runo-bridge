var assert = require('assert');
var fs = require("fs");
var path = require("path");

var generatorTemplate = 'DefaultNan';
var generatorName = generatorTemplate+'Generator';

var generator = require("../dist/generators/"+generatorTemplate+"/"+generatorName+".js");

describe('Generator', function() {
  var input =  JSON.parse(fs.readFileSync("test/resources/input.json", 'utf8'));

  it('should not throw when instatinated', function () {
    assert.doesNotThrow(function(){
      new generator[generatorName](input);
    }, Error);
  });

  it('should not throw when generating', function () {
    assert.doesNotThrow(function(){
      (new generator[generatorName](input)).generate();
    }, Error);
  });

  it('generate() should return some C++ code', function () {
    var result = (new generator[generatorName](input)).generate();
    assert(result, "returns non empty value");
    assert(typeof result === 'string', "returns a string value");
    assert(result.length>100, "returns not too short string");
    assert(result.length>100, "returns not too short string");
    assert(result.indexOf('${extern_c_functions}')<0,"result should not contain extern_c_functions template");
    assert(result.indexOf('${inits}')<0,"result should not contain nan_inits template");
    assert(result.indexOf('${methods}')<0,"result should not contain nan_inits template");
  });

});
