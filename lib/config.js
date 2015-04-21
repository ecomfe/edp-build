/**
 * @file build默认配置
 * @author errorrik[errorrik@gmail.com]
 */

var cwd = process.cwd();
var path = require('path');

/**
 * 输入目录
 *
 * @type {string}
 */
exports.input = cwd;

/**
 * 输出目录
 *
 * @type {string}
 */
exports.output = path.resolve(cwd, 'output');

/**
 * 排除文件pattern列表
 *
 * @type {Array}
 */
exports.exclude = [
    'tool',
    'doc',
    'test',
    'module.conf',
    'node_modules/**',
    'dep/packages.manifest',
    'dep/*/*/test',
    'dep/*/*/doc',
    'dep/*/*/demo',
    'dep/*/*/tool',
    'dep/*/*/*.md',
    'dep/*/*/package.json',
    'edp-*',
    '.edpproj',
    '.svn',
    '.git',
    '.gitignore',
    '.idea',
    '.project',
    'Desktop.ini',
    'Thumbs.db',
    '.DS_Store',
    '*.tmp',
    '*.bak',
    '*.swp'
];


var moduleEntries = 'html,htm,phtml,tpl,vm,js';
var pageEntries = 'html,htm,phtml,tpl,vm';

/**
 * 获取构建processors的方法
 *
 * @return {Array}
 */
exports.getProcessors = function () {
    /* global LessCompiler, ModuleCompiler, PathMapper */
    return [
        new LessCompiler(),
        // new CssCompressor(),
        new ModuleCompiler(),
        // new JsCompressor({
        //     compressOptions: {
        //         warnings: false
        //     },
        //     sourceMapOptions: {
        //         enable: true
        //     }
        // }),
        new PathMapper()
    ];
};

exports.pageEntries = pageEntries;
exports.moduleEntries = moduleEntries;

/**
 * builder主模块注入processor构造器的方法
 *
 * @param {Object} processors The built-in processors
 */
exports.injectProcessor = function (processors) {
    for (var key in processors) {
        global[key] = processors[key];
    }
};

