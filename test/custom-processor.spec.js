var builder = require('../index');
var path = require('path');
var fs = require('fs');


describe('custom-processor', function() {
    it('raw object', function() {
        var outputDir = path.resolve(__dirname, 'data/css-compressor/_output');
        var conf = {
            input: path.resolve(__dirname, 'data/css-compressor'),
            output: outputDir,
            getProcessors: function () {
                return [
                    { 
                        name:'clearOutput', 
                        process: function (file,context,callback) {
                            if (file.extname =='less') {
                                file.outputPath = '';
                            }
                            callback();
                        }
                    }
                ]
            }
        };

        builder(conf, function () {
            expect(fs.existsSync(path.resolve(outputDir, '1.less'))).toBeFalsy();
            expect(fs.existsSync(path.resolve(outputDir, '1.less.html'))).toBeTruthy();
            require( 'edp-core' ).util.rmdir( outputDir );
        });
    });

    it('inherits AbstractProcessor', function() {
        var conf = require('./custom-processor-config');
        var outputDir = conf.output;

        builder(conf, function () {
            expect(fs.existsSync(path.resolve(outputDir, 'default.js'))).toBeFalsy();
            expect(fs.existsSync(path.resolve(outputDir, '5.js'))).toBeTruthy();
            require( 'edp-core' ).util.rmdir( outputDir );
        });
    });

});
