#![feature(const_fn)]
extern crate libc;

use libc::c_int;


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
