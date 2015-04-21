/**
 * @file Stylus编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         junmer[junmer@foxmail.com]
 *         leeight[leeiht@gmail.com]
 */
var util = require('util');
var path = require('path');

var u = require('underscore');
var stylus = require('stylus');
var edp = require('edp-core');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * Stylus编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function StylusCompiler(options) {
    AbstractProcessor.call(this, options);
    // 兼容一下老的配置规则 entryExtnames
    this.entryFiles = this.entryFiles || helper.ext2files(this.entryExtnames);
}
util.inherits(StylusCompiler, AbstractProcessor);

StylusCompiler.DEFAULT_OPTIONS = {
    name: 'StylusCompiler',
    entryFiles: [
        '*.html', '*.htm', '*.phtml',
        '*.tpl', '*.vm', '*.js'
    ],
    files: ['*.styl'],
    compileOptions: {}
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
StylusCompiler.prototype.process = function (file, processContext, callback) {
    var compileOptions = this.compileOptions || {};
    var options = u.extend({
        paths: [path.dirname(file.fullPath)],
        pathname: file.fullPath,
        use: compileOptions
    }, compileOptions);

    try {
        helper.compileStylus(this.stylus || stylus, file.data, options)
            .then(function (css) {
                file.setData(css);
                file.outputPath = file.outputPath.replace(/\.styl$/, '.css');
                processContext.addFileLink(file.path, file.outputPath);
            })
            .fail(function (err) {
                edp.log.fatal('Compile stylus failed, file = [%s], msg = [%s]',
                    file.path, err.toString());
                file.outputPath = null;
            })
            .fin(callback);
    }
    catch (ex) {
        edp.log.fatal('Compile stylus failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
        file.outputPath = null;
        callback();
    }
};

/**
 * 构建处理后的行为，替换page和js里对stylus资源的引用
 *
 * @param {ProcessContext} processContext 构建环境对象
 */
StylusCompiler.prototype.afterAll = function (processContext) {
    var entryFiles = processContext.getFilesByPatterns(this.entryFiles);
    if (!Array.isArray(entryFiles)) {
        return;
    }

    entryFiles.forEach(function (file) {
        var result = (file.extname === 'js')
                     ? helper.replaceRequireResource(file.data, 'css', resourceReplacer)
                     : helper.replaceTagAttribute(file.data, 'link', 'href', valueReplacer);

        if (result) {
            file.setData(result);
        }
    });
};

function resourceReplacer(resourceId) {
    return resourceId.replace(/\.styl$/, '.css');
}

function valueReplacer(value) {
    return value.replace(/\.styl($|\?)/, function (match, q) {
        if (q === '?') {
            return '.css?';
        }

        return '.css';
    });
}


module.exports = exports = StylusCompiler;
