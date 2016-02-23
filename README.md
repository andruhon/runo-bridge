#RuNo bridge Simple Rust to NodeJS bridge

WIP. Making a proper cli

Prototype generating C++ boilerplate NodeJS addon wrapper for simple Rust library.

See https://github.com/andruhon/runo-bridge for usage example

Only `int` and `bool` and 'string' as params and outputs at the moment.

##Motivation

It would be nice to have something simple to use with just implementing extern C method with C primitives without knowledge of V8. FFI seems to be a good option, however, unfortunately it is far to slow to call multiple functions, see: https://github.com/wtfil/rust-in-node#results
