/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zsm_zgrcstatus/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
