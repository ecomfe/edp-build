/**
 * 在环境对象中加入manifest文件信息对象
 * 
 * @inner
 * {ProcessContext} processContext 构建环境对象
 * {string} data 文件内容
 * {string} fullPath 文件的全路径
 */
var path = require( './path' );
module.exports = exports = function( processContext, data , fullPath ) {
    var relativePath = path.relative( processContext.baseDir, fullPath );
    var extname = path.extname( fullPath ).slice( 1 );
    var FileInfo = require( '../file-info' );
    var fileData = new FileInfo( {
        data         : data,
        extname      : extname,
        path         : relativePath,
        fullPath     : fullPath,
        stat         : {},
        fileEncoding : null
    } );

    processContext.addFile( fileData );

};