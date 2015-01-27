/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * issue-136.spec.js ~ 2014/03/22 19:56:10
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * 测试避免出现
 * define('etpl/main', etpl);
 * 的情况
 **/
var edp = require( 'edp-core' );
var fs = require('fs');
var path = require('path');

var base = require('./base');
var ModuleCompiler = require('../lib/processor/module-compiler.js');

// var Project = path.resolve(__dirname, 'data', 'dummy-project');
var Project = '/Users/leeight/public_html/case/baike';
// var ConfigFile = path.resolve(Project, 'module.conf');

var moduleEntries = 'html,htm,phtml,tpl,vm,js';
// var pageEntries = 'html,htm,phtml,tpl,vm';

describe('issue-136', function(){
    // 需要测试的是如果combine的时候有package的代码需要合并，最后处理的是否正常.
    xit('default', function(){
        var processor = new ModuleCompiler({
            exclude: [],
            configFile: 'module.conf',
            entryExtnames: moduleEntries,
            getCombineConfig: function() {
                return {
                    'common/main': {
                        'exclude': [
                            'ef/**', 'validation/**', 'esui/**', 'er/**', 'ui/**', 'urijs/**', 'underscore/**',
                            'ecma/extension/*', 'ecma/system/*', 'ecma/io/*'
                        ],
                        'include': [ 'ecma/mvc/ListView', 'etpl/**' ]
                    }
                };
            }
        });

        var filePath = path.join(Project, 'src', 'common', 'main.js');
        var fileData = base.getFileInfo(filePath);

        function dumpModuleIds( code ) {
            var ast = edp.amd.getAst( code );
            var moduleInfo = edp.amd.analyseModule( ast );
            var moduleIds = moduleInfo.map(function( info ){ return info.id || '<anonymous>'; });
            moduleIds.sort();
            console.log( JSON.stringify( moduleIds ) );
        }

        var processContext = { baseDir: Project };
        processor.process(fileData, processContext, function(){
            // console.log( fileData.data );
            dumpModuleIds( fileData.data );
            dumpModuleIds( fs.readFileSync(
                '/Users/leeight/public_html/case/baike/output/asset/common/main.js', 'utf-8' ) );
        });
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
