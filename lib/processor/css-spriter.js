/**
 * @file css sprite 构建处理器
 * @author quyatong[quyatong@126.com]
 */



var edp = require('edp-core');
var path = require('path');
var fs = require('fs');
var AbstractProcessor = require('./abstract');
var FileInfo = require( '../file-info' );
var cssSpriter = require('css-spriter');

/**
 * css sprite的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssSpriter(options) {
    options = edp.util.mix( {
        files: []
    }, options);

    AbstractProcessor.call(this, options);
}

CssSpriter.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
CssSpriter.prototype.name = 'CssSpriter';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssSpriter.prototype.process = function (file, processContext, callback) {
    var filePath = file.fullPath;
    
    // promise
    cssSpriter.cssDataSpriter(file.data, filePath).then(
        // resolve: 处理css sprite完成，并返回相应的数据
        function (data) {

            var cssData = data.cssData;
            var imgFilePath = data.imgFilePath;

            // 创建图片
            var baseDir = processContext.baseDir;
            var imgFile = new FileInfo({
                data: fs.readFileSync(imgFilePath),
                extname: 'png',
                path: path.relative(baseDir, imgFilePath),
                outputPath: path.relative(baseDir, imgFilePath),
                fullPath: imgFilePath,
                stat: fs.statSync(imgFilePath),
                fileEncoding: null
            });
            
            // 在过程上下文中添加图片文件
            processContext.addFile(imgFile);

            // 删除掉src下的图片文件
            fs.unlinkSync(imgFilePath);

            // 填入CSS文件数据
            file.setData(cssData);
            
        },
        // reject: 不需要处理css sprite
        function () {}
    ).done(
        function () {
            
            // 处理完CSS文件后，执行下一个processer
            callback();
        }
    );
};

module.exports = exports = CssSpriter;
