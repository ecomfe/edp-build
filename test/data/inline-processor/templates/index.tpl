{strip}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>test</title>
    <link href="{$host}/src/index/index.less?_inline" rel="stylesheet">
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
    <img src="{$host}/src/common/img/bookmark.png?_inline">
</div>
<script>
    (function () {
        document.write('<script src="{$host}/src/common/log.js?_inline"></script>');
    })();
</script>
</body>
{/strip}
