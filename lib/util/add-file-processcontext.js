/**
 * 在环境对象中加入文件信息对象
 * 
 * @inner
 * {ProcessContext} processContext 构建环境对象
 * {string} fullPath 文件的全路径
 * {string} data 文件内容
 */
module.exports = exports = function( processContext, fullPath, data ) {
    var path = require( './path' );
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