sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/Menu",
    "sap/ui/unified/MenuItem",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Popup",
    "sap/m/Menu",
    "sap/m/MenuItem",
    "sap/m/ToolbarSpacer",
    "sap/ui/thirdparty/jquery",
    "sap/ui/Device",
    "SmartFloor/AssembleWeight/controller/TableUtility",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet"

], function (Log, Controller, JSONModel, Menu, MenuItem, MessageToast,
    DateFormat, Popup, MenuM, MenuItemM, ToolbarSpacer, jQuery, Device, 
    TableUtility, exportLibrary, Spreadsheet) {
    "use strict";

    var that = "";
    var EdmType = exportLibrary.EdmType;

    return Controller.extend("SmartFloor.AssembleWeight.controller.App", {

        onInit: function () {

                this.getView().addEventDelegate({
                    onBeforeFirstShow: function () {
                        console.log("on before show!");
                    }
                });

                that = this;
                that.oWeightModel = new JSONModel();
                this.getView().setModel(that.oWeightModel, "WEIGHT");

                if (1 == 1) {
                    that.oWeightModel.loadData("./model/AssembleWeight.json");
                } else {
                    that.fnGetWeight();
                }


                that.oWeightModel.attachRequestCompleted(function () {
                    console.log(that.oWeightModel.getData());
                    that.oWeightModel.getProperty("/0/");
                    that.oWeightModel.getProperty("/0/SFC");
                });

                var oGroupingModel = new JSONModel({ hasGrouping: false });
                this.getView().setModel(oGroupingModel, "Grouping");

                this.getView().setModel(new JSONModel({
                showVisibilityMenuEntry: false,
                showFreezeMenuEntry: false,
                enableCellFilter: false
                }), "ui");

                // init and activate controller

            },

            fnGetWeight: function () {
                var url = "/XMII/Illuminator?QueryTemplate=MyContent_tsohn/Assemble/getAssembleWT" + "&Content-Type=text/json";
                $.ajax({
                    type: "POST",
                    url: url, 
                    success: function (data) {
                        // jQuery.sap.delayedCall(100, that, function () {
                        //     oGlobalBusyDialog.close();
                        // });
                        var row = data.Rowsets.Rowset[0].Row;
                        var WeightData;

                        if (row) {
                            WeightData = {
                                WeightCollection: []
                            };
                            WeightData.WeightCollection = row;
                        } else {
                            WeightData = {
                                Weight: []
                            };
                        }
                        that.oWeightModel.setData(WeightData);

                        console.log(that.oWeightModel.getData());
                        console.log(that.oWeightModel.getProperty("/WeightCollection/0/"));
                        console.log(that.oWeightModel.getProperty("/WeightCollection/0/SFC"));

                    },
                    error: function (err) {

                    }
                }); //ajax close
            }, 

        onExcelPress: function () {
            var aCols, aWeightData, oSettings, oSheet, oRowBinding, oTable;

            aCols = this.createColumnConfig();
            aWeightData = this.getView().getModel("WEIGHT").getProperty('/WeightCollection');

            oSettings = {
                workbook: { columns: aCols },
                dataSource: aWeightData,
                fileName: 'Assembly Weight.xlsx',
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function () {
//                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(oSheet.destroy);

        },

        createColumnConfig: function () {
            var aCols = [];

 
     aCols.push({
                label: 'Plant',
                property: ['PLANT'],
                type: EdmType.String
            });
            aCols.push({
                label: 'SFC',
                property: 'SFC',
                type: EdmType.String
            });
            aCols.push({
                label: 'Material',
                property: 'MATERIAL',
                type: EdmType.String
            });
            aCols.push({
                label: 'Asset Material',
                property: 'ASSET_MATERIAL',
                type: EdmType.String
            });
            aCols.push({
                label: 'Start WT',
                property: 'START_WT',
                type: EdmType.String
            });
            aCols.push({
                label: 'Net WT',
                property: 'NET_WT',
                type: EdmType.Number
            });
            aCols.push({
                label: 'End WT',
                property: 'END_WT',
                type: EdmType.Number
            });
            aCols.push({
                label: 'Batch',
                property: 'BATCH',
                type: EdmType.String
            });
            aCols.push({
                label: 'ASSET_BATCH',
                property: 'ASSET_BATCH',
                type: EdmType.String
            });
            aCols.push({
                label: 'Asset Batch',
                property: 'ASSET_TYPE',
                type: EdmType.String,
            });

            return aCols;
        },

        onPDFPress: function () {
            var aWegihtData,
            aWegihtData = this.getView().getModel("WEIGHT").getProperty('/WeightCollection');

            var columns = ["Plant", "SFC", "Material", "AssetMaterial", "Start WT", "Net WT", "End WT", "Batch", "Asset Batch", "Asset Type"];
            var data = [];
            for (var i = 0; i < aWegihtData.length; i++) {
                data[i] = [aWegihtData[i].PLANT, 
			aWegihtData[i].SFC, 
			aWegihtData[i].MATERIAL,
			aWegihtData[i].ASSET_MATERIAL, 
			aWegihtData[i].START_WT,
			aWegihtData[i].NET_WT, 
			aWegihtData[i].END_WT,
			aWegihtData[i].BATCH, 
			aWegihtData[i].ASSET_BATCH,
			aWegihtData[i].ASSET_TYPE] ;
            }

            var pdfdoc = new jsPDF("p", "pt");
            pdfdoc.autoTable(columns, data);
            MessageToast.show('PDF being exported');
            pdfdoc.save("Assembly Weight.pdf");
        }


  
    });

});
