#RuNo bridge Simple Rust to NodeJS bridge

Prototype generating C++ boilerplate NodeJS addon wrapper for simple Rust library.

**Use on your own risk!**

Only `int` and `bool` and `string` as params and outputs at the moment.

##important
This package itself does not need Rust or C++ with node-gyp, it just emits a C++ source file.

However in order to build this source code, your rust and C++ compiler should be compatible with your NodeJS. It is **particularly important on Windows**, where Rust target should be MSVC not GNU, unless you building your NodeJS for Windows from source with GCC. For example, if one using **32 bit** NodeJS on Windows this one should use target `i686-pc-windows-msvc`, if **64 bit** Node then Rust should be configured with `x86_64-pc-windows-msvc` compile target. The same about C++: Everything is mostrly smooth on platforms with GCC, and a bit painful with MS Visual C++, please refer to [node-gyp installation instructions](https://github.com/nodejs/node-gyp) for details.

##installation

    npm install runo-bridge -g

* global option used here for simplisity, however it is better to install it locally and run it as local npm binary.

##usage

Generate V8 addon C++ code from Rust source source.rs `runo-bridge <source> <output>`:

    runo-bridge generate source.rs addon.cc

RuNo will look for `no-manlge` `extern "C"` functions and will generate NodeJS addon boilerplate for them.

It is also possible to provide library binary interface definition as a JSON:

    runo-bridge generate my-interface.json addon.cc

JSON format is:

```
{
  "module_name": "embed",
  "functions": [
    {
      "name": "add",
      "parameters": [
        {
          "name": "arg1",
          "type": "c_int"
        },
        {
          "name": "arg2",
          "type": "c_int"
        }
      ],
      "return": "c_int"
    },
    ...
  ]
}
```

See https://github.com/andruhon/runo-bridge-example for more detailed usage example


##Motivation

It would be nice to have something simple to use with just implementing extern C method with C primitives without knowledge of V8. FFI seems to be a good option, however, unfortunately it is far to slow to call multiple functions, see: https://github.com/wtfil/rust-in-node#results
