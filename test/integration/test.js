os = require('os');
addon = require('../resources/build/Debug/addon');
var assert = require('assert');

describe('Integration', function() {
  it('should run functions from embed.rs', function () {
    assert.equal(addon.int_in_int_out(2),4, "int_in_int_out 2");

    assert.equal(addon.is_greather_than_42(50), true, "is_greather_than_42 50");

    assert.equal(addon.is_greather_than_42(5), false, "is_greather_than_42 5");

    assert.equal(addon.get_42(true), 42, "get_42 true");

    assert.equal(addon.get_42(false), 0, "get_42 false");

    assert.equal(
      addon.rs_experimental_string("Looooong string from JS dfsdfsdf sd123456789 JSEOM"),
      "Looooong string from JS dfsdfsdf sd123456789 JSEOM+ append from Rust",
      "rs_experimental_string"
    );

    assert.equal(addon.double_multiply_plus2(3.14,2), 3.14*2+2, "double_multiply_plus2");

    assert.equal(Math.round(addon.float_multiply_plus2(3.14,2)), Math.round(3.14*2+2), "float_multiply_plus2 p1");
    assert.notEqual(addon.float_multiply_plus2(3.14,2), 3.14*2+2, "float_multiply_plus2 p2");
  });
});
