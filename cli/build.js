/**
 * @file edp-build default command
 * @author treelite(c.xinle@gmail.com)
 */

var log = require('edp-core').log;

/**
 * 命令行配置相
 *
 * @inner
 * @type {Object}
 */
var cli = {};

/**
 * 命令选项信息
 *
 * @type {Array}
 */
cli.options = [
    'output:',
    'exclude:',
    'config:',
    'force'
];

/**
 * 命令入口
 *
 * @param {Array} args 命令运行参数
 * @param {Object} opts 命令运行选项
 */
cli.main = function (args, opts) {
    log.info('hello edp-build');
};

// 导出命令
exports.cli = cli;
