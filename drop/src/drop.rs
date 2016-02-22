extern crate libc;

use std::mem;
use libc::c_void;

#[no_mangle]
pub extern "C" fn rs_drop(ptr: *const c_void) {
  mem::drop(ptr);
}
