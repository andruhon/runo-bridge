#![feature(const_fn)]
extern crate libc;

use libc::{c_int, c_float, c_double};


#[no_mangle]
pub extern "C" fn int_in_int_out(input: c_int) -> c_int{
    input*2
}

#[no_mangle]
pub extern "C" fn is_greather_than_42(input: c_int) -> bool{
    input>42
}

#[no_mangle]
pub extern "C" fn get_42(input: bool) -> c_int{
    if input {
        42
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn float_multiply_plus2(in1: c_float, in2: c_float) -> c_float{
    in1*in2+(2 as c_float)
}

#[no_mangle]
pub extern "C" fn double_multiply_plus2(in1: c_double, in2: c_double) -> c_double{
    in1*in2+(2 as c_double)
}
