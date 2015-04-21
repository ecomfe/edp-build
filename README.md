# edp-build

[![Build Status](https://travis-ci.org/ecomfe/edp-build.png?branch=master)](https://travis-ci.org/ecomfe/edp-build) [![Dependencies Status](https://david-dm.org/ecomfe/edp-build.png)](https://david-dm.org/ecomfe/edp-build)


Package for edp build.

```
# 检查build之后的结果是否正常的一种方式
edp amd list biz.js | sort | uniq -c | sort -k 1 -n -r | awk '{if($1>1){print $0}}'

# 如果有输出，那么说明可能存在问题
```
