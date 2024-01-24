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
    "sap/ui/export/Spreadsheet",
    'sap/m/Label',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment', 
    'sap/ui/model/Sorter'

], function (Log, Controller, JSONModel, Menu, MenuItem, MessageToast,
    DateFormat, Popup, MenuM, MenuItemM, ToolbarSpacer, jQuery, Device,
    TableUtility, exportLibrary, Spreadsheet, Label, Filter, FilterOperator, Fragment, Sorter) {
    "use strict";

    var that = "";
    var EdmType = exportLibrary.EdmType;

    return Controller.extend("SmartFloor.AssembleWeight.controller.Main", {

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

            //Filter
            this._mViewSettingsDialogs = {};  // for sorting
            this.aKeys = [
                "PLANT", "SFC", "MATERIAL" //, "START_WT"
            ];
            this.oSelectedPlant = this.getSelect("selPlant");
            this.oSelectedSFC = this.getSelect("selSFC");
            this.oSelectedMaterial = this.getSelect("selMaterial");
            this.oSelectedStart_WT = this.getSelect("selStart_WT");

            this.oWeightModel.setProperty("/Filter/text", "Filtered by None");
            this.addSnappedLabel();
            var oFB = that.getView().byId("filterbar");
            if (oFB) {
                oFB.variantsInitialized();
            }

            //Filter Model Setup
            that.oWeightModel.attachRequestCompleted(function () {
                console.log(that.oWeightModel.getData());
                that.oWeightModel.getProperty("/WeightCollection/0/");
                that.oWeightModel.getProperty("/WeightCollection/0/SFC");                                
                that.createFilerModels(); 
            });


        },

        onSearch: function () {
            this.onSelectChange();
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
                    that.createFilerModels(); 
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
            })
            .finally(oSheet.destroy);
        },

        createFilerModels: function () {                
            that.oPlantModel = new JSONModel();
            that.getView().setModel(that.oPlantModel, "PLANT");
            that.oSFCModel = new JSONModel();
            that.getView().setModel(that.oSFCModel, "SFC");
            that.oMaterialModel = new JSONModel();
            that.getView().setModel(that.oMaterialModel, "MATERIAL");

            that.oStart_WTModel = new JSONModel();
            that.getView().setModel(that.oStart_WTModel, "START_WT");




            var collectionArray = that.oWeightModel.getProperty("/WeightCollection");
            var plants = [], 
                SFCs = [], 
                materials = [],
                start_wt = [];
            var uniquePlants = [], 
                uniqueSFCs = [],
                uniqueMaterials = [],
                uniqueStart_WTs = [];
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
                plants.push(collectionArray[i].PLANT);
                SFCs.push(collectionArray[i].SFC);
                materials.push(collectionArray[i].MATERIAL);
                start_wt.push(collectionArray[i].START_WT);
            }
            that.oWeightModel.setProperty("/WeightCollection", collectionArray);
            
            const unique = (value, index, self) => {
                return self.indexOf(value) === index
            }
            const uPlants = plants.filter(unique).sort();
            const uSFCs = SFCs.filter(unique).sort();
            const uMaterials = materials.filter(unique).sort();
            const uStart_WTs = start_wt.filter(unique).sort();

            uniquePlants.push({ key: '', value: 'ALL' });
            uniqueSFCs.push({ key: '', value: 'ALL' });
            uniqueMaterials.push({ key: '', value: 'ALL' });
            uniqueStart_WTs.push({ key: '', value: 'ALL' });

            for (var i = 0; i < uPlants.length; i++) {
                uniquePlants.push({
                    key: uPlants[i],
                    value: uPlants[i]
                });
            }
            for (var i = 0; i < uSFCs.length; i++) {
                uniqueSFCs.push({
                    key: uSFCs[i],
                    value: uSFCs[i]
                });
            }
            for (var i = 0; i < uMaterials.length; i++) {
                uniqueMaterials.push({
                    key: uMaterials[i],
                    value: uMaterials[i]
                });
            }
            for (var i = 0; i < uStart_WTs.length; i++) {
                uniqueStart_WTs.push({
                    key: uStart_WTs[i],
                    value: uStart_WTs[i]
                });
            }

            that.oPlantModel.setData(uniquePlants);
            that.oSFCModel.setData(uniqueSFCs);
            that.oMaterialModel.setData(uniqueMaterials);
            that.oStart_WTModel.setData(uniqueStart_WTs);
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

        onSelectChange: function () {
            var aCurrentFilterValues = [];
            aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectedPlant));
            aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectedSFC));
            aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectedMaterial));
            aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectedStart_WT));

            this.filterTable(aCurrentFilterValues);
        },

        filterTable: function (aCurrentFilterValues) {
            this.getTableItems().filter(this.getFilters(aCurrentFilterValues));
            this.updateFilterCriterias(this.getFilterCriteria(aCurrentFilterValues));
        },

        updateFilterCriterias: function (aFilterCriterias) {
            this.removeSnappedLabel(); /* because in case of label with an empty text, */
            this.addSnappedLabel(); /* a space for the snapped content will be allocated and can lead to title misalignment */
            this.oWeightModel.setProperty("/Filter/text", this.getFormattedSummaryText(aFilterCriterias));
        },

        addSnappedLabel: function () {
            var oSnappedLabel = this.getSnappedLabel();
            oSnappedLabel.attachBrowserEvent("click", this.onToggleHeader, this);
            this.getPageTitle().addSnappedContent(oSnappedLabel);
        },

        removeSnappedLabel: function () {
            this.getPageTitle().destroySnappedContent();
        },

        getFilters: function (aCurrentFilterValues) {
            this.aFilters = [];

            this.aFilters = this.aKeys.map(function (sCriteria, i) {
                return new Filter(sCriteria, FilterOperator.Contains, aCurrentFilterValues[i]);
            });

            return this.aFilters;
        },
        getFilterCriteria: function (aCurrentFilterValues) {
            return this.aKeys.filter(function (el, i) {
                if (aCurrentFilterValues[i] !== "") {
                    return el;
                }
            });
        },
        getFormattedSummaryText: function (aFilterCriterias) {
            if (aFilterCriterias.length > 0) {
                return "Filtered By (" + aFilterCriterias.length + "): " + aFilterCriterias.join(", ");
            } else {
                return "Filtered by None";
            }
        },
        getTable: function () {
            return this.getView().byId("idWeightTable");
        },
        getTableItems: function () {
            return this.getTable().getBinding("items");
        },
        getSelect: function (sId) {
            return this.getView().byId(sId);
        },
        getSelectedItemText: function (oSelect) {
            return oSelect.getSelectedItem() ? oSelect.getSelectedItem().getKey() : "";
        },
        getPage: function () {
            return this.getView().byId("dynamicPageId");
        },
        getPageTitle: function () {
            return this.getPage().getTitle();
        },
        getSnappedLabel: function () {
            return new Label({
                text: "{/Filter/text}"
            });
        },

        onSortPressed: function () {
			this.getViewSettingsDialog("SmartFloor.AssembleWeight.view.SortDialog")
				.then(function (oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},
        getViewSettingsDialog: function (sDialogFragmentName) {
			var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!pDialog) {
				pDialog = Fragment.load({
					id: this.getView().getId(),
					name: sDialogFragmentName,
					controller: this
				}).then(function (oDialog) {
					if (Device.system.desktop) {
						oDialog.addStyleClass("sapUiSizeCompact");
					}
					return oDialog;
				});
				this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
			}
			return pDialog;
		},        
        handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("idWeightTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

    });

});
