sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'zzuimrc/test/integration/FirstJourney',
		'zzuimrc/test/integration/pages/MRCList',
		'zzuimrc/test/integration/pages/MRCObjectPage',
		'zzuimrc/test/integration/pages/MRCBuildObjectPage'
    ],
    function(JourneyRunner, opaJourney, MRCList, MRCObjectPage, MRCBuildObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('zzuimrc') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheMRCList: MRCList,
					onTheMRCObjectPage: MRCObjectPage,
					onTheMRCBuildObjectPage: MRCBuildObjectPage
                }
            },
            opaJourney.run
        );
    }
);