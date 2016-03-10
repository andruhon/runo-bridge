#![feature(const_fn)]
extern crate libc;

use libc::{c_char,c_int,c_float,c_double};
use std::ffi::{CStr,CString};
use std::mem;


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
pub extern "C" fn rs_experimental_string(s_raw: *const c_char) -> *mut c_char {
    // take string from the input C string
    if s_raw.is_null() { panic!(); }

    let c_str: &CStr = unsafe { CStr::from_ptr(s_raw) };
    let buf: &[u8] = c_str.to_bytes();
    let str_slice: &str = std::str::from_utf8(buf).unwrap();
    let str_buf: String = str_slice.to_owned();

    //produce a new string
    let result = String::from(str_buf + "+ append from Rust");

    //create C string for output
    let c_string = CString::new(result).unwrap();
    let ret: *mut c_char = unsafe {mem::transmute(c_string.as_ptr())};
    mem::forget(c_string); // To prevent deallocation by Rust
    ret
}

#[no_mangle]
pub extern "C" fn float_multiply_plus2(in1: c_float, in2: c_float) -> c_float{
    in1*in2+(2 as c_float)
}

#[no_mangle]
pub extern "C" fn double_multiply_plus2(in1: c_double, in2: c_double) -> c_double{
    in1*in2+(2 as c_double)
}
