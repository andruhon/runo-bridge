//Header
//This could go into separate header file defining interface:
#ifndef NATIVE_EXTENSION_GRAB_H
#define NATIVE_EXTENSION_GRAB_H

#include <nan.h>
#include <string>
#include <iostream>
#include <node.h>
#include <stdio.h>


using namespace std;
using namespace v8;
using v8::Function;
using v8::Local;
using v8::Number;
using v8::Value;
using Nan::AsyncQueueWorker;
using Nan::AsyncWorker;
using Nan::Callback;
using Nan::New;
using Nan::Null;
using Nan::To;

#endif


/* extern interface for Rust functions */
extern "C" {
{{extern_c_functions}}
}

{{nan_methods}}

NAN_MODULE_INIT(InitAll) {;
{{nan_inits}}
}


NODE_MODULE(addon, InitAll)
