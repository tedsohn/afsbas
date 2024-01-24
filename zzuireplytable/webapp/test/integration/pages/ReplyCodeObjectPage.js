sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'zzuireplytable',
            componentId: 'ReplyCodeObjectPage',
            contextPath: '/ReplyTable/_replycode'
        },
        CustomPageDefinitions
    );
});