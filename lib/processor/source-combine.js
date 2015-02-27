var edp = require('edp-core');
var path = require('path');
var AbstractProcessor = require('./abstract');

/**
 * Output内容的清理处理器
 *
 * @constructor
 * @param {Object} options
 */
function SourceProcessor(options) {
    options = edp.util.mix({
        files: ['*.html']
    }, options);
    AbstractProcessor.call(this, options);
}
SourceProcessor.prototype = new AbstractProcessor();

/**
 * @type {string}
 */
SourceProcessor.prototype.name = 'SourceProcessor';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
SourceProcessor.prototype.process = function(file, processContext, callback) {
    var data = file.data;
    var reg = /\<(link|script|include).*?data\-combined(=[\"\'](.*?)[\"\'])?.*?\>.*?(\<\/(script|include)>)?/g;
    var srcReg = /(src|href)=[\"\'](.*?)[\"\']/i;

    var replaceMap = {
        'script': '<script type="text/javascript">{::}</script>',
        'link': '<style type="text/css">{::}</style>'
    };

    // 获取资源
    function getContent(type, src) {
        var result;
        var mapRec = processContext.files || {};

        if (mapRec[src]) {
            result = mapRec[src];
        } else {
            for (var k in mapRec) {
                var item = mapRec[k];
                if (src == item.outputPath || src == item.path) {
                    result = item;
                    break;
                }
            }
        }

        if (result) {
            if (replaceMap[type]) {
                return replaceMap[type].replace('{::}', result.data);
            } else {
                return result.data;
            }
        }
    }

    data = data.replace(reg, function(match, type, _, src) {
        if (!src || /^(on|true|yes)$/i.test(src)) {
            src = srcReg.exec(match)[2];
        }
        return getContent(type, src);
    });
    file.setData(data);
    callback();
};

module.exports = exports = SourceProcessor;