onExcelPress2: function () {
    var context = this;
    var aCols, oSettings, oSheet;	
    var data =this.getView().getModel('WEIGHT').getProperty("/");
    debugger;
    var filteredData=data;
    var oCurrentCOntext=context.getView().byId("idProductsTable").getBinding("items").getContexts();
    var aServices = [];
    for (var iCounter = 0; iCounter < oCurrentCOntext.length; iCounter++){
        var b = oCurrentCOntext[iCounter];
        var c = b.getPath();
        var d = this.getView().getModel("WEIGHT").getObject(c);
        aServices.push(d);
    }
    aCols = this.createColumnConfig();
    oSettings = {
        workbook: {
            columns: aCols
        },
        fileName: 'xxx.xlsx',
        dataSource: aServices
    };
    oSheet = new Spreadsheet(oSettings);
    oSheet.build()
        .then(function () {
            MessageToast.show(context.getResourceBundle().getText("downloadComp"));
        })
        .finally(function () {
            oSheet.destroy();
        });
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
        aWegihtData[i].ASSET_TYPE];
    }

    var pdfdoc = new jsPDF("p", "pt");
    pdfdoc.autoTable(columns, data);
    MessageToast.show('PDF being exported');
    pdfdoc.save("Assembly Weight.pdf");
},