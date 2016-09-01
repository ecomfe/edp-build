/**
 * @file test/custom-processor.spec.js
 * @author leeight
 */
var fs = require('fs');
var path = require('path');

var edp = require('edp-core');
var expect = require('expect.js');

var builder = require('../index');

describe('custom-processor', function () {
    it('raw object', function (done) {
        var outputDir = path.resolve(__dirname, 'data/css-compressor/_output');
        var conf = {
            input: path.resolve(__dirname, 'data/css-compressor'),
            output: outputDir,
            getProcessors: function () {
                return [
                    {
                        name: 'clearOutput',
                        process: function (file, context, callback) {
                            if (file.extname === 'less') {
                                file.outputPath = '';
                            }
                            callback();
                        }
                    }
                ];
            }
        };

        builder(conf, function () {
            expect(fs.existsSync(path.resolve(outputDir, '1.less'))).to.be(false);
            expect(fs.existsSync(path.resolve(outputDir, '1.less.html'))).to.be(true);
            edp.util.rmdir(outputDir);
            done();
        });
    });

    it('inherits AbstractProcessor', function (done) {
        var conf = require('./custom-processor-config');
        var outputDir = conf.output;

        builder(conf, function () {
            expect(fs.existsSync(path.resolve(outputDir, 'default.js'))).to.be(false);
            expect(fs.existsSync(path.resolve(outputDir, '5.js'))).to.be(true);
            edp.util.rmdir(outputDir);
            done();
        });
    });

});
