/* jshint esnext: true, strict: true, undef: true */
/* globals FS */

function is_dir(v) {
  "use strict";
  try {
    return FS.lstatSync(v).isDirectory();
  } catch (e) {
    return false;
  }
}
