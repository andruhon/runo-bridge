# This repository is archived

# RuNo bridge Simple Rust to NodeJS bridge

**A Prototype! Please read whole readme first and use on your own risk!**

[![Build Status](https://api.travis-ci.org/andruhon/runo-bridge.svg?branch=master)](http://travis-ci.org/andruhon/runo-bridge)

**Call your Rust dynamic lib from Node JS with native C++ performance**

Do not hesitate to ask a question or propose something, I've created a special discussion issue for your convenience: https://github.com/andruhon/runo-bridge/issues/1

RuNo bridge is a command line tool which generates C++ boilerplate addon code to call Rust library from. It is not allmighty and only support primitives such as `int`, `float/double`, `bool` and a `string` at a moment, however it does not require any C++ knowledge from developer if you use primitives mentioned above and your Rust ABI interface complies with simple requirements:

* All your ABI functoins should be listed in one Rust file;
* Your library should use crate libc;
* Each ABI function should be preceeded with `#[no_mangle]`;
* Each ABI function should be prefixed with `pub extern "C"`;
* ABI Functions should only take params of `c_int`,`c_float`,`c_double` or `*c_char` (as a C string with EOF);
* ABI Functions should return either one of `c_int`,`c_float`,`c_double` or `*c_char` (as a C string with EOF)

RuNo bridge does not validate or compiles your Rust code, we presume that it is valid and compiles.

See [embed.rs](test/resources/src/embed.rs) in tests for example of compatible Rust code. Take this file as a source of true for current version.

See https://github.com/andruhon/runo-bridge-example for more standalone usage example

##Important
This package itself does not need Rust or C++ with node-gyp, it just emits a C++ source file.

However in order to build the source code, your rust and C++ compiler should be compatible with your NodeJS. It is **particularly important on Windows**, where Rust target should be MSVC not GNU, unless you building your NodeJS for Windows from source with GCC. For example, if one using **32 bit** NodeJS on Windows this one should use target `i686-pc-windows-msvc`, if **64 bit** Node then Rust should be configured with `x86_64-pc-windows-msvc` compile target. The same about C++: Everything is mostrly smooth on platforms with GCC, and a bit painful with MS Visual C++, please refer to [node-gyp installation instructions](https://github.com/nodejs/node-gyp) for details.

##Installation

    npm install runo-bridge -g

* global option used here for simplisity, however it is better to install it locally and run it as local npm binary.

##Usage

**Generate V8 addon C++ code from Rust source source.rs**

    runo-bridge generate <source> <output> [options]

**Options available**:

--async [NO|ALL|DETECT] - With this option it is possible to make functions async.
You don't need to mangle with V8 callbacks,
RuNo will generate C++ boilerplate code for you, which will run function
in a separate thread, take result from the function and pass value into callback.
Again you just write a normal function and RuNo will do all thread magic for you.

* NO      do not wrap functions into async wrappers (default);
* ALL     all functions will be called in a separate thread, adding last param as a callback with result argument;
* DETECT  detect functions with 'async' and make them async as described above;

See double_multiply_plus2_async in [embed.rs](test/resources/src/embed.rs)
and [integration/test.js](test/integration/test.js) for async usage example.

Example:

    runo-bridge generate src/source.rs intermediates/addon.cc

RuNo will look for `no-manlge` `extern "C"` functions and will generate NodeJS addon boilerplate for them.

    runo-bridge generate src/source.rs intermediates/addon.cc --async DETECT

same as above, plus detect functions with 'async' in the name and generate
boilerplate code to run then asynchronously, adding last param as an async
callback with a single param with a function result.

It is also possible to **provide library binary interface definition as a JSON**

    runo-bridge generate src/my-interface.json intermediates/addon.cc

See example JSON format in [input.json](test/resources/input.json) . Theoretically you can use this approach with any *precompiled* C ABI compatible dynamic library.

##Testing

Do `npm install` first.

Test RuNo bridge only:

    npm run test

Test that generated addon actually works (integration tests):

    npm run test-full

##Motivation

It would be nice to have something simple to use with just implementing extern C method with C primitives without knowledge of V8. FFI seems to be a good option, however, unfortunately it is far to slow to call multiple functions, see: https://github.com/wtfil/rust-in-node#results

##Other options
* https://github.com/rustbridge/neon/ Neon bridge (requires knowledge of V8)
* https://github.com/node-ffi/node-ffi Node FFI (good, but slow)
* https://github.com/andruhon/rust-in-node-examples implement your own addon to call Rust via C ABI
