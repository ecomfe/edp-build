/**
 * @file bcs-uploader.spec.js
 * @author zengjialuo(zengjialuo@baidu.com)
 **/
var path = require( 'path' );

var BcsUploader = require( '../lib/processor/bcs-uploader.js' );
var ProcessContext = require( '../lib/process-context' );
var base = require( './base' );
var projectDir = path.resolve( __dirname, 'data', 'dummy-project' );

describe('bcs-uploader', function () {
    xit('default', function (done) {
        var processor = new BcsUploader(
            {
                ak: 'ak',
                sk: 'sk',

                bucket: 'ad-test',
                prefix: 'bcj-static',
                concurrent: 2
            }
        );

        // Mock upload
        processor.sdk._sendRequest = createSpy( 'sdk._sendRequest' ).andCallFake(
            function ( options, data, targetUrl, def ) {
                setTimeout(
                    function () {
                        var bcsUrl = decodeURIComponent( targetUrl.replace(/\?.*/g, '') );
                        if ( bcsUrl.indexOf( '.js' ) > -1 ) {
                            def.resolve( bcsUrl );
                        } else {
                            def.reject( 'mock failing' );
                        }
                    },
                    10
                );
            }
        );

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
        var fileData3 = base.getFileInfo( 'src/bar.js', projectDir );
        processContext.addFile( fileData1 );
        processContext.addFile( fileData2 );
        processContext.addFile( fileData3 );
        fileData3.outputPath = null;

        base.launchProcessors( [processor], processContext, function() {
            expect( processor.concurrent ).toBe (2);
            expect( fileData1.get( 'bcsUrl' ) ).toMatch(
                /^http:\/\/(.+)\.baidu\.com\/ad-test\/bcj-static\/src\/foo.js/
            );
            expect( fileData2.get( 'bcsUrl' ) ).toBeUndefined();
            expect( fileData3.get( 'bcsUrl' ) ).toBeUndefined();
            done();
        });

    });

});


