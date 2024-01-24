sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'zzuimrc',
            componentId: 'MRCBuildObjectPage',
            contextPath: '/MRC/_mrc_build'
        },
        CustomPageDefinitions
    );
});