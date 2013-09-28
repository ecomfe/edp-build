/***************************************************************************
 * 
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * compile-module.spec.js ~ 2013/09/28 22:27:51
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var fs = require('fs');
var path = require('path');

var base = require('./base');
var CompileModule = require('../lib/util/compile-module.js');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');

describe('compile-module', function() {
    it('default `combine` is false', function() {
        var moduleCode = CompileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'foo.js'), 'utf-8'),
            'foo',
            ConfigFile,
            false
        );
        var expectedCode =
        "define('foo', function (require) {\n" +
        "    var ioFile = require('io/File');\n" +
        "    var netHttp = require('net/Http');\n" +
        "    var erView = require('er/View');\n" +
        "    return 'foo';\n" +
        "});";
        expect(moduleCode).toEqual(expectedCode);
    });

    it('dep\'s main module', function() {
        var moduleCode = CompileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'bar.js'), 'utf-8'),
            'bar',
            ConfigFile,
            true
        );

        var expectedCode =
        "define('net/Http', function (require) {\n" +
        "    return 'net/Http';\n" +
        "});\n\n" +
        "define('er/View', function (require) {\n" +
        "    return require('net/Http') + ';' + 'er/View';\n" +
        "});\n\n" +
        "define('er/main', function (require) {\n" +
        "    var view = require('./View');\n" +
        "    return 'er';\n" +
        "});\n\n" +
        "define('er', ['er/main'], function ( main ) { return main; });\n\n" +
        "define('bar', function (require) {\n" +
        "    var er = require('er');\n" +
        "    return er;\n" +
        "});";
        expect(moduleCode).toEqual(expectedCode);
    });

    it('main module', function() {
        var moduleCode = CompileModule(
            fs.readFileSync(path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js'), 'utf-8'),
            'er',
            ConfigFile,
            true
        );

        var expectedCode =
        "define('net/Http', function (require) {\n" +
        "    return 'net/Http';\n" +
        "});\n\n" +
        "define('er/View', function (require) {\n" +
        "    return require('net/Http') + ';' + 'er/View';\n" +
        "});\n\n" +
        "define('er/main', function (require) {\n" +
        "    var view = require('./View');\n" +
        "    return 'er';\n" +
        "});\n\n" +
        "define('er', ['er/main'], function ( main ) { return main; });";
        expect(moduleCode).toEqual(expectedCode);
    });

    it('default `combine` is true', function() {
        var moduleCode = CompileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'foo.js'), 'utf-8'),
            'foo',
            ConfigFile,
            true
        );

        var expectedCode =
        "define('er/View', function (require) {\n" +
        "    return require('net/Http') + ';' + 'er/View';\n" +
        "});\n\n" +
        "define('net/Http', function (require) {\n" +
        "    return 'net/Http';\n" +
        "});\n\n" +
        "define('io/File', function (require) {\n" +
        "    return 'io/File';\n" +
        "});\n\n" +
        "define('foo', function (require) {\n" +
        "    var ioFile = require('io/File');\n" +
        "    var netHttp = require('net/Http');\n" +
        "    var erView = require('er/View');\n" +
        "    return 'foo';\n" +
        "});";
        expect(moduleCode).toEqual(expectedCode);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
