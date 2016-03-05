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
  extern "C" int int_in_int_out(int input);
  extern "C" bool is_greather_than_42(int input);
  extern "C" int get_42(bool input);
  extern "C" float float_multiply_plus2(float in1, float in2);
  extern "C" double double_multiply_plus2(double in1, double in2);
}

NAN_METHOD(int_in_int_out) {
  int input = To<int>(info[0]).FromJust();
  int result = int_in_int_out(input);
  info.GetReturnValue().Set(result);
}
NAN_METHOD(is_greather_than_42) {
  int input = To<int>(info[0]).FromJust();
  bool result = is_greather_than_42(input);
  info.GetReturnValue().Set(result);
}
NAN_METHOD(get_42) {
  bool input = To<bool>(info[0]).FromJust();
  int result = get_42(input);
  info.GetReturnValue().Set(result);
}
NAN_METHOD(float_multiply_plus2) {
  double in1 = To<double>(info[0]).FromJust();
  double in2 = To<double>(info[1]).FromJust();
  float result = float_multiply_plus2(in1, in2);
  info.GetReturnValue().Set(result);
}
NAN_METHOD(double_multiply_plus2) {
  double in1 = To<double>(info[0]).FromJust();
  double in2 = To<double>(info[1]).FromJust();
  double result = double_multiply_plus2(in1, in2);
  info.GetReturnValue().Set(result);
}

NAN_MODULE_INIT(InitAll) {;
  Nan::Set(target, New("int_in_int_out").ToLocalChecked(),    Nan::GetFunction(New<FunctionTemplate>(int_in_int_out)).ToLocalChecked());
  Nan::Set(target, New("is_greather_than_42").ToLocalChecked(),    Nan::GetFunction(New<FunctionTemplate>(is_greather_than_42)).ToLocalChecked());
  Nan::Set(target, New("get_42").ToLocalChecked(),    Nan::GetFunction(New<FunctionTemplate>(get_42)).ToLocalChecked());
  Nan::Set(target, New("float_multiply_plus2").ToLocalChecked(),    Nan::GetFunction(New<FunctionTemplate>(float_multiply_plus2)).ToLocalChecked());
  Nan::Set(target, New("double_multiply_plus2").ToLocalChecked(),    Nan::GetFunction(New<FunctionTemplate>(double_multiply_plus2)).ToLocalChecked());
}


NODE_MODULE(addon, InitAll)
