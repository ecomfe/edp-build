/**
 * bcs-uploader.spec.js
 * @author zengjialuo(zengjialuo@baidu.com)
 **/
var path = require( 'path' );
var edp = require( 'edp-core' );

var BcsUploader = require( '../lib/processor/bcs-uploader.js' );
var ProcessContext = require( '../lib/process-context' );
var base = require( './base' );
var projectDir = path.resolve( __dirname, 'data', 'dummy-project' );

describe('bcs-uploader', function () {
    it('default', function (done) {
        var processor = new BcsUploader(
            {
                ak: 'ak',
                sk: 'sk',

                bucket: 'ad-test',
                prefix: 'bcj-static',
                concurrent: 5
            }
        );

        // Mock upload
        processor.sdk.realUpload = function ( data, bucket, objectName ) {
            var def = new edp.Deferred();
            if (objectName.indexOf('.js') > -1 ) {
                def.resolve( 'http://bcscdn.baidu.com/' + bucket + '/' + objectName );
            } else {
                def.reject( 'mock failing' );
            }
            return def;
        };

        var processContext = new ProcessContext(
            {
                baseDir: projectDir,
                exclude: [],
                outputDir: 'output',
                fileEncodings: {}
            }
        );
        
        var fileData1 = base.getFileInfo( 'src/foo.js', projectDir );
        var fileData2 = base.getFileInfo( 'src/biz/foo.css', projectDir );
        processContext.addFile( fileData1 );
        processContext.addFile( fileData2 );

        base.launchProcessors( [processor], processContext, function() {
            expect( fileData1.get( 'bcsUploadSuccess' ) ).toEqual( true );
            expect( fileData2.get( 'bcsUploadSuccess' ) ).toEqual( undefined );
            done();
        });

    });

});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */