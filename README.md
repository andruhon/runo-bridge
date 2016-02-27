#RuNo bridge Simple Rust to NodeJS bridge

Prototype generating C++ boilerplate NodeJS addon wrapper for simple Rust library.

**Use on your own risk!**

Only `int` and `bool` and `string` as params and outputs at the moment.

##usage

Generate V8 addon C++ code from Rust source source.rs `runo-bridge <source> <output>`:

  runo-bridge source.rs addon.cc

RuNo will look for `no-manlge` `extern "C"` functions and will generate NodeJS addon boilerplate for them.

It is also possible to provide library binary interface definition as a JSON:

  runo-bridge my-interface.json addon.cc

JSON format is:

```
{
  "module_name": "embed",
  "functions": [
    {
      "name": "add",
      "inputs": [
        {
          "name": "arg1",
          "type": "c_int"
        },
        {
          "name": "arg2",
          "type": "c_int"
        }
      ],
      "output": "c_int"
    },
    ...
  ]
}
```

See https://github.com/andruhon/runo-bridge-example for more detailed usage example


##Motivation

It would be nice to have something simple to use with just implementing extern C method with C primitives without knowledge of V8. FFI seems to be a good option, however, unfortunately it is far to slow to call multiple functions, see: https://github.com/wtfil/rust-in-node#results
