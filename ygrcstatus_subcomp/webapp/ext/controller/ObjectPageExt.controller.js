sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/ComponentContainer"
], function (MessageToast, MessageBox, ComponentContainer) {
    'use strict';

    return {
        openGRCRequest: function (oEvent) {

            let aContexts = this.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                let data = element.getModel().getObject(element.getPath());
                console.log('Selected Rows are => ', data);
            });

            let oContext = oEvent.getSource().getBindingContext();
            let oDataFromBindingContext = oContext.getObject();

            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            var sBindingPath = oEvent.getSource().getBindingContext().getPath();
            var oData = oModel.getProperty(sBindingPath);
            const str1 = '/sap/bc/webdynpro/sap/grac_oif_request_approval?object_id=';
            var url = str1.concat(oData.ExternalKey);
            window.open(url, "_blank");
        },
        createUser: function (oEvent) {
            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            var sBindingPath = oEvent.getSource().getBindingContext().getPath();
            var oData = oModel.getProperty(sBindingPath);
            //            MessageToast.show("Create User invoked for " + oData.ReqNo);

            var oNavigationController = this.extensionAPI.getNavigationController();
            oNavigationController.navigateInternal("", { routeName: "toUserCreatePage" })
        },


        createRole: function (oEvent) {
            var oNavigationController = this.extensionAPI.getNavigationController();
            oNavigationController.navigateInternal("", { routeName: "toRoleCreatePage" })
        },


        //-->
        createUser2: function (oEvent) {
            MessageToast.show("xxxxxxxxxxxxxxxxxxx   Create User invoked.");
            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            var sBindingPath = oEvent.getSource().getBindingContext().getPath();
            var fnFunction = function () {
                return new Promise(function (fnResolve, fnReject) {
                    oModel.read(sBindingPath, {
                        success: function (oResponse) {
                            var oMessage = new sap.ui.core.message.Message({
                                message: "We have received the following response: " + oResponse.ReqNo,
                                persistent: true, // create message as transition message
                                type: sap.ui.core.MessageType.Success
                            });
                            var oMessageManager = sap.ui.getCore().getMessageManager();
                            oMessageManager.addMessages(oMessage);
                            fnResolve();
                        },
                        error: function (oError) {
                            var oMessage = JSON.parse(oError.responseText).error.message.value;
                            MessageBox.error(oMessage);
                            fnReject();
                        }
                    });
                })
            };

            var mParameters = {
                sActionLabel: oSource.getText() // or "Your custom text" 
            };
            this.extensionAPI.securedExecution(fnFunction, mParameters);
        },



        //<--        
    };
});