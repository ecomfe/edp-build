all:
	env EDP_LOG_SILENT=1 ../node_modules/.bin/jasmine-node --verbose --growl --captureExceptions .

cover:
	env EDP_LOG_SILENT=1 ../node_modules/.bin/istanbul cover --include-all-sources ../node_modules/.bin/jasmine-node --verbose --growl --captureExceptions .
