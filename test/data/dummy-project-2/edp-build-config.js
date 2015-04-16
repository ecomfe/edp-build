exports.input = __dirname;

var path = require( 'path' );
exports.output = path.resolve( __dirname, 'output' );

exports.getProcessors = function () {
    var moduleProcessor = new ModuleCompiler({
        files: [
            '*.js'
        ]
    });

    return {
        'default': [ moduleProcessor ]
    };
};

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

