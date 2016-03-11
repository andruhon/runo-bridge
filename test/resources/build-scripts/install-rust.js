var fse = require('fs-extra');
var path = require('path');

var rustBuildDir = path.join('target','debug');
var addonBuildDir = path.join('build','Release');

fse.readdirSync(rustBuildDir).forEach(function(file){
    try {
      var f = path.join(rustBuildDir,file);
      if(fse.statSync(f).isFile()) {
        fse.copySync(f, path.join(addonBuildDir,file));
      }
    } catch (e) {
      console.log(e);
    }
});
