sap.ui.define([
    'SmartFloor/AssembleWeight/controller/Formatter',
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
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    'sap/m/Label',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment', 
    'sap/ui/model/Sorter'

], function (Formatter, Log, Controller, JSONModel, Menu, MenuItem, MessageToast,
    DateFormat, Popup, MenuM, MenuItemM, ToolbarSpacer, jQuery, Device,
    exportLibrary, Spreadsheet, Label, Filter, FilterOperator, Fragment, Sorter) {
    "use strict";

    var that = "";
    var EdmType = exportLibrary.EdmType;

    return Controller.extend("SmartFloor.AssembleWeight.controller.Main2", {

        onInit: function () {
            that = this;
            that.oWeightModel = new JSONModel();
            this.getView().setModel(that.oWeightModel, "WEIGHT");
            this.oWeightModel.setSizeLimit(200); 
            if (1 == 1) {
                that.oWeightModel.loadData("./model/AssembleWeight.json");
            } else {
                that.fnGetWeight();
            }

			this.getView().setModel(new JSONModel({
				globalFilter: "", 
                globalQuery: "" 
				//availabilityFilterOn: false,
				//cellFilterOn: false
			}), "ui");

            that.oWeightModel.attachRequestCompleted(function () {
                that.initialSortModel();                 
            });
        },

        fnGetWeight: function () {
            var url = "/XMII/Illuminator?QueryTemplate=MyContent_tsohn/Assemble/getAssembleWT" + "&Content-Type=text/json";
            $.ajax({
                type: "POST",
                url: url,
                success: function (data) {
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
                    
                    that.initialSortModel();     
                    that.cleanModelData(); 
                },
                error: function (err) {
                }
            }); 
        },

        initialSortModel: function () {    
            var collectionArray = that.oWeightModel.getProperty("/WeightCollection");
            collectionArray.sort(function (a, b) {
                return a.PLANT.localeCompare(b.PLANT) || a.SFC.localeCompare(b.SFC);
            });
            that.oWeightModel.setProperty("/WeightCollection", collectionArray);                  
        },

        cleanModelData: function () {               
            var collectionArray = that.oWeightModel.getProperty("/WeightCollection");
            for (var i = 0; i < collectionArray.length; i++) {
                if (collectionArray[i].START_WT == "NA") {
                    collectionArray[i].START_WT = 0; 
                }
                if (collectionArray[i].NET_WT == "NA") {
                    collectionArray[i].NET_WT = 0; 
                }
                if (collectionArray[i].END_WT == "NA") {
                    collectionArray[i].END_WT = 0; 
                }
            }
            that.oWeightModel.setProperty("/WeightCollection", collectionArray);            
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
                type: EdmType.Number
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

		clearAllSortings : function(oEvent) {
			var oTable = this.byId("WeightTable");
			oTable.getBinding().sort(null);
			this._resetSortingState();
		},
        _resetSortingState : function() {
			var oTable = this.byId("WeightTable");
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},
        
		clearAllFilters : function(oEvent) {
            var oTable = this.byId("WeightTable");
			var oUiModel = this.getView().getModel("ui");
			oUiModel.setProperty("/globalFilter", "");
			this._oGlobalFilter = null;

			this._filter();

			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
                    oTable.filter(aColumns[i], null);
			}
		},

        _filter : function() {
			var oFilter = this._oGlobalFilter;
			this.byId("WeightTable").getBinding().filter(oFilter, "Application");
		},

		filterGlobally : function(oEvent) {
			var sQuery = oEvent.getParameter("query");
            var oUiModel = this.getView().getModel("ui");
			this._oGlobalFilter = null;

			if (sQuery) {
                oUiModel.setProperty("/globalQuery", sQuery);
				this._oGlobalFilter = new Filter([
					new Filter("SFC", FilterOperator.Contains, sQuery),
					new Filter("MATERIAL", FilterOperator.Contains, sQuery)
				], false);
			}
			this._filter();
		},

        formatAvailableToObjectState: function (bAvailable) {
            return bAvailable ? "Success" : "Error";
        },
 
    });

});