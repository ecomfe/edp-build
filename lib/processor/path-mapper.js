/**
 * @file 路径映射的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');

var edp = require('edp-core');

var AbstractProcessor = require('./abstract');
var helper = require('./helper');

/**
 * 路径映射的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function PathMapper(options) {
    AbstractProcessor.call(this, options);

    if (typeof this.mapper !== 'function') {
        var to = this.to;
        var from = new RegExp('(^|/)' + this.from + '(/|$)');
        this.mapper = function (value) {
            return value.replace(from, function (match, head, tail) {
                return (head === '/' ? head : '') + to + (tail === '/' ? tail : '');
            });
        };
    }

    var mapper = this.mapper;

    /**
     * 值替换函数
     *
     * @param {string} value 原始值
     * @return {string}
     */
    this.valueReplacer = function (value) {
        if (!value) {
            return '';
        }

        if (!edp.path.isLocalPath(value)) {
            return value;
        }

        return mapper(value);
    };
}
util.inherits(PathMapper, AbstractProcessor);

var K_PAGE_FILES = ['*.html', '*.htm', '*.phtml', '*.tpl', '*.vm'];

PathMapper.DEFAULT_OPTIONS = {
    name: 'PathMapper',
    files: ['**/*'],
    replacements: [
        {type: 'html', tag: 'link', attribute: 'href', files: K_PAGE_FILES},
        {type: 'html', tag: 'img', attribute: 'src', files: K_PAGE_FILES},
        {type: 'html', tag: 'script', attribute: 'src', files: K_PAGE_FILES},
        {type: 'html', tag: 'a', attribute: 'href', files: K_PAGE_FILES},
        {type: 'html', tag: 'embed', attribute: 'src', files: K_PAGE_FILES},
        {type: 'html', tag: 'param', attribute: 'value', files: K_PAGE_FILES,
            condition: function (tagSource) {
                return /\sname=['"]movie['"]/.test(tagSource);
            }
        },
        {replacer: 'module-config', files: K_PAGE_FILES.slice(0).concat(['*.js'])},
        {replacer: 'inline-css', files: K_PAGE_FILES},
        {replacer: 'css', files: ['*.css', '*.less']}
    ],
    from: 'src',
    to: 'asset'
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
PathMapper.prototype.process = function (file, processContext, callback) {
    var valueReplacer = this.valueReplacer;
    // 替换文件路径
    if (file.outputPath) {
        file.outputPath = valueReplacer(file.outputPath);
        file.outputPaths = file.outputPaths.map(function (outputPath) {
            return valueReplacer(outputPath);
        });
    }
    callback();
};

PathMapper.prototype.afterAll = function (processContext) {
    var builtinReplacers = this.replacers;
    var valueReplacer = this.valueReplacer;

    // 替换对象进行处理，替换文件内容
    // replacement替换有两种模式：
    // 1. 指定了type，使用固定逻辑替换
    // 2. 指定replacer，使用内置的replacer函数替换
    //
    // 2的灵活性更强。
    //
    // 1现在仅支持html tag的attribute替换
    // 2现在仅支持`module-config`替换
    // 1和2现在都是内置逻辑，原因是希望build配置是纯json。未来可能开放。
    this.replacements.forEach(
        function (replacement) {
            var files = replacement.files;
            if (!files) {
                var extnames = replacement.extnames;
                if (extnames) {
                    files = helper.ext2files(extnames);
                }
            }

            var replaceFiles = processContext.getFilesByPatterns(files);
            replaceFiles.forEach(function (file) {
                var data = file.data;
                var type = replacement.type;
                var replacer = replacement.replacer;

                if (replacer) {
                    data = builtinReplacers[replacer](
                        valueReplacer, data, file);
                }
                else {
                    if (type === 'html') {
                        data = require('../util/replace-tag-attribute')(
                            data,
                            replacement.tag,
                            replacement.attribute,
                            valueReplacer,
                            replacement.condition
                       );
                    }
                }

                file.setData(data);
            });
        }
   );

};

/**
 * 内置的替换方法
 *
 * @namespace
 */
PathMapper.prototype.replacers = {
    /**
     * 替换css中引用的资源路径.
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'css': function (valueReplacer, data, file) {
        var pattern = /\burl\s*\((["']?)([^\)]+)\1\)/g;
        return data.replace(pattern, function (match, startQuote, url) {
            var newUrl = valueReplacer(url);
            if (edp.path.isLocalPath(newUrl)) {
                // 把路径归一化一下，例如
                // ././../../ui/img/../img/logo.gif => ../../ui/img/logo.gif
                newUrl = edp.path.normalize(newUrl);
            }
            return require('util').format('url(%s%s%s)',
                startQuote, newUrl, startQuote);
        });
    },

    /**
     * 替换html代码中内联的css中的资源路径.
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'inline-css': function (valueReplacer, data, file) {
        var chunks = data.split(/(<\/?style[^>]*>)/i);
        for (var i = 0, l = chunks.length; i < l; i++) {
            if (/^<style\s+/i.test(chunks[i]) && (i + 1) < l) {
                // 如果遇到了'<style '开头的内容，说明下面的部分是样式的代码了
                chunks[i + 1] = PathMapper.prototype.replacers.css(
                    valueReplacer, chunks[i + 1], file);
            }
        }

        return chunks.join('');
    },

    /**
     * 模块配置路径替换
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'module-config': function (valueReplacer, data, file) {
        var readLoaderConfig = require('../util/read-loader-config');
        var confInfo = readLoaderConfig(data);
        if (!confInfo) {
            return data;
        }

        var confData = confInfo.data;

        if (confData.baseUrl) {
            confData.baseUrl = valueReplacer(confData.baseUrl);
        }

        var paths = confData.paths || {};
        /*eslint-disable*/
        for (var key in paths) {
            paths[key] = valueReplacer(paths[key]);
        }
        /*eslint-enable*/

        var packages = confData.packages || [];
        for (var i = 0; i < packages.length; i++) {
            var pkg = packages[i];
            if (typeof pkg === 'object' && pkg.location) {
                pkg.location = valueReplacer(pkg.location);
            }
        }

        var replaceLoaderConfig = require('../util/replace-loader-config');
        return replaceLoaderConfig(confData, confInfo);
    }
};

module.exports = exports = PathMapper;
