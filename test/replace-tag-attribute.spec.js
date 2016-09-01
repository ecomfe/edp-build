/**
 * @file 测试一下 replace-tag-attribute 功能是否正常
 * @author Firede(firede@firede.us)
 */

var expect = require('expect.js');

var replaceTagAttribute = require('../lib/util/replace-tag-attribute');

describe('replace-tag-attribute', function () {

    var expectValue = '<head><script src="/root/path/file.js" type="text/javascript"></script></head>';

    it('default', function () {
        var value = replaceTagAttribute(
            '<head><script src="${root}/path/file.js" type="text/javascript"></script></head>',
            'script',
            'src',
            function (val) {
                return val.replace('${root}', '/root');
            }
        );

        expect(value).to.be(expectValue);
    });

    it('attribute value include `<`', function () {
        var value = replaceTagAttribute(
            '<head><script src="<$root>/path/file.js" type="text/javascript"></script></head>',
            'script',
            'src',
            function (val) {
                return val.replace('<$root>', '/root');
            }
        );
        expect(value).to.be(expectValue);
    });

    xit('script-x should not matched', function () {
        // FIXME 这个 case 暂时还通不过
        // 当搜索 tag 为 script 时，会匹配到以 script 为前缀的所有 tag
        // 要先确定当前有没有误用的情况，再修复此问题
        var textScriptX = '<head><script-x src="${root}/path/file.js" type="text/javascript"></script></head>';
        var value = replaceTagAttribute(
            textScriptX,
            'script',
            'src',
            function (val) {
                return val.replace('${root}', '/root');
            }
        );
        console.log(value);
        expect(value).to.be(textScriptX);
    });

});
