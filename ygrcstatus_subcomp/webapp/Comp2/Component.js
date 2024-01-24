sap.ui.define([
    //    "sap/suite/ui/generic/template/lib/AppComponent",  //from blog 
    "sap/ui/core/UIComponent",   //from UI5 demo kit 
    "sap/suite/ui/generic/template/extensionAPI/ReuseComponentSupport",
    "sap/ui/model/json/JSONModel"
],
    function (UIComponent, ReuseComponentSupport, JSONModel) {
        "use strict";
        return UIComponent.extend("ygrcstatus.Comp2.Component", {
            metadata: {
                manifest: "json",
                library: "myLibrary",
                properties: {
                    /* Standard properties for reuse components */
                    uiMode: {
                        type: "string",
                        group: "standard"
                    },
                    semanticObject: {
                        type: "string",
                        group: "standard"
                    },
                    stIsAreaVisible: {
                        type: "boolean",
                        group: "standard"
                    },

                    /* Component specific properties */
                    ReqNo: {
                        type: "string",
                        group: "specific",
                        defaultValue: ""
                    }
                }
            },



            // Standard life time event of a component. Used to transform this component into a reuse component for Fiori Elements
            init: function () {
                debugger;

                // Defensive call of init of the super class:
                (UIComponent.prototype.init || jQuery.noop).apply(this, arguments);

                //Transform this component into a reuse component for Fiori Elements:
                ReuseComponentSupport.mixInto(this, "myPropertiesModelName");
                //this.setStIsAreaVisible(true);
                // Technique 2: Attach to changes of the component model
                var oMyPropertiesModel = this.getComponentModel();
                var oPropertyBinding = oMyPropertiesModel.bindProperty("/ReqNo");
                oPropertyBinding.attachChange(function () {
                    debugger;
                    var sDocumentNumber = oMyPropertiesModel.getProperty("/ReqNo");
                    alert(sDocumentNumber);
                    // ... (any code that wants to consume the changed document number)
                });
            },
            // Technique 1: Redefine the predefined setter-method
            setStIsAreaVisible: function (bIsAreaVisible) {
                debugger;
                if (bIsAreaVisible !== this.getStIsAreaVisible()) {
                    this.setProperty("stIsAreaVisible", bIsAreaVisible); // ensure that the property is updated accordingly
                    // ... (any code that wants to consume the changed visibility of the reuse component)
                    this.refreshImpl();
                }
            },
            stStart: function (oModel, oBindingContext, oExtensionAPI) {
                debugger;
                this.oModel = oModel;
                this.oBindingContext = oBindingContext;
                this.oExtensionAPI = oExtensionAPI;
                this.refreshImpl();
                // Trigger the event when stStart is completed
                this.fireEvent("stStartCompleted", { oModel: oModel, oBindingContext: oBindingContext });
            },

            stRefresh: function (oModel, oBindingContext, oExtensionAPI) {
                debugger;
                this.oModel = oModel;
                this.oBindingContext = oBindingContext;
                this.oExtensionAPI = oExtensionAPI;
                this.refreshImpl();
                // Trigger the event when stStart is completed
                this.fireEvent("stRefreshCompleted", { oModel: oModel, oBindingContext: oBindingContext });               
            },

            refreshImpl: function () {
                debugger;
                if (this.oBindingContext && this.getStIsAreaVisible()) {
                    // ... (any code that loads the data for the Reuse Component according to this.oBindingContext)
                    debugger;
                    //this.oBindingContext = null;
                }
            }

        });
    }
);