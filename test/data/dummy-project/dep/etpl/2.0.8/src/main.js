/**
 * ETPL (Enterprise Template)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 模板引擎
 * @author errorrik(errorrik@gmail.com)
 *         otakustay(otakustay@gmail.com)
 */

// 有的正则比较长，所以特别放开一些限制
/* jshint maxdepth: 10, unused: false, white: false */

// HACK: 可见的重复代码未抽取成function和var是为了gzip size，吐槽的一边去

(function (root) {
    function Engine(){};

    var etpl = new Engine();
    etpl.Engine = Engine;

    if ( typeof exports == 'object' && typeof module == 'object' ) {
        // For CommonJS
        exports = module.exports = etpl;
    }
    else if ( typeof define == 'function' && define.amd ) {
        // For AMD
        define( etpl );
    }
    else {
        // For <script src="..."
        root.etpl = etpl;
    }
})(this);
