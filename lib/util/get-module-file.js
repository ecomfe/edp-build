
/**
 * 获取module文件路径
 * 
 * @param {string} moduleId module id
 * @param {string} moduleConfigFile module配置文件路径
 * @return {string}
 */
module.exports = exports = function ( moduleId, moduleConfigFile ) {
    var path = require( './path' );
    var isRelativePath = require( './is-relative-path' );
    var moduleConfig = require( './read-json-file' )( moduleConfigFile );
    var basePath = path.dirname( moduleConfigFile );

    // try match packages
    var packages = moduleConfig.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];
        var pkgName = pkg.name;

        if ( moduleId.split( '/' )[0] === pkgName ) {
            if ( moduleId === pkgName ) {
                moduleId += '/' + (pkg.main || 'main');
            }

            var pkgPath = pkg.location;
            if ( !isRelativePath( pkgPath ) ) {
                return null;
            }

            return path.resolve( 
                basePath,
                pkgPath,
                moduleId.replace( pkgName, '.' )
            ) + '.js';
        }
    }

    // try match paths
    var pathKeys = Object.keys( moduleConfig.paths || {} ).slice( 0 );
    pathKeys.sort( function ( a, b ) { return b.length - a.length; } );
    for ( var i = 0; i < pathKeys.length; i++ ) {
        var key = pathKeys[ i ];

        if ( moduleId.indexOf( key ) === 0 ) {
            var modulePath = moduleConfig.paths[ key ];
            if ( !isRelativePath( modulePath ) ) {
                return null;
            }

            return path.resolve( 
                basePath,
                modulePath,
                moduleId.replace( key, '.' )
            ) + '.js';
        }
    }

    return path.resolve( 
        basePath,
        moduleConfig.baseUrl,
        moduleId
    ) + '.js';
};
