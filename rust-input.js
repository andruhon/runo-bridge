/* temporary input object */
module.exports = {
  module_name: "addon",
  functions: [
    {
      name: "int_in_int_out",
      inputs: [{name: "num", type: "c_int"}],
      output: "c_int"
    },
    {
      name: "is_greather_than_42",
      inputs: [{name: "num", type: "c_int"}],
      output: "bool"
    },
    {
      name: "get_42",
      inputs: [{name: "mybool", type: "bool"}],
      output: "c_int"
    }
  ]
};
