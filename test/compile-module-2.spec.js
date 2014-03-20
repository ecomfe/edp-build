/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * compile-module-2.spec.js ~ 2014/03/20 16:56:49
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var edp = require( 'edp-core' );
var fs = require('fs');
var path = require('path');

var base = require('./base');
var CompileModule = require('../lib/util/compile-module.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var Project = '/Users/leeight/public_html/case/baike';
var ConfigFile = path.resolve(Project, 'module.conf');

describe('compile-module-2', function() {
    xit('default', function(){
        // include和exclude都使用pattern
        var moduleCode = CompileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'common', 'main.js'), 'utf-8'),
            'common/main',
            ConfigFile,
            {
                exclude: [ '*' ], // , 'er/*', 'validation/*', 'underscore/*', 'moment/*', 'esui/*', 'esui/**/*', 'urijs/*', 'mini-event/*', 'ecma/*', 'ecma/**/*', 'etpl/*' ],
                include: [ [ [ [ 'er/*' ] ] ] ]
            }
        );
        var ast = edp.esl.getAst( moduleCode );
        var moduleInfo = edp.esl.analyseModule( ast );
        var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>' });
        console.log( moduleIds );
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
