var fse = require('fs-extra');
var path = require('path');

fse.removeSync("build");
fse.removeSync("target");
fse.removeSync("Cargo.lock");
fse.removeSync("node_modules");
fse.removeSync(path.join("src", "addon.cc"));
