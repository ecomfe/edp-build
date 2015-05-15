/**
 * @file 静态文件MD5重命名处理器
 * @author errorrik[errorrik@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var util = require('util');

var edp = require('edp-core');

var AbstractProcessor = require('./abstract');
var helper = require('../helper');

var kDefaultHtmlTags = [
    {tag: 'link', attribute: 'href'},
    {tag: 'img', attribute: 'src'},
    {tag: 'script', attribute: 'src'},
    {tag: 'embed', attribute: 'src'},
    {
        tag: 'param',
        attribute: 'value',
        condition: function (tagSource) {
            return /\sname=['"]movie['"]/.test(tagSource);
        }
    }
];

/**
 * 静态文件MD5重命名处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function MD5Renamer(options) {
    AbstractProcessor.call(this, this._prepare(options || {}));
}
util.inherits(MD5Renamer, AbstractProcessor);

MD5Renamer.DEFAULT_OPTIONS = {
    name: 'MD5Renamer',

    /**
      * 默认不处理任何文件，除非显示的声明
      * @param {Array.<string>}
      */
    files: [],

    /**
     * md5的开始位置
     * @type {number}
     */
    s: 0,

    /**
     * md5的结束位置
     * @type {number}
     */
    e: 8,

    /**
     * @see https://github.com/ecomfe/edp/issues/261
     * 为了处理项目代码中一些特殊的路径，例如：
     * <link rel="stylesheet" href="{%$tplData.feRoot%}/asset/some/item/css/index.css">
     * <script src="{%$tplData.feRoot%}/asset/some/item/js/index.js"></script>
     *
     * @param {string} lookupPath 引用资源那个文件所在的目录，相对路径，相对于ProcessContext.baseDir
     * @param {string} resPath    资源的路径
     * @return {string|undefined} 如果返回string，则认为已经自己处理过了，否则继续走原来的逻辑，如果返回false，
     * 则不处理，跳过.
     */
    resolve: function (lookupPath, resPath) {
        return undefined;
    },

    /**
     * 用来描述替换的规则
     * @type {{html:Array.<string>,css:Array.<string>}}
     */
    replacements: {
        // 处理url(...)
        css: {
            files: ['*.styl', '*.css', '*.less']
        },
        // 处理require.toUrl()
        js: {
            files: ['*.js']
        },
        // 处理tags里面的定义
        html: {
            tags: kDefaultHtmlTags,
            files: ['*.html', '*.htm', '*.phtml', '*.tpl', '*.vm']
        }
    },

    /**
     * 输出文件名的默认模板，支持
     * {basename} {md5sum} {extname}
     * @type {string}
     */
    outputTemplate: '{basename}-{md5sum}{extname}'
};

MD5Renamer.prototype._prepare = function (options) {
    // start已经被占用了，所以兼容一下历史问题
    // 如果定义了start，改成s
    if (options.hasOwnProperty('start')) {
        options.s = options.start;
        delete options.start;
    }

    // 因为start改成s了，所有把end改成e
    if (options.hasOwnProperty('end')) {
        options.e = options.end;
        delete options.end;
    }

    // 如果自定义了replacements，但是没有设置files，我们就去
    // 设置一下files，这样子可以通过replacements来更精确的控制
    // 需要处理哪些类型元素的替换，例如我只想替换html中的图片，css和js保留
    // 则可以通过设置
    // replacements: {
    //   html: {
    //     tags: [
    //       { tag: 'img', attribute: 'src' }
    //    ],
    //     files: ['main.html']
    //   }
    // }
    if (options.hasOwnProperty('replacements') && !options.files) {
        var files = [];
        for (var type in options.replacements) {
            if (!options.replacements.hasOwnProperty(type)) {
                continue;
            }

            var replacement = options.replacements[type];
            if (Array.isArray(replacement.files)) {
                files.push.apply(files, replacement.files);
            }
        }
        options.files = files;
    }

    return options;
};

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
MD5Renamer.prototype.process = function (file, processContext, callback) {
    function satisfy(pattern) {
        return helper.satisfy(file.path, pattern);
    }

    for (var type in this.replacements) {
        if (!this.replacements.hasOwnProperty(type)) {
            continue;
        }

        var replacement = this.replacements[type];
        if (Array.isArray(replacement)) {
            replacement = {
                files: replacement
            };
        }

        var match = replacement.files.some(satisfy);
        if (match) {
            if (type === 'html') {
                if (!replacement.tags) {
                    replacement.tags = kDefaultHtmlTags;
                }
                processHTMLReplace(file, replacement, this, processContext);
            }
            else if (type === 'css') {
                processCSSReplace(file, replacement, this, processContext);
            }
            break;
        }
    }

    callback();
};

/**
 * 资源路径替换函数
 *
 * @inner
 * @param {string} value 资源路径的值
 * @param {Object} replaceOption 替换参数
 * @param {MD5Renamer} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {FileInfo} file 需要替换的文件对象.
 * @return {string}
 */
function replaceResPath(value, replaceOption, processor, processContext, file) {
    if (!edp.path.isLocalPath(value)) {
        // 代码中的绝对路径不做替换
        return value;
    }

    var search = '';
    var hash = '';
    var resPath = value;

    // 计算hash
    var hashIndex = value.indexOf('#');
    if (hashIndex !== -1) {
        hash = resPath.slice(hashIndex);
        resPath = resPath.slice(0, hashIndex);
    }

    // 计算search
    var searchIndex = resPath.indexOf('?');
    if (searchIndex > 0) {
        search = resPath.slice(searchIndex);
        resPath = resPath.slice(0, searchIndex);
    }

    var lookupPaths = replaceOption.paths;
    for (var i = 0; i < lookupPaths.length; i++) {
        var lookupPath = lookupPaths[i];
        var lookupFile = processor.resolve(lookupPath, resPath);
        if (false === lookupFile) {
            return value;
        }
        lookupFile = (lookupFile || edp.path.join(lookupPath, resPath)).trim();

        // 如果这个资源文件在edp-build-config.js里面被exclude了，那么就没的玩儿了
        var lookupFileInfo = processContext.getFileByPath(lookupFile);

        if (lookupFileInfo) {
            var md5path = replacePathByMD5(resPath,
                lookupFileInfo.md5sum(processor.s, processor.e),
                processor.outputTemplate);

            if (!lookupFileInfo.get('md5renamed')) {
                lookupFileInfo.outputPaths.push(
                    edp.path.join(
                        edp.path.dirname(lookupFileInfo.outputPath),
                        edp.path.basename(md5path)
                   )
               );
                lookupFileInfo.set('md5renamed', 1);
            }

            return md5path + search + hash;
        }
        edp.log.warn('No such file or directory (%s), base file = (%s)',
            lookupFile, file.path);
    }

    return value;
}

/**
 * 处理HTML中的资源路径替换
 *
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {Object} replacement 替换规则的配置信息.
 * @param {MD5Renamer} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 */
function processHTMLReplace(file, replacement, processor, processContext) {
    var replaceOption = {
        paths: [edp.path.dirname(file.path)]
    };
    var replacer = function (value) {
        return replaceResPath(value, replaceOption,
            processor, processContext, file);
    };

    replacement.tags.forEach(
        function (replace) {
            var replaceTagAttribute = require('../util/replace-tag-attribute');

            var data = replaceTagAttribute(
                file.data,
                replace.tag,
                replace.attribute,
                replacer,
                replace.condition
            );

            file.setData(data);
        }
   );
}


/**
 * 处理CSS中的资源路径替换
 *
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {Object} replacement 替换规则的配置信息.
 * @param {MD5Renamer} processor MD5Renamer处理器对象
 * @param {ProcessContext} processContext 构建环境对象
 */
function processCSSReplace(file, replacement, processor, processContext) {
    var replaceOption = {
        paths: [edp.path.dirname(file.path)]
    };
    var data = file.data.replace(
        /url\s*\(\s*(['"]?)([^\)]+)\1\s*\)/g,
        function (match, quote, url) {
            url = quote
                + replaceResPath(url, replaceOption, processor, processContext, file)
                + quote;

            return 'url(' + url + ')';
        }
   );
    file.setData(data);
}

/**
 * 替换文件路径里的文件名为md5值
 *
 * @inner
 * @param {string} filePath 文件路径.
 * @param {string} md5 md5值.
 * @param {string} template 文件名的模板.
 * @return {string}
 */
function replacePathByMD5(filePath, md5, template) {
    var extname = edp.path.extname(filePath);
    var original = edp.path.basename(filePath, extname);
    var dataMap = {
        basename: original,
        extname: extname,
        md5sum: md5
    };
    var file = template.replace(/{([^}]+)}/g, function (m, $1) {
        return dataMap[$1] || m;
    });

    return edp.path.join(edp.path.dirname(filePath), file);
}

module.exports = exports = MD5Renamer;
