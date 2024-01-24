sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
],
  function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("yodata1.controller.main", {
      onInit: function () {
        // Get the view
        var that = this;
        var oView = this.getView();

        // Get the OData model bound to the view
        var oODataModel = this.getOwnerComponent().getModel();  //working best, do this always 

        // Check if the model is defined before attaching the event
        if (!oODataModel) {
          debugger; console.error("OData model is undefined");
        };

        // Create a JSON model instance
        var oJSONModel = new JSONModel();

        // Read the data from the OData model
        oODataModel.read("/ZI_NODES", {
          success: function (oData, oResponse) {
            // Set the OData data to the JSON model
            //oJSONModel.setData(oData);
            var flatData = oData;
            flatData.results.sort(function (a, b) {
              // Convert NodeLevel to numbers for proper numeric comparison
              var levelA = parseInt(a.NodeLevel, 10);
              var levelB = parseInt(b.NodeLevel, 10);

              // Compare NodeLevel values
              if (levelA < levelB) {
                return -1;
              } else if (levelA > levelB) {
                return 1;
              } else {
                return 0;
              }
            });

            var deepData = that.transformTreeData(flatData);
            that.setModelData(deepData);
          },
          error: function (oError) {
            // Handle error
            debugger; console.error("Error reading data from OData service:", oError);
          }
        });

      },

      transformTreeData: function (nodesIn) {
        var nodes = [];		//'deep' object structure
        var nodeMap = {};	//'map', each node is an attribute

        if (nodesIn) {
          var nodeOut;
          var parentId;
          for (var i = 0; i < nodesIn.results.length; i++) {
            var nodeIn = nodesIn.results[i];
            nodeOut = {
              id: nodeIn.NodeKey,
              text: nodeIn.NodeDescription,
              //                        type: nodeIn.NodeType,
              children: []
            };
            parentId = nodeIn.NodeParentKey;
            if (parentId && parentId.length > 0 && nodeIn.NodeKey !== nodeIn.NodeParentKey) {
              //we have a parent, add the node there
              //NB because object references are used, changing the node
              //in the nodeMap changes it in the nodes array too
              //(we rely on parents always appearing before their children)
              var parent = nodeMap[nodeIn.NodeParentKey];
              if (parent) {
                parent.children.push(nodeOut);
              }
            } else {
              //there is no parent, must be top level
              nodes.push(nodeOut);
            }

            //add the node to the node map, which is a simple 1-level list of all nodes
            nodeMap[nodeOut.id] = nodeOut;
          }
        }
        return nodes;
      },

      setModelData: function (nodes) {
        //store the nodes in the JSON model, so the view can access them
        var nodesModel = new sap.ui.model.json.JSONModel();
        nodesModel.setData({ nodeRoot: { children: nodes } });
        this.getView().setModel(nodesModel, "nodeModel");
      }

    });
  });
