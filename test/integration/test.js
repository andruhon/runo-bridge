os = require('os');
addon = require('../resources/build/Release/addon');
var assert = require('assert');

describe('Integration', function() {
  it('should run int_in_int_out 2', function () {
    assert.equal(addon.int_in_int_out(2),4);
  });

  it('should run is_greather_than_42 50', function () {
    assert.equal(addon.is_greather_than_42(50), true);
  });

  it('should run is_greather_than_42 5', function () {
    assert.equal(addon.is_greather_than_42(5), false);
  });

  it('should run get_42 true', function () {
    assert.equal(addon.get_42(true), 42);
  });

  it('should run get_42 false', function () {
    assert.equal(addon.get_42(false), 0);
  });

  it('should run rs_experimental_string', function () {
    assert.equal(
      addon.rs_experimental_string("Looooong string from JS dfsdfsdf sd123456789 JSEOM"),
      "Looooong string from JS dfsdfsdf sd123456789 JSEOM+ append from Rust"
    );
  });

  it('should run double_multiply_plus2 3.14, 2', function () {
    assert.equal(addon.double_multiply_plus2(3.14,2), 3.14*2+2, "double_multiply_plus2");
  });

  it('should run float_multiply_plus2 3.14, 2', function () {
    assert.equal(Math.round(addon.float_multiply_plus2(3.14,2)), Math.round(3.14*2+2), "approx equal");
    assert.notEqual(addon.float_multiply_plus2(3.14,2), 3.14*2+2, "not exact equal with double calculation");
  });
});
