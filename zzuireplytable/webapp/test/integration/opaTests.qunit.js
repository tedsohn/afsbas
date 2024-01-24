sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'zzuireplytable/test/integration/FirstJourney',
		'zzuireplytable/test/integration/pages/ReplyTableList',
		'zzuireplytable/test/integration/pages/ReplyTableObjectPage',
		'zzuireplytable/test/integration/pages/ReplyCodeObjectPage'
    ],
    function(JourneyRunner, opaJourney, ReplyTableList, ReplyTableObjectPage, ReplyCodeObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('zzuireplytable') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheReplyTableList: ReplyTableList,
					onTheReplyTableObjectPage: ReplyTableObjectPage,
					onTheReplyCodeObjectPage: ReplyCodeObjectPage
                }
            },
            opaJourney.run
        );
    }
);