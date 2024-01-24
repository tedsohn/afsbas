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
                    editModeSingleLine: false // only single line       
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
                            code: nodeIn.NodeCode,
                            text: nodeIn.NodeDescription,
                            size: nodeIn.NodeSize,
                            dimension: nodeIn.NodeDimension,
                            sizeDisplay: nodeIn.NodeSizeDisplay,
                            dimensionDisplay: nodeIn.NodeDimensionDisplay,
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

            onExpandFirstLevel: function () {
                var oTreeTable = this.byId("TreeTable");
                //set the first level to expanded
                oTreeTable.getRows().forEach(function (row, index) {
                    if (row.getLevel() === 1) {
                        oTreeTable.expand(index);
                    }
                });
            },

            onToggleExpand: function () {
                //switch the expand/collapse state of the whole tree
                var oTreeTable = this.byId("TreeTable");
                var nodesModel = this.getView().getModel("nodeModel");
                var nodesData = nodesModel.getData();
                var collapseExpandState = nodesData.nodeRoot.collapseExpandState;
                if (collapseExpandState) {
                    oTreeTable.collapseAll();
                } else {
                    oTreeTable.expandToLevel(99);
                }
                nodesData.nodeRoot.collapseExpandState = !collapseExpandState;
                nodesModel.refresh();
            },

            onDragStart: function (oEvent) {
                var oDraggedRow = oEvent.getParameter("target");
                oEvent.getParameter("dragSession").setComplexData("draggedRow", oDraggedRow);
            },

            onDrop: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                var oDragSession = oEvent.getParameter("dragSession");
                var oDraggedRow = oDragSession.getComplexData("draggedRow");
                var oDroppedRow = oEvent.getParameter("droppedControl");
                var sDropPosition = oEvent.getParameter("dropPosition");

                if (oDroppedRow.isA("sap.ui.table.TreeTable")) {
                    // Drop position is on the TreeTable itself, so add the dragged row as a child of the root
                    oTreeTable.removeTreeTableDropPosition();
                    oTreeTable.addTreeTableDropPosition(undefined, "Before");
                    var iDropIndex = -1; // Add as the last child
                } else {
                    // Drop position is on a row, so add the dragged row as a child of the dropped row
                    var iDropIndex = oDroppedRow.getBindingContext("nodeModel").getPath().substr(1);
                    if (sDropPosition === "Before") {
                        oTreeTable.addTreeTableDropPosition(iDropIndex, "Before");
                        iDropIndex = iDropIndex.substring(0, iDropIndex.lastIndexOf("/"));
                    } else if (sDropPosition === "After") {
                        oTreeTable.addTreeTableDropPosition(iDropIndex, "After");
                        iDropIndex = iDropIndex.substring(0, iDropIndex.lastIndexOf("/"));
                    } else {
                        oTreeTable.addTreeTableDropPosition(iDropIndex, "On");
                    }
                }

                // Calculate the new parent ID
                var sParentId = "";
                if (iDropIndex >= 0) {
                    var oParentNode = this.getView().getModel("nodeModel").getProperty(iDropIndex);
                    sParentId = oParentNode.id;
                }

                // ... (unchanged code)
            },

            onSaveAll: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                var oModel = this.getView().getModel();

                // Get all changes made in the TreeTable
                var aPendingChanges = oTreeTable.getBinding("rows").getPendingChanges();

                if (aPendingChanges && aPendingChanges.length > 0) {
                    // Loop through the pending changes and update the corresponding OData entities
                    aPendingChanges.forEach(function (oChange) {
                        var sPath = oChange.getPath();
                        var sProperty = oChange.getProperty();
                        var oEntry = {};
                        oEntry[sProperty] = oChange.getValue();
                        oModel.update(sPath, oEntry);
                    });

                    // Submit changes to the backend
                    oModel.submitChanges({
                        success: function () {
                            MessageToast.show("Changes saved successfully.");
                        },
                        error: function () {
                            MessageToast.show("Error saving changes.");
                        }
                    });
                } else {
                    MessageToast.show("No changes to save.");
                }
            },

            onOpenWebPage: function (oEvent) {
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    var sUrl = oSelectedNode.webPage;
                    if (sUrl) {
                        // Open the web page in a new window
                        window.open(sUrl, "_blank");
                    } else {
                        MessageToast.show("Web page URL not available for the selected node.");
                    }
                } else {
                    MessageToast.show("No node selected.");
                }
            },

            onToggleEdit: function () {
                var oGeneralModel = this.getView().getModel("generalModel");
                var bEditModeAllLines = oGeneralModel.getProperty("/editModeAllLines");
                oGeneralModel.setProperty("/editModeAllLines", !bEditModeAllLines);
                this.getView().getModel("nodeModel").refresh();
            },

            onDimensionLiveChange: function (oEvent) {
                var sNewValue = oEvent.getParameter("newValue");
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    oSelectedNode.dimension = sNewValue;
                    this.getView().getModel("nodeModel").refresh();
                }
            },

            onSizeLiveChange: function (oEvent) {
                var sNewValue = oEvent.getParameter("newValue");
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    oSelectedNode.size = sNewValue;
                    this.getView().getModel("nodeModel").refresh();
                }
            },

            onSelectChange: function (oEvent) {
                var sNewValue = oEvent.getParameter("selectedItem").getKey();
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    oSelectedNode.status = sNewValue;
                    this.getView().getModel("nodeModel").refresh();
                }
            },

            onSelectLiveChange: function (oEvent) {
                var sNewValue = oEvent.getParameter("newValue");
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    oSelectedNode.status = sNewValue;
                    this.getView().getModel("nodeModel").refresh();
                }
            },

            onCut: function (oEvent) {
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    // Store the selected node for later paste
                    this._aClipboardData = [oSelectedNode];
                    // Remove the selected node from the tree
                    this._removeNodeFromTree(oSelectedNode);
                } else {
                    MessageToast.show("No node selected.");
                }
            },

            onCopy: function (oEvent) {
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    // Store a copy of the selected node for later paste
                    this._aClipboardData = [this._copyNode(oSelectedNode)];
                } else {
                    MessageToast.show("No node selected.");
                }
            },

            onPaste: function (oEvent) {
                if (this._aClipboardData.length > 0) {
                    var oSelectedNode = this._getSelectedNode();
                    if (oSelectedNode) {
                        // Paste the clipboard data as children of the selected node
                        this._aClipboardData.forEach(function (oClipboardNode) {
                            var oNewNode = this._copyNode(oClipboardNode);
                            oNewNode.id = this._generateUniqueId();
                            oNewNode.parentId = oSelectedNode.id;
                            oSelectedNode.children.push(oNewNode);
                            this.getView().getModel("nodeModel").refresh();
                        }.bind(this));
                    } else {
                        MessageToast.show("No node selected for paste.");
                    }
                } else {
                    MessageToast.show("Clipboard is empty.");
                }
            },

            onPasteBefore: function (oEvent) {
                if (this._aClipboardData.length > 0) {
                    var oSelectedNode = this._getSelectedNode();
                    if (oSelectedNode) {
                        // Paste the clipboard data before the selected node
                        var oParentNode = this._getParentNode(oSelectedNode);
                        if (oParentNode) {
                            var iSelectedIndex = oParentNode.children.indexOf(oSelectedNode);
                            this._aClipboardData.forEach(function (oClipboardNode) {
                                var oNewNode = this._copyNode(oClipboardNode);
                                oNewNode.id = this._generateUniqueId();
                                oParentNode.children.splice(iSelectedIndex, 0, oNewNode);
                                iSelectedIndex++;
                                this.getView().getModel("nodeModel").refresh();
                            }.bind(this));
                        } else {
                            MessageToast.show("Unable to determine parent node for paste.");
                        }
                    } else {
                        MessageToast.show("No node selected for paste.");
                    }
                } else {
                    MessageToast.show("Clipboard is empty.");
                }
            },

            onPasteAfter: function (oEvent) {
                if (this._aClipboardData.length > 0) {
                    var oSelectedNode = this._getSelectedNode();
                    if (oSelectedNode) {
                        // Paste the clipboard data after the selected node
                        var oParentNode = this._getParentNode(oSelectedNode);
                        if (oParentNode) {
                            var iSelectedIndex = oParentNode.children.indexOf(oSelectedNode);
                            this._aClipboardData.forEach(function (oClipboardNode) {
                                var oNewNode = this._copyNode(oClipboardNode);
                                oNewNode.id = this._generateUniqueId();
                                oParentNode.children.splice(iSelectedIndex + 1, 0, oNewNode);
                                iSelectedIndex++;
                                this.getView().getModel("nodeModel").refresh();
                            }.bind(this));
                        } else {
                            MessageToast.show("Unable to determine parent node for paste.");
                        }
                    } else {
                        MessageToast.show("No node selected for paste.");
                    }
                } else {
                    MessageToast.show("Clipboard is empty.");
                }
            },

            onDelete: function (oEvent) {
                var oSelectedNode = this._getSelectedNode();
                if (oSelectedNode) {
                    var sMessage = "Are you sure you want to delete the selected node and its children?";
                    MessageBox.confirm(sMessage, {
                        title: "Confirm Deletion",
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.OK) {
                                // Remove the selected node and its children from the tree
                                this._removeNodeFromTree(oSelectedNode);
                            }
                        }.bind(this)
                    });
                } else {
                    MessageToast.show("No node selected.");
                }
            },

            onUndo: function (oEvent) {
                var oTreeTable = this.byId("TreeTable");
                oTreeTable.getBinding("rows").resetChanges();
                MessageToast.show("Undo changes.");
            },

            onRedo: function (oEvent) {
                MessageToast.show("Redo changes.");
            },

            onExit: function () {
                // Cleanup resources, unsubscribe events, etc.
                var oTreeTable = this.byId("TreeTable");

                if (oTreeTable) {
                    // Detach event handlers
                    oTreeTable.detachDragStart(this.onDragStart, this);
                    oTreeTable.detachDrop(this.onDrop, this);
                    oTreeTable.detachSaveAll(this.onSaveAll, this);
                    oTreeTable.detachOpenWebPage(this.onOpenWebPage, this);
                    oTreeTable.detachToggleEdit(this.onToggleEdit, this);
                    oTreeTable.detachDimensionLiveChange(this.onDimensionLiveChange, this);
                    oTreeTable.detachSizeLiveChange(this.onSizeLiveChange, this);
                    oTreeTable.detachSelectChange(this.onSelectChange, this);
                    oTreeTable.detachSelectLiveChange(this.onSelectLiveChange, this);
                    oTreeTable.detachCut(this.onCut, this);
                    oTreeTable.detachCopy(this.onCopy, this);
                    oTreeTable.detachPaste(this.onPaste, this);
                    oTreeTable.detachPasteBefore(this.onPasteBefore, this);
                    oTreeTable.detachPasteAfter(this.onPasteAfter, this);
                    oTreeTable.detachDelete(this.onDelete, this);
                    oTreeTable.detachUndo(this.onUndo, this);
                    oTreeTable.detachRedo(this.onRedo, this);
                    oTreeTable.detachExit(this.onExit, this);
                }

                // Cleanup any other resources or subscriptions

                // Call the base class's onExit method
                sap.ui.core.UIComponent.prototype.onExit.apply(this, arguments);
            },


            
        });
    });








