extern crate libc;

use libc::c_int;

#[no_mangle]
pub extern "C" fn int_in_int_out(input: c_int) -> c_int{
    input*2
}
