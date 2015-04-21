exports.input = __dirname;

var path = require( 'path' );
exports.output = path.resolve( __dirname, 'output' );

exports.getProcessors = function () {
    var mp = new ModuleCompiler({
        files: [
            '*.js'
        ]
    });
    var jp = new JsCompressor({
        sourceMapOptions: {
            enable: false,
            host: 'http://192.168.199.239:9999/output/',
            root: 'this/is/the/fucking/sourcemap/directory',
        }
    });

    return {
        'default': [mp, jp]
    };
};

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

