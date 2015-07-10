/**
 * @file LESS编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');

var u = require('underscore');
var edp = require('edp-core');
var less = require('less');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * LESS编译的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function LessCompiler(options) {
    AbstractProcessor.call(this, options);
    // 兼容一下老的配置规则 entryExtnames
    this.entryFiles = this.entryFiles || helper.ext2files(this.entryExtnames);
}
util.inherits(LessCompiler, AbstractProcessor);

/**
 * @type {Object}
 * @const
 */
LessCompiler.DEFAULT_OPTIONS = {
    name: 'LessCompiler',

    // 兼容入口老配置`entryExtnames`
    // 建议使用`entryFiles`
    entryExtnames: null,

    // 默认的入口文件配置
    entryFiles: [
        '*.html', '*.htm', '*.phtml',
        '*.tpl', '*.vm', '*.js'
    ],

    files: ['*.less'],

    // 可以配置 paths 等参数
    compileOptions: {},

    // 自定义的 less 处理器
    less: null
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
LessCompiler.prototype.process = function (file, processContext, callback) {
    var paths = [];
    paths.push(edp.path.dirname(file.fullPath));
    paths.push(edp.path.join(process.cwd(), 'dep'));

    var options = u.extend({
        relativeUrls: true,
        compress: true,
        paths: paths,
        filename: file.fullPath
    }, this.compileOptions);

    try {
        // this.less说明是从外部传递过来的，如果不存在，就用默认的
        helper.compileLess(this.less || less, file.data, options)
            .then(function (css) {
                file.setData(css);
                file.outputPath = file.outputPath.replace(/\.less$/, '.css');
                processContext.addFileLink(file.path, file.outputPath);
            })
            .fail(function (err) {
                edp.log.warn('Compile less failed, file = [%s], msg = [%s]',
                    file.path, err.toString());
                file.outputPath = null;
            })
            .fin(callback);
    }
    catch (ex) {
        edp.log.fatal('Compile less failed, file = [%s], msg = [%s]',
            file.path, ex.toString());
        file.outputPath = null;
        callback();
    }
};

/**
 * 构建处理后的行为，替换page和js里对less资源的引用
 *
 * @param {ProcessContext} processContext 构建环境对象
 */
LessCompiler.prototype.afterAll = function (processContext) {
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
    return resourceId.replace(/\.less$/, '.css');
}

function valueReplacer(value) {
    return value.replace(/\.less($|\?)/, function (match, q) {
        if (q === '?') {
            return '.css?';
        }

        return '.css';
    });
}


module.exports = exports = LessCompiler;
