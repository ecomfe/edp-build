/**
 * @file 文本文件变量替换处理器
 * @author errorrik[errorrik@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * 变量替换处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 */
function VariableSubstitution( options ) {
    AbstractProcessor.call( this, options );

    this.variables = this.variables || {};
}

VariableSubstitution.prototype = new AbstractProcessor();

/**
 * 处理器名称
 * 
 * @type {string}
 */
VariableSubstitution.prototype.name = 'VariableSubstitution';


/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
VariableSubstitution.prototype.process = function ( file, processContext, callback ) {
    if ( typeof file.data === 'string' ) {
        var variables = this.variables;
        file.setData(
            file.data.replace(
                /\{edp-variable:(\{?)([0-9a-z_-]+)(\}?)\}/ig,
                function ( match, $1, name, $3 ) {
                    return variables[ name ] || '';
                }
            )
        );
    }

    callback();
};

module.exports = exports = VariableSubstitution;
