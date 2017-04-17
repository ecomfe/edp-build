/**
 * @file [Please input file description]
 * @author ()
 */

define(function (require, exports, module) {


    var hello = require('./hello');
    var world = require('./world');

    /**
     * [Please input module description]
     */
    function init() {
        return hello() + world();
    }

    return init;
});
