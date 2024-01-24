sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    'use strict';

    return {
        fnNavitoReplyTableCreate: function (oEvent) {
            MessageToast.show("Custom handler invoked.");

            // Generate a random UUID using an alternative method
             var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                 var r = Math.random() * 16 | 0,
                     v = c == 'x' ? r : (r & 0x3 | 0x8);
                 return v.toString(16);
             });        
             var encodedUuid = encodeURIComponent(uuid);
        
            // Open the window with the generated UUID
            window.open('/sap/bc/ui5_ui5/sap/zzuireplytable/index.html',  "_blank");  
            //window.open('/sap/bc/ui5_ui5/sap/zzuireplytable/index.html#/ReplyTable(ReplyTableUUID=' + encodedUuid + ',IsActiveEntity=false)', "_blank");
            // this is to commit to basbranch1 
 
        }
    };
});
