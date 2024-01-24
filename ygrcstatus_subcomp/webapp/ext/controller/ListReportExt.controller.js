sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/ComponentContainer"
], function (MessageToast, ComponentContainer) {
    'use strict';

    return {
        navToComp2: function () {

            let aContexts = this.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                let data = element.getModel().getObject(element.getPath());
                console.log('Selected Rows are => ', data);
            });
            
            var oNavigationController = this.extensionAPI.getNavigationController(); 
            oNavigationController.navigateInternal("", { routeName: "toRequestCreatePage" })
        },

        GPTnavToComp2: function () {
            sap.ui.component({
                name: "ygrcstatus.Comp2",
                async: true
            }).then(function (oComp2) {
                console.log("ygrcstatus.Comp2 created:", oComp2);
        
                // Access oProxy directly from the component instance
                var oRootControl = oComp2.getRootControl();
                var oController = oRootControl.getController();
                var oOwnerComponent = oController.getOwnerComponent();
                var oComponentData = oOwnerComponent.getComponentData();
        
                if (oComponentData && oComponentData.oProxy) {
                    var oProxy = oComponentData.oProxy;
                    // Your logic here...
                } else {
                    console.error("oProxy is undefined or not present in the component data");
                }
            }).catch(function (oError) {
                console.error("Error creating ygrcstatus.Comp2:", oError);
            });
        },
    };
});