/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * output-cleaner.js ~ 2014/04/08 15:12:45
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 最终输出到output目录里面的东东，例如*.less, *.ts等等需要删除
 **/
var edp = require( 'edp-core' );
var AbstractProcessor = require( './abstract' );

/**
 * Output内容的清理处理器
 *
 * @constructor
 * @param {Object} options
 */
function OutputCleaner( options ){
    options = edp.util.mix( {
        files: [ '*.less', '*.styl', '*.ts', '*.coffee' ]
    }, options );
    AbstractProcessor.call( this, options );
}
OutputCleaner.prototype = new AbstractProcessor();

/**
 * @type {string}
 */
OutputCleaner.prototype.name = 'OutputCleaner';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
OutputCleaner.prototype.process = function ( file, processContext, callback ) {
    if ( edp.glob.match( file.outputPath, this.files ) ) {
        processContext.removeFile( file.path );
    }
    callback();
};

module.exports = exports = OutputCleaner;
















/* vim: set ts=4 sw=4 sts=4 tw=100: */
