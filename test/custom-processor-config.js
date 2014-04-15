var path = require('path');

exports.input = path.resolve(__dirname, 'data/js-compressor');
exports.output = path.resolve(__dirname, 'data/js-compressor/_output');

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

exports.getProcessors = function () {
    var ClearOutputer = defineClearOutputer();
    return [ new ClearOutputer() ];
};

function defineClearOutputer() {
    function ClearOutputer( options ) { AbstractProcessor.call(this, options)}
    ClearOutputer.prototype = new AbstractProcessor;
    ClearOutputer.prototype.name = "ClearOutputer";
    ClearOutputer.prototype.process = function (file, context, callback) {
        if (file.path.indexOf('default') >= 0) {
            file.outputPath = '';
        }
        callback();
    };

    return ClearOutputer;
}
