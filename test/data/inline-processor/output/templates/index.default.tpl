{strip}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>test</title>
    <style>#wrap img{display:block;border:0}#wrap em{color:#C60A00;font-style:normal}#wrap a{text-decoration:none}#wrap a:hover{text-decoration:underline}#wrap .bg{display:inline-block;width:16px;height:16px;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACDElEQVR4nLVSPWhTURg9992bF5M0kiGUUh2KpkoFUWs6qINDIw46dvMvWlALVUEnuwlKhyA6iNpF8XdRoUMXcSgOsSKxghmtOmloTO3PS9/Lu/fd+zmIJWlMwcG7ne+c73DPuRf4n+fQxPzpwxOVk2tpxFok935eITIawP1WGqsVkRkvH4wY2RGlYMOBF6XMPxvw5fmco8hxFDnMW8y10rF6sP9ZKQmilKwu7G23g+tz0rpMAJK2Gf0h+QURT7xjjH96PdAxt2Kw5+HMvrCRLwV0zCLzuxRm4BkBadmcYBA2gY6wAICFAIBhFgLwZR+hjDV1PJX3NF21tIIvNb67KjvrsZ4lp2rns1vNm2yPWaxW7VmfbSu56oQvNSyt4Cl9bSrb/XYlQnqsOBRH7banqOyLcOrD2R1Ofbxdd4sRW3szUcE6l0zo3PuhnbcaSiyc2X5nTvEjHKadG/m5qW2tvgoynRUfg3+Wm17h43DvU1ebivblt9UGRtbKrtKl4vm+e/Xzho/UncsLpnXSVcGDzaOTuyO2eM4A1FQw4Er/VUTwi003a0B2NE1aA0SD8RArQAddpIOumGAFRnSKjMGWm9O9LQ0CJdMGBA4kHIlHHo/GPBFrq0r2hAMJgKCV39cyAjO631E0iXXrj325lK7v4eimG9Mj8BYeQ5h+AGOrowAANo6Mx/9KNGra6vEvz6L1ybL0deIAAAAASUVORK5CYII=) 0 0 no-repeat}</style>
</head>
<body>
<div id="wrap">
    <div class="content">
        {foreach $tplData.itemList as $item}
        <a class="item-img" href="{$item.url}" target="_blank">
            <img src="{$item.img}">
        </a>
        {/foreach}
    </div>
    <span class="bg"></span>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACDElEQVR4nLVSPWhTURg9992bF5M0kiGUUh2KpkoFUWs6qINDIw46dvMvWlALVUEnuwlKhyA6iNpF8XdRoUMXcSgOsSKxghmtOmloTO3PS9/Lu/fd+zmIJWlMwcG7ne+c73DPuRf4n+fQxPzpwxOVk2tpxFok935eITIawP1WGqsVkRkvH4wY2RGlYMOBF6XMPxvw5fmco8hxFDnMW8y10rF6sP9ZKQmilKwu7G23g+tz0rpMAJK2Gf0h+QURT7xjjH96PdAxt2Kw5+HMvrCRLwV0zCLzuxRm4BkBadmcYBA2gY6wAICFAIBhFgLwZR+hjDV1PJX3NF21tIIvNb67KjvrsZ4lp2rns1vNm2yPWaxW7VmfbSu56oQvNSyt4Cl9bSrb/XYlQnqsOBRH7banqOyLcOrD2R1Ofbxdd4sRW3szUcE6l0zo3PuhnbcaSiyc2X5nTvEjHKadG/m5qW2tvgoynRUfg3+Wm17h43DvU1ebivblt9UGRtbKrtKl4vm+e/Xzho/UncsLpnXSVcGDzaOTuyO2eM4A1FQw4Er/VUTwi003a0B2NE1aA0SD8RArQAddpIOumGAFRnSKjMGWm9O9LQ0CJdMGBA4kHIlHHo/GPBFrq0r2hAMJgKCV39cyAjO631E0iXXrj325lK7v4eimG9Mj8BYeQ5h+AGOrowAANo6Mx/9KNGra6vEvz6L1ybL0deIAAAAASUVORK5CYII=">
</div>
<script>
    (function () {
        /**
 * @file log util
 * @author test
 */

var gLog = {};

/**
 * output debug info
 *
 * @param {string} info the information to output
 */
gLog.debug = function (info) {
    console.log(info);
};

    })();
</script>
</body>
{/strip}
