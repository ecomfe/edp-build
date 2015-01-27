/**
 * @file edp-build default command
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
 */

var edp = require('edp-core');
var fs = require('fs');

var log = edp.log;
var path = edp.path;
var util = edp.util;

/**
 * 默认构建配置文件
 * 
 * @inner
 * @const
 * @type {string}
 */
var DEFAULT_BUILD_CONF = 'edp-build-config.js';

/**
 * 加载配置文件
 * 
 * @inner
 * @param {string=} confFile 配置文件路径
 * @param {string=} baseDir 自动查找配置文件的基础路径
 * @return {Object}
 */
function loadConf(confFile, baseDir) {
    var cwd = process.cwd();

    if (confFile) {
        confFile = path.resolve(cwd, confFile);
        if (fs.existsSync(confFile)) {
            return require(confFile);
        }

        return null;
    }

    var dir;
    var parentDir = baseDir || cwd;
    do {
        dir = parentDir;
        confFile = path.resolve(dir, DEFAULT_BUILD_CONF);
        if (fs.existsSync(confFile)) {
            return require(confFile);
        }

        parentDir = path.resolve(dir, '..');
    } while (parentDir !== dir);

    return require('../lib/config');
}

/**
 * 命令行配置相
 *
 * @inner
 * @type {Object}
 */
var cli = {};

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '构建目录或项目';

/**
 * 命令选项信息
 *
 * @type {Array}
 */
cli.options = [
    'output:',
    'exclude:',

    // 自定义的edp-build-config.js文件
    'config:',

    // edp build --stage=dev 用来选择getProcessors()中dev指定的Processors的组合
    'stage:',

    // 删除output目录
    'force'
];

/**
 * 命令入口
 *
 * @param {Array} args 命令运行参数
 * @param {Object} opts 命令运行选项
 */
cli.main = function (args, opts) {
    var inputDir = args[0];
    var outputDir = opts.output;

    // 装载构建配置模块
    var conf = loadConf(opts.config, inputDir);
    if (!conf) {
        log.error('Build Config cannot found!');
        process.exit(1);
    }

    // 处理构建的输入和输出目录
    if (inputDir) {
        conf.input = path.resolve(process.cwd(), inputDir);
        conf.output = path.resolve(inputDir, 'output');
    }
    outputDir && (conf.output = path.resolve(process.cwd(), outputDir));
    outputDir = conf.output;
    inputDir = conf.input;

    // 当输出目录存在时：
    // 1. 默认直接抛出异常，防止项目构建输出影响和覆盖原有文件
    // 2. 如果设置了force参数，强制删除当前存在的目录
    if (fs.existsSync(outputDir)) {
        if (opts.force) {
            util.rmdir(outputDir);
        }
        else {
            log.error(outputDir + ' directory already exists!');
            process.exit(1);
            return;
        }
    }

    // 解析exclude参数
    var exclude = conf.exclude || [];
    if (opts.exclude) {
        exclude = conf.exclude = opts.exclude
            .replace(/(^\s+|\s+$)/g, '')
            .split(/\s*,\s*/);
    }

    // 如果output目录处于baseDir下，自动将output目录添加到exclude
    var outputRelative = path.relative(inputDir, outputDir);
    if (!/^\.\./.test(outputRelative)) {
        exclude.push(outputRelative);
    }

    // Processors的组合
    conf.stage = opts.stage || 'default';

    if (typeof conf.init === 'function') {
        conf.init(conf, function(config) {
            require('../index')(config || conf);
        });
    }
    else {
        require('../index')(conf);
    }
};

// 导出命令
exports.cli = cli;
