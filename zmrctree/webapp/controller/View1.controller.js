sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, JSONModel, MessageToast, Filter, FilterOperator) {
        "use strict";
        var oWaitingDialog;
        var bWaitingForPaste = false; // Flag to indicate whether waiting for paste

        return Controller.extend("zmrctree.controller.View1", {
            onInit: function () {

                //////////////////////////////////////////////////////////
                setTimeout(function () {
                    this.expandSelectedNode();
                }.bind(this), 0);
                //////////////////////////////////////////////////////////

                // Get the view
                var that = this;
                var oView = this.getView();

                //size Model
                var oSizeModel = new JSONModel("../test/Size.json");
                this.getView().setModel(oSizeModel, "sizes");

                // general Model 
                var oGeneralModel = new JSONModel({
                    collapseExpandState: true, // set the initial 
                    editModeAllLines: false, // set the initial edit mode  
                    editModeSingleLine: false, // only single line     
                    firstLevelState: true, //
                    expandNodeState: false,
                    columnRemoveState: true,

                });
                this.getView().setModel(oGeneralModel, "generalModel");

                // Get the OData model bound to the view
                var oODataModel = this.getOwnerComponent().getModel();  //working best, do this always 

                // Check if the model is defined before attaching the event
                if (!oODataModel) {
                    debugger; console.error("OData model is undefined");
                };

                // Create a JSON model instance
                var oJSONModel = new JSONModel();
                oJSONModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

                // Read the data from the OData model
                oODataModel.read("/ZI_NODES", {
                    success: function (oData, oResponse) {
                        // Set the OData data to the JSON model
                        // oJSONModel.setData(oData);
                        // Sort the flatData array by NodeLevel
                        oData.results.sort(function (a, b) {
                            var levelA = parseInt(a.NodeLevel, 10);
                            var levelB = parseInt(b.NodeLevel, 10);
                            if (levelA < levelB) {
                                return -1;
                            } else if (levelA > levelB) {
                                return 1;
                            } else {
                                return 0;
                            }
                        });

                        var deepData = that.transformTreeData(oData);

                        deepData.sort(function (a, b) {
                            var textA = a.text.toUpperCase(); // ignore case during sorting
                            var textB = b.text.toUpperCase();
                            if (textA < textB) {
                                return -1;
                            }
                            if (textA > textB) {
                                return 1;
                            }
                            return 0; // names must be equal
                        });
                        that.setModelData(deepData);
                    },

                    error: function (oError) {
                        debugger; console.error("Error reading data from OData service:", oError);
                    }
                });

                this._aClipboardData = [];



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
                            level: nodeIn.NodeLevel,
                            id: nodeIn.NodeKey,
                            parentKey: nodeIn.NodeParentKey,
                            code: nodeIn.NodeCode,
                            text: nodeIn.NodeDescription,
                            size: nodeIn.NodeSize,
                            dimension: nodeIn.NodeDimension,
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
            },



            onToggleExpand: function () {
                // Toggle the collapseExpandState
                var oGeneralModel = this.getView().getModel("generalModel");
                var bCollapseExpandState = !oGeneralModel.getProperty("/collapseExpandState");

                // Set the new state
                oGeneralModel.setProperty("/collapseExpandState", bCollapseExpandState);

                // Log the current state
                console.log("Collapse/Expand state toggled. Current state:", bCollapseExpandState);

                // Update button text based on the new state
                var oToggleButton = this.byId("toggleExpandButton");
                if (oToggleButton) {
                    oToggleButton.setText(bCollapseExpandState ? "Expand" : "Collapse");
                }

                // Perform the corresponding action based on the state
                var oTreeTable = this.byId("TreeTable");
                if (bCollapseExpandState) {
                    oTreeTable.collapseAll();
                } else {
                    oTreeTable.expandToLevel(10);
                }
            },
            onExpandSecondLevel: function () {
                // Toggle the firstLevelState
                var oGeneralModel = this.getView().getModel("generalModel");
                var bFirstLevelState = !oGeneralModel.getProperty("/firstLevelState");

                // Set the new state
                oGeneralModel.setProperty("/firstLevelState", bFirstLevelState);

                // Update button text based on the new state
                var oToggleButton = this.byId("secondLevelExpandButton");
                if (oToggleButton) {
                    oToggleButton.setText(bFirstLevelState ? "Second Level" : "Collapse");
                }

                // Perform the corresponding action based on the state
                var oTreeTable = this.byId("TreeTable");
                if (bFirstLevelState) {
                    oTreeTable.collapseAll();
                } else {
                    oTreeTable.expandToLevel(1);
                }

            },


            onDragStart: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                var oDragSession = oEvent.getParameter("dragSession");
                var oDraggedRow = oEvent.getParameter("target");
                var iDraggedRowIndex = oDraggedRow.getIndex();
                var aSelectedIndices = oTreeTable.getSelectedIndices();
                var aDraggedRowContexts = [];

                if (aSelectedIndices.length > 0) {
                    // If rows are selected, do not allow to start dragging from a row which is not selected.
                    if (aSelectedIndices.indexOf(iDraggedRowIndex) === -1) {
                        oEvent.preventDefault();
                    } else {
                        for (var i = 0; i < aSelectedIndices.length; i++) {
                            aDraggedRowContexts.push(oTreeTable.getContextByIndex(aSelectedIndices[i]));
                        }
                    }
                } else {
                    aDraggedRowContexts.push(oTreeTable.getContextByIndex(iDraggedRowIndex));
                }

                oDragSession.setComplexData("hierarchymaintenance", {
                    draggedRowContexts: aDraggedRowContexts
                });
            },

            onDrop: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                var oDragSession = oEvent.getParameter("dragSession");
                var oDroppedRow = oEvent.getParameter("droppedControl");
                var aDraggedRowContexts = oDragSession.getComplexData("hierarchymaintenance").draggedRowContexts;
                var oNewParentContext = oTreeTable.getContextByIndex(oDroppedRow.getIndex());

                if (aDraggedRowContexts.length === 0 || !oNewParentContext) {
                    return;
                }

                var oModel = oTreeTable.getBinding().getModel();
                var oNewParent = oNewParentContext.getProperty();

                // In the JSON data of this example the children of a node are inside an array with the name "children".
                if (!oNewParent.children) {
                    oNewParent.children = []; // Initialize the children array.
                }

                for (var i = 0; i < aDraggedRowContexts.length; i++) {
                    if (oNewParentContext.getPath().indexOf(aDraggedRowContexts[i].getPath()) === 0) {
                        // Avoid moving a node into one of its child nodes.
                        continue;
                    }

                    // Copy the data to the new parent.
                    oNewParent.children.push(aDraggedRowContexts[i].getProperty());

                    // Remove the data. The property is simply set to undefined to preserve the tree state (expand/collapse states of nodes).
                    oModel.setProperty(aDraggedRowContexts[i].getPath(), undefined, aDraggedRowContexts[i], true);
                }
            },

            onSaveAll: function (oEvent) {
                MessageToast.show("Node Hierarchy is being persisted to backend");
            },

            onOpenWebPage: function (oEvent) {
                // Get the selected row context or any other logic based on your requirement
                var oRowContext = oEvent.getSource().getBindingContext("nodeModel");

                // Get the data from the context
                var oData = oRowContext.getProperty();

                // Assuming the URL is in a property called 'webPageURL' in your data
                var sWebPageURL = oData.webPageURL;

                // Open the web page in a new window or tab
                window.open('https://089b04d5-c34c-49d4-80b9-96228076931c.abap-web.us10.hana.ondemand.com/sap/bc/ui5_ui5/sap/zcmrc2_0104/index.html', "_blank");
            },

            onToggleEdit: function () {
                // Toggle the general edit mode
                var oGeneralModel = this.getView().getModel("generalModel");
                var bEditModeAllLines = !oGeneralModel.getProperty("/editModeAllLines");

                oGeneralModel.setProperty("/editModeAllLines", !oGeneralModel.getProperty("/editModeAllLines"));

                // Refresh the nodeModel to update the bindings
                this.getView().getModel("nodeModel").refresh(true);
            },

            onDimensionLiveChange: function (oEvent) {
                var oInput = oEvent.getSource();
                var sNewValue = oInput.getValue();

                // Get the binding context of the Input field
                var oContext = oInput.getBindingContext("nodeModel");

                // Check if the context is available
                if (oContext) {
                    // Get the binding path dynamically based on the context
                    var sDimensionPath = oContext.getPath("dimension");

                    // Set the new value in the model
                    oContext.getModel().setProperty(sDimensionPath, sNewValue);
                }
            },

            onSizeLiveChange: function (oEvent) {
                var oSelect = oEvent.getSource();
                var sNewValue = oSelect.getSelectedKey();

                // Get the binding context of the Select field
                var oContext = oSelect.getBindingContext("nodeModel");

                // Check if the context is available
                if (oContext) {
                    // Get the binding path dynamically based on the context
                    var sSizePath = oContext.getPath("size");

                    // Set the new value in the model
                    oContext.getModel().setProperty(sSizePath, sNewValue);
                }
            },

            onSelectChange: function (oEvent) {
                MessageToast.show("change event fired! \n Selected Item id: " + oEvent.getParameters().selectedItem.sId
                    + "\n Previously Selected Item id: " + oEvent.getParameters().previousSelectedItem.sId);
            },

            onSelectLiveChange: function (oEvent) {
                MessageToast.show("liveChange event fired! \n Selected item id: " + oEvent.getParameters().selectedItem.sId);
            },

            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("query");

                // Use EQ (Equals) operator for exact match
                var oFilterText = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sValue);
                var oFilterCode = new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sValue);
                var oFilterId = new sap.ui.model.Filter("id", sap.ui.model.FilterOperator.EQ, sValue);

                // Combine filters with OR operator
                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: [oFilterText, oFilterCode, oFilterId],
                    and: false // This is important to use OR instead of AND
                });

                // Apply the combined filter to the TreeTable
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");
                oBinding.filter([oCombinedFilter]);
            },

            onLiveChange: function (oEvent) {
                var sValue = oEvent.getParameter("newValue");
                var oFilter = new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sValue);

                // Apply the filter to the TreeTable
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");
                oBinding.filter([oFilter]);
            },

            onCopy: function (oEvent) {
                this._handleClipboard("copy");
            },

            onCancelCopy: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                var oModel = oTreeTable.getBinding().getModel();
                // Reset the flag after paste is complete
                this._aClipboardData = [];
                this._setPasteButtonsEnabled(false);
                oModel.refresh();
                oTreeTable.clearSelection();

                if (bWaitingForPaste) {
                    bWaitingForPaste = false;
                    // Remove the CSS class from the copied rows
                    var aAllRows = oTreeTable.getRows();
                    for (var i = 0; i < aAllRows.length; i++) {
                        aAllRows[i].removeStyleClass("copiedRow");
                    }
                }
            },

            onPasteTree: function (oEvent) {
                this._handleClipboard("pasteTree");
            },

            onPasteSelect: function (oEvent) {
                this._handleClipboard("pasteSelect");
            },

            _handleClipboard: function (operation) {
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();
                var iSelectedIndex = aSelectedIndices[0];

                if (aSelectedIndices.length !== 1 && operation !== "copy") {
                    MessageToast.show("Select exactly one row first.");
                    return;
                }

                var oModel = oTreeTable.getBinding().getModel();
                var oNewParentContext = oTreeTable.getContextByIndex(iSelectedIndex);
                var oNewParent = oNewParentContext.getProperty();

                if (operation === "copy") {
                    this._aClipboardData = [];

                    if (aSelectedIndices.length === 0) {
                        MessageToast.show("Select at least one row first.");
                        return;
                    }

                    // Set the flag to indicate waiting for paste
                    bWaitingForPaste = true;

                    // Copy the data.
                    for (var i = 0; i < aSelectedIndices.length; i++) {
                        var oContext = oTreeTable.getContextByIndex(aSelectedIndices[i]);
                        var oData = oContext.getProperty();

                        // Create a shallow copy of the original node
                        var copiedData = JSON.parse(JSON.stringify(oData));

                        // Make changes to the properties of the copied node                        
                        copiedData.text = "Copy from " + copiedData.code;

                        this._aClipboardData.push(copiedData);

                        // Add a CSS class to the selected row for styling
                        var oRow = oTreeTable.getRows()[aSelectedIndices[i]];
                        oRow.addStyleClass("copiedRow");
                    }

                    if (this._aClipboardData.length > 0) {
                        oTreeTable.clearSelection();
                        this._setPasteButtonsEnabled(true);
                        // Show a message indicating that the system is waiting for the paste operation
                        MessageToast.show("System is waiting for your paste to complete the copy");
                    }
                } else {
                    //pasteSelect or pasteTree 

                    var aCopiedData = this._aClipboardData.map(function (item) {
                        // Create a shallow copy
                        var copiedItem = Object.assign({}, item);
                        // Remove children from the copied item
                        copiedItem.children = [];
                        return copiedItem;
                    });

                    // Paste the data to the new parent.
                    oNewParent.children = (operation === "pasteTree") ? oNewParent.children.concat(this._aClipboardData) : oNewParent.children.concat(aCopiedData);
                    MessageToast.show("Paste is complete");

                    // Reset the flag after paste is complete
                    this._aClipboardData = [];
                    this._setPasteButtonsEnabled(false);
                    oModel.refresh();
                    oTreeTable.clearSelection();

                    if (bWaitingForPaste) {
                        bWaitingForPaste = false;
                        // Remove the CSS class from the copied rows
                        var aAllRows = oTreeTable.getRows();
                        for (var i = 0; i < aAllRows.length; i++) {
                            aAllRows[i].removeStyleClass("copiedRow");
                        }
                    }

                    // Expand the selected node 
                    oTreeTable.expand(iSelectedIndex);

                    // Ensure the data is updated before expanding
                    oModel.refresh();

                    // Attach an event handler to expand after the update
                    // oTreeTable.attachEventOnce("updateFinished", function() {
                    //  oTreeTable.expand(iSelectedIndex);
                    //});
                }
            },

            // _resetClipboard: function () {
            //     // Reset the flag after paste is complete
            // },

            _setPasteButtonsEnabled: function (enabled) {
                this.byId("paste").setEnabled(enabled);
                this.byId("pasteTree").setEnabled(enabled);
                this.byId("pasteSelect").setEnabled(enabled);
                this.byId("cancelCopy").setEnabled(enabled);
            },


            onDelete: function () {
                var oTreeTable = this.byId("TreeTable");
                var oModel = oTreeTable.getBinding().getModel();

                var aSelectedIndices = oTreeTable.getSelectedIndices();
                if (aSelectedIndices.length === 0) {
                    MessageToast.show("Select at least one row first.");
                    return;
                }

                // Get the root node
                var oRootContext = oModel.getContext("/nodeRoot");
                var aRootChildren = oRootContext.getProperty("children");

                // Remove the selected rows from the root children array
                for (var i = aSelectedIndices.length - 1; i >= 0; i--) {
                    var oContext = oTreeTable.getContextByIndex(aSelectedIndices[i]);
                    var oNode = oContext.getProperty();
                    this.removeFromParentChildren(aRootChildren, oNode);
                }

                // Refresh the model to update the UI
                oModel.refresh();
            },

            removeFromParentChildren: function (aChildren, oNodeToRemove) {
                for (var i = 0; i < aChildren.length; i++) {
                    if (aChildren[i] === oNodeToRemove) {
                        // Remove the node from the parent's children array
                        aChildren.splice(i, 1);
                        return;
                    }
                    if (aChildren[i].children) {
                        // Recursively check the node's children
                        this.removeFromParentChildren(aChildren[i].children, oNodeToRemove);
                    }
                }
            },

            // Helper function to find the parent node in the tree structure
            findParentNode: function (nodes, targetNode) {
                for (var i = 0; i < nodes.length; i++) {
                    var currentNode = nodes[i];

                    // Check if the target node is a child of the current node
                    if (currentNode.children && currentNode.children.includes(targetNode)) {
                        return currentNode;
                    }

                    // Recursively search in the children nodes
                    var parent = this.findParentNode(currentNode.children, targetNode);
                    if (parent) {
                        return parent;
                    }
                }

                return null; // Not found
            },

            onInsert: function () {
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();
                var iSelectedIndex = aSelectedIndices[0];

                if (aSelectedIndices.length !== 1) {
                    MessageToast.show("Select exactly one row first.");
                    return;
                }

                var oModel = oTreeTable.getBinding().getModel();
                var oSelectedRowContext = oTreeTable.getContextByIndex(iSelectedIndex);
                var oSelectedNode = oSelectedRowContext.getProperty();
                var iSelectedRowIndex = oSelectedNode.level;

                // Increment the level for the new row
                var iNewRowLevel = iSelectedRowIndex;

                // Create the new row data
                var oNewRowData = {
                    level: iNewRowLevel,
                    id: "<to be generated when saving>",
                    parentKey: "<to be assigned when saving>",
                    code: "New Code",
                    text: "New Node Text",
                    size: "",
                    dimension: "",
                    children: [],
                    editModeforNew: true
                };

                // Find the one level up parent node
                var oParentNode = this.findParentNode(oModel.getData().nodeRoot.children, oSelectedNode);

                // If the parent node is null, it means the selected node is at the root level
                if (!oParentNode) {
                    // Insert the new row data at the root level
                    oModel.getData().nodeRoot.children.splice(iSelectedIndex + 1, 0, oNewRowData);
                } else {
                    // Insert the new row data at the same level
                    oParentNode.children.splice(iSelectedIndex + 1, 0, oNewRowData);
                }

                // Refresh the model to update the UI
                oModel.refresh();
                oTreeTable.clearSelection();

                // Set the editModeAllLines property in your model
                var oGeneralModel = this.getView().getModel("generalModel");
                oGeneralModel.setProperty("/editModeforNew", true);

                // Expand the newly added row to show it in Edit mode
                oTreeTable.expand(iSelectedIndex);
            },

            onAppend: function () {
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();
                var iSelectedIndex = aSelectedIndices[0];
                if (aSelectedIndices.length !== 1) {
                    MessageToast.show("Select exactly one row first.");
                    return;
                }

                var oModel = oTreeTable.getBinding().getModel();
                var oSelectedRowContext = oTreeTable.getContextByIndex(iSelectedIndex);
                var iSelectedRowLevel = parseInt(oSelectedRowContext.getProperty("level"));

                // Increment the level for the new row
                var iNewRowLevel = iSelectedRowLevel + 1;

                var oNewRowContext = oTreeTable.getContextByIndex(iSelectedIndex);
                var oNewRowData = {
                    // Set the initial values for the new row
                    level: iNewRowLevel,
                    id: "<to be generated when saving>",
                    parentKey: "<to be assigned when saving>",
                    code: "New Code",
                    text: "New Node Text",
                    size: "",
                    dimension: "",
                    children: [],
                    editModeforNew: true
                };

                // In the JSON data of this example, the children of a node are inside an array with the name "children".
                if (!oNewRowContext.getProperty("children")) {
                    oNewRowContext.getProperty("children") = []; // Initialize the children array.
                }

                // Add the new row data to the selected parent.
                oNewRowContext.getProperty("children").push(oNewRowData);

                // Refresh the model to update the UI
                oModel.refresh();
                oTreeTable.clearSelection();

                // Set the editModeAllLines property in your model
                var oGeneralModel = this.getView().getModel("generalModel");
                oGeneralModel.setProperty("/editModeforNew", true);

                // Expand the newly added row to show it in Edit mode
                oTreeTable.expand(iSelectedIndex);

            },

            onFocus2: function () {
                // Get the selected row context
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var oSelectedRowContext = oTreeTable.getContextByIndex(aSelectedIndices[0]);
                    var oSelectedNode = oSelectedRowContext.getProperty();

                    // Set the filtered data to show only the selected node
                    this.filterData([oSelectedNode]);
                }
            },

            filterData: function (aSelectedNodes) {
                // Filter the data to show only the selected nodes
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");

                // Extract the unique identifiers of the selected nodes
                var aSelectedIds = this.extractNodeIds(aSelectedNodes);

                // Create an array of filters for each selected ID
                var aFilters = aSelectedIds.map(function (sId) {
                    return new sap.ui.model.Filter({
                        path: "id",
                        operator: "EQ",
                        value1: sId
                    });
                });

                // Combine filters with OR operator
                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false // This is important to use OR instead of AND
                });

                // Apply the combined filter to the binding
                oBinding.filter([oCombinedFilter]);
            },

            onResetFocus: function () {
                // Reset the filter to show all nodes
                this.resetFilter();
            },

            collectNodeAndChildren: function (oNode) {
                // Recursive function to collect the selected node and its children
                var oCopiedNode = Object.assign({}, oNode);

                if (oNode.children && oNode.children.length > 0) {
                    oCopiedNode.children = [];
                    for (var i = 0; i < oNode.children.length; i++) {
                        oCopiedNode.children.push(this.collectNodeAndChildren(oNode.children[i]));
                    }
                }

                return oCopiedNode;
            },

            collectNodeAndChildren_single: function (oNode) {
                // Return only the selected node without its children
                return { id: oNode.id };
            },

            // Add this method to extract node IDs
            extractNodeIds: function (aNodes) {
                // Recursive function to extract the unique identifiers of selected nodes
                var aIds = [];

                for (var i = 0; i < aNodes.length; i++) {
                    var oNode = aNodes[i];
                    aIds.push(oNode.id);

                    if (oNode.children && oNode.children.length > 0) {
                        aIds = aIds.concat(this.extractNodeIds(oNode.children));
                    }
                }

                return aIds;
            },

            resetFilter: function () {
                // Reset the filter to show all nodes
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");
                oBinding.filter([]);

                // Refresh the TreeTable to trigger re-rendering
                oTreeTable.invalidate();
            },


            expandAllNodes: function (oNodeContext) {
                var oTreeTable = this.byId("TreeTable");
                var oNode = oNodeContext.getObject();
                var oCopiedNode = this.collectNodeAndChildren(oNode);

                this.expandNodeAndChildren(oCopiedNode);
            },


            expandNodeAndChildren: function (oNodeContext) {
                if (!oNodeContext) {
                    return;
                }

                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");

                // Get the index from the context path
                var sPath = oNodeContext.getPath();
                if (!sPath) {
                    return;
                }

                var iIndex = parseInt(sPath.split("/").pop(), 10);

                // Expand the current node
                oBinding.expand(sPath);

                // Recursively expand its children
                var oNode = oNodeContext.getObject();
                if (oNode.children && oNode.children.length > 0) {
                    for (var i = 0; i < oNode.children.length; i++) {
                        // Calculate the child index with hierarchy level
                        var iChildIndex = iIndex + 1 + this.calculateHierarchyLevel(oNodeContext, i);

                        var oChildContext = oTreeTable.getContextByIndex(iChildIndex);
                        this.expandNodeAndChildren(oChildContext);
                    }
                }
            },

            calculateHierarchyLevel: function (oNodeContext, iChildIndex) {
                var oTreeTable = this.byId("TreeTable");

                // Get the current node's level
                var iLevel = oNodeContext ? oNodeContext.getLevel() : 0;

                // Calculate the total index considering hierarchy levels
                for (var i = 0; i < iChildIndex; i++) {
                    var oContext = oTreeTable.getContextByIndex(i);

                    // Check if the context is available and has the same level
                    if (oContext && oContext.getLevel() === iLevel) {
                        i++;
                    }
                }

                return i;
            },


            onExpandNode: function () {

                // Toggle the expandNodeState
                var oGeneralModel = this.getView().getModel("generalModel");
                var bExpandNodeState = !oGeneralModel.getProperty("/expandNodeState");

                // Set the new state
                oGeneralModel.setProperty("/expandNodeState", bExpandNodeState);

                // Update button text based on the new state
                var oToggleButton = this.byId("expandNodeButton");
                if (oToggleButton) {
                    oToggleButton.setText(!bExpandNodeState ? "Expand Node" : "Collapse");
                }

                // Perform the corresponding action based on the state
                var oTreeTable = this.byId("TreeTable");
                if (bExpandNodeState) {

                    var aSelectedIndices = oTreeTable.getSelectedIndices();
                    if (aSelectedIndices.length !== 1) {
                        MessageToast.show("Select exactly one row first.");
                        // revert the state
                        oGeneralModel.setProperty("/expandNodeState", !bExpandNodeState);
                        oToggleButton.setText(bExpandNodeState ? "Expand Node" : "Collapse");
                        return;
                    }
                    var iSelectedIndex = aSelectedIndices[0];
                    var oSelectedContext = oTreeTable.getContextByIndex(iSelectedIndex);
                    var oSelectedNode = oSelectedContext.getProperty();

                    // Expand the selected node and its children
                    oTreeTable.expand(iSelectedIndex);

                    // Recursively expand all nodes starting from the selected node
                    this.expandAllNodes(oSelectedNode, oTreeTable, iSelectedIndex);
                } else {
                    oTreeTable.collapseAll();
                }

            },

            expandAllNodes: function (oNode, oTreeTable, iParentIndex) {
                if (oNode.children && oNode.children.length > 0) {
                    for (var i = 0; i < oNode.children.length; i++) {
                        var oChildNode = oNode.children[i];
                        var iChildIndex = iParentIndex + i + 1;

                        oTreeTable.expand(iChildIndex); // Expand the direct child
                        this.expandAllNodes(oChildNode, oTreeTable, iChildIndex); // Recursively expand sub-nodes
                    }
                }
            },


            onFocus: function () {
                // Get the selected row context
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var oSelectedRowContext = oTreeTable.getContextByIndex(aSelectedIndices[0]);
                    var oSelectedNode = oSelectedRowContext.getProperty();

                    // Set the filtered data to show only the selected node
                    this.filterData([oSelectedNode]);

                    // Expand the selected node and its children after filtering with a delay
                    setTimeout(function () {
                        var iSelectedIndex = aSelectedIndices[0];
                        this.expandSelectedNodeAndChildren(oSelectedNode, oTreeTable, iSelectedIndex);
                    }.bind(this), 0);
                }
            },


            onToggleRemoveColumn2: function () {

                var oTreeTable = this.byId("yourTreeTableId"); // Replace with your TreeTable ID
                var iColumnIndexToRemove = 4; // Index of the column to remove

                // Check if the column is already removed
                var bColumnRemoved = oTreeTable.indexOfColumn(oTreeTable.getColumns()[iColumnIndexToRemove]) !== -1;

                // Toggle removal state
                var bRemoveColumn = !bColumnRemoved;

                if (bRemoveColumn) {
                    // Remove the column
                    var oRemovedColumn = oTreeTable.removeColumn(oTreeTable.getColumns()[iColumnIndexToRemove]);
                } else {
                    // Restore the column
                    oTreeTable.addColumn(oTreeTable.getColumns()[iColumnIndexToRemove], iColumnIndexToRemove);
                }

                // Update the TreeTable binding if needed
                // oTreeTable.bindRows({
                //    path: "/yourBindingPath", // Replace with your binding path
                //    parameters: {
                //       arrayNames: ["children"]
                //    }
                // });
            },

            onToggleRemoveColumn: function () {
                var oView = this.getView();
                var oTreeTable = oView.byId("TreeTable");
                var oGeneralModel = this.getView().getModel("generalModel");
            
                // Toggle the columnRemoveState
                var bColumnRemoveState = oGeneralModel.getProperty("/columnRemoveState");
            
                if (bColumnRemoveState) {
                    // Remove columns 2 and 5
                    oTreeTable.removeColumn(oTreeTable.getColumns()[2]);
                    oTreeTable.removeColumn(oTreeTable.getColumns()[4]); 
                } else {
                    // Restore columns 2 and 5
                    var oColumn2ToRestore = new sap.ui.table.Column({
                        label: new sap.m.Label({text: "Key"}),
                        template: new sap.m.Text().bindProperty("text", "nodeModel>id"),
                        width: "13rem"
                    });
            
                    var oColumn5ToRestore = new sap.ui.table.Column({
                        label: new sap.m.Label({text: "Parent"}),
                        template: new sap.m.Text().bindProperty("text", "nodeModel>parentKey"),
                        width: "10rem"
                    });
            
                    oTreeTable.insertColumn(oColumn2ToRestore, 2);
                    oTreeTable.insertColumn(oColumn5ToRestore, 5); 
                }
            
                // Set the new state
                oGeneralModel.setProperty("/columnRemoveState", !bColumnRemoveState);
            
                // Update button text based on the new state
                var oToggleButton = this.byId("removeColumnButton");
                if (oToggleButton) {
                    oToggleButton.setText(!bColumnRemoveState ? "Remove Keys" : "Restore");
                }
            },
            
            



            //////////////////////////////////////////////////////

            onAfterRendering: function () {
                this.expandSelectedNode();
            },




            onAfterRendering2: function () {
                // Get the selected row context
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var oSelectedRowContext = oTreeTable.getContextByIndex(aSelectedIndices[0]);
                    var oSelectedNode = oSelectedRowContext.getProperty();

                    // Set the filtered data to show only the selected node
                    this.filterData([oSelectedNode]);

                    // Expand the selected node and its children after rendering
                    this.expandSelectedNodeAndChildren(oSelectedNode, oTreeTable, aSelectedIndices[0]);
                }
            },

            expandSelectedNodeAndChildren: function (oNode, oTreeTable, iParentIndex) {
                if (oNode.children && oNode.children.length > 0) {
                    for (var i = 0; i < oNode.children.length; i++) {
                        var oChildNode = oNode.children[i];
                        var iChildIndex = iParentIndex + i + 1;

                        oTreeTable.expand(iChildIndex); // Expand the direct child after rendering

                        this.expandSelectedNodeAndChildren(oChildNode, oTreeTable, iChildIndex); // Recursively expand sub-nodes
                    }
                }
            },


            onBindingUpdateStarted: function () {
                var oTreeTable = this.byId("TreeTable");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var iSelectedIndex = aSelectedIndices[0];
                    var oSelectedContext = oTreeTable.getContextByIndex(iSelectedIndex);
                    var oSelectedNode = oSelectedContext.getProperty();

                    // Expand the selected node and its children
                    oTreeTable.expand(iSelectedIndex);
                    this.expandAllNodes(oSelectedNode, oTreeTable, iSelectedIndex);
                }

                // Detach the event after it has been triggered
                oBinding.detachEvent("updateStarted", this.onBindingUpdateStarted, this);
            },


            handleDataReceived: function (oTreeTable) {
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var iSelectedIndex = aSelectedIndices[0];
                    var oSelectedContext = oTreeTable.getContextByIndex(iSelectedIndex);
                    var oSelectedNode = oSelectedContext.getProperty();

                    // Expand the selected node and its children
                    oTreeTable.expand(iSelectedIndex);
                    this.expandAllNodes(oSelectedNode, oTreeTable, iSelectedIndex);
                }
            },

            expandSelectedNode2: function () {
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var iSelectedIndex = aSelectedIndices[0];
                    var oSelectedContext = oTreeTable.getContextByIndex(iSelectedIndex);
                    var oSelectedNode = oSelectedContext.getProperty();

                    // Expand the selected node and its children
                    oTreeTable.expand(iSelectedIndex);
                    this.expandAllNodes(oSelectedNode, oTreeTable, iSelectedIndex);
                }
            },

            expandSelectedNode: function () {
                var oTreeTable = this.byId("TreeTable");
                var oBinding = oTreeTable.getBinding("rows");
                var aSelectedIndices = oTreeTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    // Get the selected node
                    var iSelectedIndex = aSelectedIndices[0];
                    var oSelectedContext = oTreeTable.getContextByIndex(iSelectedIndex);
                    var oSelectedNode = oSelectedContext.getProperty();

                    // Expand the selected node and its children
                    oTreeTable.expand(iSelectedIndex);
                    this.expandAllNodes(oSelectedNode, oTreeTable, iSelectedIndex);
                }
            },









        });
    });