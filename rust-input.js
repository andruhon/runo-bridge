module.exports = {
  module_name: "addon",
  functions: [
    {
      name: "int_in_int_out",
      inputs: [{name: "num", type: "c_int"}],
      output: "c_int"
    }
  ]
};
