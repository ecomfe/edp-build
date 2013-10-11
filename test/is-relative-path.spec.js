/***************************************************************************
 * 
 * Copyright (c) 2013 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * is-relative-path.spec.js ~ 2013/09/28 21:30:19
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var IsRelativePath = require('../lib/util/is-relative-path.js');

describe('is-relative-path', function() {
    it('default', function() {
        expect(IsRelativePath('a.jpg')).toBe(true);
        expect(IsRelativePath('./a.jpg')).toBe(true);
        expect(IsRelativePath('../a.jpg')).toBe(true);
        expect(IsRelativePath('//www.google.com/a.jpg')).toBe(false);
        expect(IsRelativePath('http://www.google.com/a.jpg')).toBe(false);
        expect(IsRelativePath('https://www.google.com/a.jpg')).toBe(false);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
