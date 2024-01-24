sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ygrcstatus.Comp2.controller.Detail", {

        onInit: function () {
            debugger;
            this.getOwnerComponent().attachEvent("stStartCompleted", this.onStStartCompleted, this);
        },

        onBeforeRendering: function () {
            debugger;
            this.getOwnerComponent().attachEvent("stRefreshCompleted", this.onStStartCompleted, this);
            // var oComponent = this.getOwnerComponent(); 
            // var oModel = oComponent.getModel(""); 
            // var sComponentId = oComponent.getId(); 

            // sPath = this.oBindingContext.getPath();
            // oData = this.oModel.getProperty(sPath);


            // Retrieve the OData model from the component
            // var oModel = this.getOwnerComponent().oModel;
            // debugger;
            // if (oModel) {
            //     var oData = oModel.getProperty("/");

            //     var oJSONModel = new JSONModel();
            //     oJSONModel.setData(oData);

            //     this.getView().setModel(oJSONModel, "jsonModel");
            // } else {
            //     // Handle the case when the model is not available
            // }

            // Check if stStart has been called and the model is available
            // if (this.oModel) {
            //     this.processModel(this.oModel);
            // } else {
            //     // If not, wait for stStart to be called
            //     this.attachEventOnce("stStartCompleted", function (oEvent) {
            //         this.processModel(oEvent.getParameter("oModel"));
            //     }, this);
            // }

        },

        onStStartCompleted: function (oEvent) {
            // Handle the event, you can access the oModel from oEvent
            var oModel = oEvent.getParameter("oModel");
            var oBindingContext = oEvent.getParameter("oBindingContext");
            var sBindingPath = oBindingContext.getPath();
            var oData = oModel.getProperty(sBindingPath);

            //set the JSON model
            var oJSONModel = new JSONModel();
            oJSONModel.setData(oData);
            this.getView().setModel(oJSONModel, "jsonModel");

            // Bind the model to the view
            this.getView().bindElement({
                path: "jsonModel>/", // Assuming your properties are at the root level
                model: "jsonModel"
            });
        }

    });
});
