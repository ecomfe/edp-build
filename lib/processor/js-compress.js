/**
 * @file js compressor 的独立进程
 * @author sekiyika (px.pengxing@gmail.com)
 */

var helper = require('./helper');

process.on('message', function (data) {
    process.send({
        file: data.file,
        options: data.options,
        result: helper.compressJavascript(data.file, data.options)
    });
});
