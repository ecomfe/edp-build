var edp = require( 'edp-core' );

/**
 * 获取module id
 * 
 * @param {string} moduleFile module文件路径
 * @param {string} moduleConfigFile module配置文件路径
 * @return {Array}
 */
module.exports = exports = function ( moduleFile, moduleConfigFile ) {
    moduleFile = moduleFile.replace( /\.js$/, '' );
    var relativePath = edp.path.relative( 
        edp.path.dirname( moduleConfigFile ), 
        moduleFile
    );
    var moduleConfig = require( './read-json-file' )( moduleConfigFile );
    var baseUrl = moduleConfig.baseUrl + '/';
    
    var resultModules = [];
    var resultModulesMap = {};
    function addModule( moduleId ) {
        if ( !resultModulesMap[ moduleId ] ) {
            resultModulesMap[ moduleId ] = 1;
            resultModules.push( moduleId );
        }
    }

    // try match packages
    var packages = moduleConfig.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';
        var pkgLoc = pkg.location;

        if ( !edp.path.isRelativePath( pkgLoc ) ) {
            continue;
        }

        if ( relativePath.indexOf( pkgLoc + '/' ) === 0 ) {
            if ( relativePath === pkgLoc + '/' + pkgMain ) {
                addModule( pkgName );
            }
            else {
                addModule( pkgName + relativePath.replace( pkgLoc, '' ) );
            }
        }
    }

    // try match paths
    var paths = moduleConfig.paths || {};
    var pathKeys = Object.keys( paths ).slice( 0 );
    pathKeys.sort( function ( a, b ) { return paths[b].length - paths[a].length; } );
    for ( var i = 0; i < pathKeys.length; i++ ) {
        var key = pathKeys[ i ];
        var modulePath = paths[ key ];

        if ( !edp.path.isRelativePath( modulePath ) ) {
            continue;
        }

        if ( (new RegExp('^' + modulePath + '(/|$)')).test( relativePath ) ) {
            addModule( relativePath.replace( modulePath, key ) );
        }
    }

    // try match baseUrl
    if ( relativePath.indexOf( baseUrl ) === 0 ) {
        addModule( relativePath.replace( baseUrl, '' ) );
    }

    return resultModules;
};
