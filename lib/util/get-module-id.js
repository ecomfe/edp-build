

/**
 * 获取module id
 * 
 * @param {string} moduleFile module文件路径
 * @param {string} moduleConfigFile module配置文件路径
 * @return {string}
 */
module.exports = exports = function ( moduleFile, moduleConfigFile ) {
    var path = require( './path' );
    var isRelativePath = require( './is-relative-path' );

    moduleFile = moduleFile.replace( /\.js$/, '' );
    var relativePath = path.relative( 
        path.dirname( moduleConfigFile ), 
        moduleFile
    );
    var moduleConfig = require( './read-json-file' )( moduleConfigFile );
    var baseUrl = moduleConfig.baseUrl + '/';

    // try match packages
    var packages = moduleConfig.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';
        var pkgLoc = pkg.location;

        if ( !isRelativePath( pkgLoc ) ) {
            continue;
        }

        if ( relativePath.indexOf( pkgLoc + '/' ) === 0 ) {
            if ( relativePath === pkgLoc + '/' + pkgMain ) {
                return pkgName;
            }

            return pkgName + relativePath.replace( pkgLoc, '' );
        }
    }

    // try match paths
    var pathKeys = Object.keys( moduleConfig.paths || {} ).slice( 0 );
    pathKeys.sort( function ( a, b ) { return b.length - a.length; } );
    for ( var i = 0; i < pathKeys.length; i++ ) {
        var key = pathKeys[ i ];
        var modulePath = moduleConfig.paths[ key ];

        if ( !isRelativePath( modulePath ) ) {
            continue;
        }

        if ( (new RegExp('^' + modulePath + '(/|$)')).test( relativePath ) ) {
            return relativePath.replace( modulePath, key );
        }
    }

    // try match baseUrl
    if ( relativePath.indexOf( baseUrl ) === 0 ) {
        return relativePath.replace( baseUrl, '' );
    }

    return null;
};
