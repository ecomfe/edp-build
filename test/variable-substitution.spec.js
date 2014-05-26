/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * variable-substitution.spec.js ~ 2014/05/26 16:48:26
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var path = require('path');

var base = require('./base');
var VariableSubstitution = require( '../lib/processor/variable-substitution.js' );
var ProcessContext = require( '../lib/process-context' );
var Project = path.resolve(__dirname, 'data', 'dummy-project');

describe( 'variable-substitution', function(){
    it( 'default', function(){
        var processor = new VariableSubstitution({
            variables: {
                version: '1.0.1'
            }
        });

        var fileData = base.getFileInfo( 'issue-259.html', Project );

        var processContext = new ProcessContext( {
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        processContext.addFile( fileData );

        base.launchProcessors( [ processor ], processContext, function(){
            var expected = '<link rel="stylesheet" href="main.css?1.0.1">\n<link rel="stylesheet" href="main.css?1.0.1">';
            expect( fileData.data.trim() ).toEqual( expected );
        });
    });
});



















/* vim: set ts=4 sw=4 sts=4 tw=100: */
