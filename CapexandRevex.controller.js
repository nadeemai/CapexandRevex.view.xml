UPDATED CODE 16

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.mmapprovalhub.approvalhub.controller.CAPEX_AND_REVEX", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();

            // Attach live change event handlers for real-time validation
            var aInputIds = ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "dpPaymentDaete", "inpAccDocNumberer", "inpCostCenterer", 
                            "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpBaseAmouneta", "inpInvoiceee", "po", "gst", 
                            "tds", "paymentTerms", "totalAmount"];
            aInputIds.forEach(function(id) {
                var oControl = oView.byId(id);
                if (oControl && oControl.attachLiveChange) {
                    oControl.attachLiveChange(this._handleLiveValidation.bind(this));
                }
            }.bind(this));
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");
        
            // Initialize all enablement flags
            var bFieldsEnabled = false; // Controls TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = false;     // Controls PO field
            var bWbsEnabled = true;    // Controls WBS field (new separate property)
        
            // Apply enablement rules based on payment option and PO/Non-PO selection
            if (sPaymentOption === "Advance Payment") {
                if (sPoNonPo === "po") {
                    // Advance Payment with PO Based
                    bPoEnabled = true; // PO should be editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                } else if (sPoNonPo === "nonpo") {
                    // Advance Payment with Non-PO
                    bPoEnabled = false; // PO non-editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                }
            } else if (sPaymentOption === "Regular Payment") {
                if (sPoNonPo === "po") {
                    // Regular Payment with PO Based
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                } else if (sPoNonPo === "nonpo") {
                    // Regular Payment with Non-PO
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                }
            }
        
            // Update field enablement model with new properties
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);
            oFieldEnablementModel.setProperty("/wbsEnabled", bWbsEnabled); // New property
        
            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }
        
            if (!bWbsEnabled) {
                oPortalModel.setProperty("/wbs", "");
            }
        
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Cancel Capex/Revex form
        onCancelCapexRevexForm: function () {
            var Approved = this._ApprovedCheck;
            var oRouter = this.getOwnerComponent().getRouter();

            if (Approved === "Approved") {
                oRouter.navTo("approverdashboard", {});
            } else {
                // this.onResetForm(); // Uncomment if form reset is needed
                oRouter.navTo("DashboardUI", {
                    Name: "CAPEX_AND_REVEX"
                });
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2); // Last two digits of the year
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // Day of the year (0-365)
            return "REQ" + year + dayOfYear.toString().padStart(3, '0'); // e.g., "REQ250174" for June 23, 2025
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }
        
            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");
        
                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageBox.success("Capex and Revex Request " + oPayload.reqNo + " is saved successfully", {
                                    title: "Save Successful",
                                    onClose: function () {
                                        // Optional: Add any action after closing the popup
                                    }
                                });
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form with enhanced validation
        onSubmitCapexravexform: function() {
            var isValid = true;
            var missingFields = [];
            var oView = this.getView();
            
            // First reset all field states
            this._resetFieldStates();

            // Get payment option and PO/Non-PO selection
            var sPaymentOption = oView.byId("cbPaymentOptieon").getSelectedKey();
            var sPoNonPo = oView.byId("cbPoNonePo").getSelectedKey();
            var bFieldsEnabled = oView.getModel("fieldEnablement").getProperty("/fieldsEnabled");

            // Required fields - these will always be mandatory
            var aMandatoryFields = [
                { id: "cbPaymentOptieon", field: "Payment Option" },
                { id: "cbPaymentTyepe", field: "Payment Type" },
                { id: "cbPoNonePo", field: "PO/Non PO" },
                { id: "dpPaymentDaete", field: "Payment Date" },
                { id: "inpAccDocNumberer", field: "Accounting Document Number" },
                { id: "inpCostCenterer", field: "Cost Center" },
                { id: "inpWBSes", field: "WBS" },
                { id: "inpVendorCodeee", field: "Vendor Code" },
                { id: "inpVendorNameee", field: "Vendor Name" },
                { id: "inpBaseAmouneta", field: "Base Amount" },
                { id: "inpInvoiceee", field: sPaymentOption === "Advance Payment" ? "Proforma Number" : "Invoice Number" }
                
            ];

            // Validate mandatory fields
            aMandatoryFields.forEach(function(item) {
                var oControl = oView.byId(item.id);
                if (!oControl) return;

                var sValue = oControl.getValue ? oControl.getValue().trim() : oControl.getSelectedKey ? oControl.getSelectedKey().trim() : "";
                
                if (item.id === "dpPaymentDaete" && !sValue) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("This field is mandatory");
                    isValid = false;
                    missingFields.push(item.field);
                } else if (!sValue) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("This field is mandatory");
                    isValid = false;
                    missingFields.push(item.field);
                } else if (item.id === "inpBaseAmouneta" && sValue && isNaN(parseFloat(sValue))) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("Must be a valid number");
                    isValid = false;
                    missingFields.push(item.field + " (must be a valid number)");
                }
            });

            // Validate PO if PO is selected
            if (sPoNonPo === "po") {
                var oPoControl = oView.byId("po");
                if (oPoControl) {
                    var sPoValue = oPoControl.getValue ? oPoControl.getValue().trim() : "";
                    if (!sPoValue) {
                        oPoControl.setValueState("Error");
                        oPoControl.setValueStateText("PO Number is required for PO-based payments");
                        isValid = false;
                        missingFields.push("PO Number");
                    }
                }
            }

            // Conditionally required fields (only when fields are enabled)
            if (bFieldsEnabled) {
                var aConditionalFields = [
                    { id: "gst", field: "GST" },
                    { id: "tds", field: "TDS" },
                    { id: "paymentTerms", field: "Payment Terms" },
                    { id: "totalAmount", field: "/freelance/Total Amount" }
                ];

                aConditionalFields.forEach(function(item) {
                    var oControl = oView.byId(item.id);
                    if (!oControl) return;

                    var sValue = oControl.getValue ? oControl.getValue().trim() : "";

                    if (!sValue) {
                        oControl.setValueState("Error");
                        oControl.setValueStateText("This field is mandatory for Regular Payment");
                        isValid = false;
                        missingFields.push(item.field);
                    } else if (["gst", "tds", "totalAmount"].includes(item.id) && sValue && isNaN(parseFloat(sValue))) {
                        oControl.setValueState("Error");
                        oControl.setValueStateText("Must be a valid number");
                        isValid = false;
                        missingFields.push(item.field + " (must be a valid number)");
                    }
                });
            }

            // Final validation result
            if (!isValid) {
                var errorMessage = "Please fill all required fields:\n" +
                    missingFields.map(field => "• " + field).join("\n");

                // MessageBox.error(errorMessage, {
                //     title: "Missing Required Fields",
                //     // details: "All fields marked with (*) are mandatory.",
                //     actions: [MessageBox.Action.OK]
                // });
                return;
            }

            // Additional validation from _validateForm
            if (!this._validateForm()) {
                return;
            }

            // Open Remarks Dialog
            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com/mmapprovalhub/approvalhub/Fragments/RemarksDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oRemarksDialog = oDialog;
                    oView.addDependent(this._oRemarksDialog);
                    oView.getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                oView.getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Helper function to reset all field states
        _resetFieldStates: function() {
            var oView = this.getView();
            var aControlIds = [
                "cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "dpPaymentDaete",
                "inpAccDocNumberer", "inpCostCenterer", "inpWBSes", "inpVendorCodeee",
                "inpVendorNameee", "inpBaseAmouneta", "inpInvoiceee", "po", "gst",
                "tds", "paymentTerms", "totalAmount"
            ];

            aControlIds.forEach(function(sId) {
                var oControl = oView.byId(sId);
                if (oControl) {
                    oControl.setValueState("None");
                    oControl.setValueStateText("");
                }
            });
        },

        // Helper function to get control value
        _getControlValue: function(sControlId) {
            var oControl = this.getView().byId(sControlId);
            if (!oControl) return "";
            
            if (oControl.getValue) {
                return oControl.getValue();
            } else if (oControl.getSelectedKey) {
                return oControl.getSelectedKey();
            } else if (oControl.getDate) {
                return oControl.getDate();
            }
            return "";
        },

        // Handle live validation for input fields
        _handleLiveValidation: function(oEvent) {
            var oControl = oEvent.getSource();
            var sValue = oControl.getValue ? oControl.getValue().trim() : oControl.getSelectedKey ? oControl.getSelectedKey().trim() : "";
            var sId = oControl.getId();

            // Clear error if field is filled with valid data
            if (sId === "dpPaymentDaete" && sValue) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer", 
                                 "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee", "po"].includes(sId)) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (sId === "inpBaseAmouneta" && sValue && !isNaN(parseFloat(sValue))) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && !isNaN(parseFloat(sValue))) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            }
            // Show error for empty mandatory fields or invalid data
            else if (sId === "dpPaymentDaete" && !sValue) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (!sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer", 
                                  "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee"].includes(sId)) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (sId === "inpBaseAmouneta" && sValue && isNaN(parseFloat(sValue))) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid number");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && isNaN(parseFloat(sValue))) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid number");
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
                aRequiredFields.push({ field: "paymentTerms", value: oPortalModel.paymentTerms, label: "Payment Terms" });
                aRequiredFields.push({ field: "totalAmount", value: oPortalModel.totalAmount, label: "Total Amount" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds", "totalAmount"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 15

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: "",
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();

            // Attach live change event handlers for real-time validation
            var aInputIds = ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "dpPaymentDaete", "inpAccDocNumberer", "inpCostCenterer", 
                            "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpBaseAmouneta", "inpInvoiceee", "po", "gst", 
                            "tds", "paymentTerms", "totalAmount"];
            aInputIds.forEach(function(id) {
                var oControl = oView.byId(id);
                if (oControl && oControl.attachLiveChange) {
                    oControl.attachLiveChange(this._handleLiveValidation.bind(this));
                }
            }.bind(this));
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");
        
            // Initialize all enablement flags
            var bFieldsEnabled = false; // Controls TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = false;     // Controls PO field
            var bWbsEnabled = true;    // Controls WBS field (new separate property)
        
            // Apply enablement rules based on payment option and PO/Non-PO selection
            if (sPaymentOption === "Advance Payment") {
                if (sPoNonPo === "po") {
                    // Advance Payment with PO Based
                    bPoEnabled = true; // PO should be editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                } else if (sPoNonPo === "nonpo") {
                    // Advance Payment with Non-PO
                    bPoEnabled = false; // PO non-editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                }
            } else if (sPaymentOption === "Regular Payment") {
                if (sPoNonPo === "po") {
                    // Regular Payment with PO Based
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                } else if (sPoNonPo === "nonpo") {
                    // Regular Payment with Non-PO
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                }
            }
        
            // Update field enablement model with new properties
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);
            oFieldEnablementModel.setProperty("/wbsEnabled", bWbsEnabled); // New property
        
            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }
        
            if (!bWbsEnabled) {
                oPortalModel.setProperty("/wbs", "");
            }
        
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2); // Last two digits of the year
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // Day of the year (0-365)
            return "REQ" + year + dayOfYear.toString().padStart(3, '0'); // e.g., "REQ250174" for June 23, 2025
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }
        
            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");
        
                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageBox.success("Capex and Revex Request " + oPayload.reqNo + " is saved successfully", {
                                    title: "Save Successful",
                                    onClose: function () {
                                        // Optional: Add any action after closing the popup
                                    }
                                });
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form with enhanced validation
        onSubmitCapexravexform: function() {
            var isValid = true;
            var missingFields = [];
            var oView = this.getView();
            
            // First reset all field states
            this._resetFieldStates();

            // Get payment option and PO/Non-PO selection
            var sPaymentOption = oView.byId("cbPaymentOptieon").getSelectedKey();
            var sPoNonPo = oView.byId("cbPoNonePo").getSelectedKey();
            var bFieldsEnabled = oView.getModel("fieldEnablement").getProperty("/fieldsEnabled");

            // Required fields - these will always be mandatory
            var aMandatoryFields = [
                { id: "cbPaymentOptieon", field: "Payment Option" },
                { id: "cbPaymentTyepe", field: "Payment Type" },
                { id: "cbPoNonePo", field: "PO/Non PO" },
                { id: "dpPaymentDaete", field: "Payment Date" },
                { id: "inpAccDocNumberer", field: "Accounting Document Number" },
                { id: "inpCostCenterer", field: "Cost Center" },
                { id: "inpWBSes", field: "WBS" },
                { id: "inpVendorCodeee", field: "Vendor Code" },
                { id: "inpVendorNameee", field: "Vendor Name" },
                { id: "inpBaseAmouneta", field: "Base Amount" },
                { id: "inpInvoiceee", field: sPaymentOption === "Advance Payment" ? "Proforma Number" : "Invoice Number" }
                
            ];

            // Validate mandatory fields
            aMandatoryFields.forEach(function(item) {
                var oControl = oView.byId(item.id);
                if (!oControl) return;

                var sValue = oControl.getValue ? oControl.getValue().trim() : oControl.getSelectedKey ? oControl.getSelectedKey().trim() : "";
                
                if (item.id === "dpPaymentDaete" && !sValue) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("This field is mandatory");
                    isValid = false;
                    missingFields.push(item.field);
                } else if (!sValue) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("This field is mandatory");
                    isValid = false;
                    missingFields.push(item.field);
                } else if (item.id === "inpBaseAmouneta" && sValue && isNaN(parseFloat(sValue))) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText("Must be a valid number");
                    isValid = false;
                    missingFields.push(item.field + " (must be a valid number)");
                }
            });

            // Validate PO if PO is selected
            if (sPoNonPo === "po") {
                var oPoControl = oView.byId("po");
                if (oPoControl) {
                    var sPoValue = oPoControl.getValue ? oPoControl.getValue().trim() : "";
                    if (!sPoValue) {
                        oPoControl.setValueState("Error");
                        oPoControl.setValueStateText("PO Number is required for PO-based payments");
                        isValid = false;
                        missingFields.push("PO Number");
                    }
                }
            }

            // Conditionally required fields (only when fields are enabled)
            if (bFieldsEnabled) {
                var aConditionalFields = [
                    { id: "gst", field: "GST" },
                    { id: "tds", field: "TDS" },
                    { id: "paymentTerms", field: "Payment Terms" },
                    { id: "totalAmount", field: "Total Amount" }
                ];

                aConditionalFields.forEach(function(item) {
                    var oControl = oView.byId(item.id);
                    if (!oControl) return;

                    var sValue = oControl.getValue ? oControl.getValue().trim() : "";

                    if (!sValue) {
                        oControl.setValueState("Error");
                        oControl.setValueStateText("This field is mandatory for Regular Payment");
                        isValid = false;
                        missingFields.push(item.field);
                    } else if (["gst", "tds", "totalAmount"].includes(item.id) && sValue && isNaN(parseFloat(sValue))) {
                        oControl.setValueState("Error");
                        oControl.setValueStateText("Must be a valid number");
                        isValid = false;
                        missingFields.push(item.field + " (must be a valid number)");
                    }
                });
            }

            // Final validation result
            if (!isValid) {
                var errorMessage = "Please fill all required fields:\n" +
                    missingFields.map(field => "• " + field).join("\n");

                MessageBox.error(errorMessage, {
                    title: "Missing Required Fields",
                    // details: "All fields marked with (*) are mandatory.",
                    actions: [MessageBox.Action.OK]
                });
                return;
            }

            // Additional validation from _validateForm
            if (!this._validateForm()) {
                return;
            }

            // Open Remarks Dialog
            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oRemarksDialog = oDialog;
                    oView.addDependent(this._oRemarksDialog);
                    oView.getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                oView.getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Helper function to reset all field states
        _resetFieldStates: function() {
            var oView = this.getView();
            var aControlIds = [
                "cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "dpPaymentDaete",
                "inpAccDocNumberer", "inpCostCenterer", "inpWBSes", "inpVendorCodeee",
                "inpVendorNameee", "inpBaseAmouneta", "inpInvoiceee", "po", "gst",
                "tds", "paymentTerms", "totalAmount"
            ];

            aControlIds.forEach(function(sId) {
                var oControl = oView.byId(sId);
                if (oControl) {
                    oControl.setValueState("None");
                    oControl.setValueStateText("");
                }
            });
        },

        // Helper function to get control value
        _getControlValue: function(sControlId) {
            var oControl = this.getView().byId(sControlId);
            if (!oControl) return "";
            
            if (oControl.getValue) {
                return oControl.getValue();
            } else if (oControl.getSelectedKey) {
                return oControl.getSelectedKey();
            } else if (oControl.getDate) {
                return oControl.getDate();
            }
            return "";
        },

        // Handle live validation for input fields
        _handleLiveValidation: function(oEvent) {
            var oControl = oEvent.getSource();
            var sValue = oControl.getValue ? oControl.getValue().trim() : oControl.getSelectedKey ? oControl.getSelectedKey().trim() : "";
            var sId = oControl.getId();

            // Clear error if field is filled with valid data
            if (sId === "dpPaymentDaete" && sValue) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer", 
                                 "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee", "po"].includes(sId)) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (sId === "inpBaseAmouneta" && sValue && !isNaN(parseFloat(sValue))) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && !isNaN(parseFloat(sValue))) {
                oControl.setValueState("None");
                oControl.setValueStateText("");
            }
            // Show error for empty mandatory fields or invalid data
            else if (sId === "dpPaymentDaete" && !sValue) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (!sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer", 
                                  "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee"].includes(sId)) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (sId === "inpBaseAmouneta" && sValue && isNaN(parseFloat(sValue))) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid number");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && isNaN(parseFloat(sValue))) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid number");
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
                aRequiredFields.push({ field: "paymentTerms", value: oPortalModel.paymentTerms, label: "Payment Terms" });
                aRequiredFields.push({ field: "totalAmount", value: oPortalModel.totalAmount, label: "Total Amount" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds", "totalAmount"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});


UPDATE CODE 14

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: "",
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");
        
            // Initialize all enablement flags
            var bFieldsEnabled = false; // Controls TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = false;     // Controls PO field
            var bWbsEnabled = false;    // Controls WBS field (new separate property)
        
            // Apply enablement rules based on payment option and PO/Non-PO selection
            if (sPaymentOption === "Advance Payment") {
                if (sPoNonPo === "po") {
                    // Advance Payment with PO Based
                    bPoEnabled = true; // PO should be editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                } else if (sPoNonPo === "nonpo") {
                    // Advance Payment with Non-PO
                    bPoEnabled = false; // PO non-editable
                    bWbsEnabled = true; // WBS should be editable
                    bFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                }
            } else if (sPaymentOption === "Regular Payment") {
                if (sPoNonPo === "po") {
                    // Regular Payment with PO Based
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                } else if (sPoNonPo === "nonpo") {
                    // Regular Payment with Non-PO
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bFieldsEnabled = true; // TDS, GST, Payment Terms, Total Amount editable
                }
            }
        
            // Update field enablement model with new properties
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);
            oFieldEnablementModel.setProperty("/wbsEnabled", bWbsEnabled); // New property
        
            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }
        
            if (!bWbsEnabled) {
                oPortalModel.setProperty("/wbs", "");
            }
        
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2); // Last two digits of the year
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // Day of the year (0-365)
            return "REQ" + year + dayOfYear.toString().padStart(3, '0'); // e.g., "REQ250174" for June 23, 2025
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }
        
            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");
        
                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageBox.success("Capex and Revex Request " + oPayload.reqNo + " is saved successfully", {
                                    title: "Save Successful",
                                    onClose: function () {
                                        // Optional: Add any action after closing the popup
                                    }
                                });
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
                aRequiredFields.push({ field: "paymentTerms", value: oPortalModel.paymentTerms, label: "Payment Terms" });
                aRequiredFields.push({ field: "totalAmount", value: oPortalModel.totalAmount, label: "Total Amount" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds", "totalAmount"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 13

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: "",
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");
        
            // Initialize all enablement flags
            var bFieldsEnabled = false; // Controls TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = false;     // Controls PO field
            var bWbsEnabled = false;    // Controls WBS field (new separate property)
            var bOtherFieldsEnabled = false; // Controls other fields (new separate property)
        
            // Apply enablement rules based on payment option and PO/Non-PO selection
            if (sPaymentOption === "Advance Payment") {
                if (sPoNonPo === "po") {
                    // Advance Payment with PO Based
                    bPoEnabled = true; // PO should be editable
                    bWbsEnabled = true; // WBS should be editable
                    bOtherFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                } else if (sPoNonPo === "nonpo") {
                    // Advance Payment with Non-PO
                    bPoEnabled = false; // PO non-editable
                    bWbsEnabled = true; // WBS should be editable
                    bOtherFieldsEnabled = false; // TDS, GST, Payment Terms, Total Amount non-editable
                }
            } else if (sPaymentOption === "Regular Payment") {
                if (sPoNonPo === "po") {
                    // Regular Payment with PO Based
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bOtherFieldsEnabled = true; // All fields editable
                } else if (sPoNonPo === "nonpo") {
                    // Regular Payment with Non-PO
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bOtherFieldsEnabled = true; // All fields except PO editable
                }
            }
        
            // Update field enablement model with new properties
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);
            oFieldEnablementModel.setProperty("/wbsEnabled", bWbsEnabled); // New property
            oFieldEnablementModel.setProperty("/otherFieldsEnabled", bOtherFieldsEnabled); // New property
        
            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled && !bOtherFieldsEnabled) {
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }
        
            if (!bWbsEnabled) {
                oPortalModel.setProperty("/wbs", "");
            }
        
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2); // Last two digits of the year
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // Day of the year (0-365)
            return "REQ" + year + dayOfYear.toString().padStart(3, '0'); // e.g., "REQ250174" for June 23, 2025
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }
        
            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");
        
                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageBox.success("Capex and Revex Request " + oPayload.reqNo + " is saved successfully", {
                                    title: "Save Successful",
                                    onClose: function () {
                                        // Optional: Add any action after closing the popup
                                    }
                                });
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
            ];

            if (bFieldsEnabled) {
                // aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATE CODE 12

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: "",
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Initialize enablement flags
            var bFieldsEnabled = false; // Controls WBS, TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = false;     // Controls PO field

            // Apply enablement rules based on requirements
            if (sPaymentOption === "Regular Payment" && sPoNonPo === "nonpo") {
                // Make WBS, TDS, GST, Payment Terms, and Total Amount editable, PO non-editable for Regular Payment with Non-PO
                bFieldsEnabled = true;
                bPoEnabled = false;
            } else if (sPaymentOption === "Regular Payment" && sPoNonPo === "po") {
                // Make PO, WBS, TDS, GST, Payment Terms, and Total Amount editable for Regular Payment with PO Based
                bPoEnabled = true;
                bFieldsEnabled = true;
            } else if (sPaymentOption === "Advance Payment") {
                // For Advance Payment, make WBS editable regardless of PO or Non-PO
                bFieldsEnabled = true; // Enable WBS, but other fields (TDS, GST, etc.) remain non-editable
                if (sPoNonPo === "po") {
                    bPoEnabled = true; // PO editable for Advance Payment with PO
                } else {
                    bPoEnabled = false; // PO non-editable for Advance Payment with Non-PO
                }
            } else {
                // Default case for other combinations
                bFieldsEnabled = false;
                bPoEnabled = false;
            }

            // Update field enablement model
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/wbs", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2); // Last two digits of the year
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // Day of the year (0-365)
            return "REQ" + year + dayOfYear.toString().padStart(3, '0'); // e.g., "REQ250174" for June 23, 2025
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }
        
            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");
        
                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageBox.success("Capex and Revex Request " + oPayload.reqNo + " is saved successfully", {
                                    title: "Save Successful",
                                    onClose: function () {
                                        // Optional: Add any action after closing the popup
                                    }
                                });
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 11

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: "",
                // approver: "" // Added for approver dropdown
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ],
                // approvers: [ // Added for approver dropdown
                //     { name: "Approver 1", key: "app1" },
                //     { name: "Approver 2", key: "app2" }
                // ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Initialize enablement flags
            var bFieldsEnabled = true; // Controls WBS, TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = true;     // Controls PO field

            // Apply enablement rules based on requirements
            if (sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") {
                // For both Advance Payment and Regular Payment
                if (sPoNonPo === "po" && sPaymentOption === "Advance Payment") {
                    // PO should be editable for Advance Payment with PO
                    bPoEnabled = true;
                    bFieldsEnabled = false; // WBS, TDS, GST, Payment Terms, Total Amount non-editable
                } else if (sPoNonPo === "nonpo" && sPaymentOption === "Advance Payment") {
                    // WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false; // PO non-editable
                } else {
                    // Default case for Regular Payment or other combinations
                    bFieldsEnabled = false;
                    bPoEnabled = false;
                }
            }

            // Update field enablement model
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/wbs", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || "",
                        // approver: oData.approver || "" // Added for approver
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date("2025-06-22T17:51:00Z"); // 11:21 PM IST (UTC+5:30) converted to UTC
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp; // e.g., "REQ2506221751"
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");

                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageToast.show("Form saved as draft successfully. Request Number: " + oPayload.reqNo);
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                // approver: oPortalModel.approver, // Added for approver
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" },
                // { field: "approver", value: oPortalModel.approver, label: "Approver" } // Added for approver
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: "",
                // approver: "" // Added for approver
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT",
                            // approver: oData?.approver || "" // Added for approver
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
}); 

UPDATE CODE 10

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if ((sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();

            // Initialize models (excluding timeline model)
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            // Set models (excluding timeline model)
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Initialize enablement flags
            var bFieldsEnabled = true; // Controls WBS, TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = true;     // Controls PO field

            // Apply enablement rules based on requirements
            if (sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") {
                // For both Advance Payment and Regular Payment
                if (sPoNonPo === "po") {
                    // PO, WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false;
                } else if (sPoNonPo === "nonpo") {
                    // WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false; // PO should be non-editable as per original Advance Payment logic
                }
            }

            // Update field enablement model
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/wbs", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");

                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageToast.show("Form saved as draft successfully. Request Number: " + oPayload.reqNo);
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    // Prepare timeline data to pass to Approver screen
                    var oTimelineData = {
                        results: oPayload.approvalHistory || []
                    };

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data and timeline
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload)),
                        timelineData: encodeURIComponent(JSON.stringify(oTimelineData))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata") || new JSONModel({ results: [] }).getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            // var oJustification = oRequestServiceModel.ssfdDtl;
            // if (!oJustification.background || !oJustification.justification || !oJustification.deliverables) {
            //     MessageToast.show("All justification details (Background, Justification, Deliverables) are required.");
            //     bValid = false;
            // }

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 9

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if ((sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize router
            this._oRouter = this.getOwnerComponent().getRouter();
            // this._oRouter.getRoute("capexrevex").attachPatternMatched(this._onRouteMatched, this);

            // Initialize models
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            var oTimelineModel = new JSONModel({
                results: [
                    {
                        role: "Submitter",
                        userName: "Mohd Aakib",
                        userEmail: "mohdaakib@example.com",
                        remarks: "Form submitted",
                        createdAt: "2025-06-18T09:30:15Z",
                        userPicture: ""
                    },
                    {
                        role: "HOD",
                        userName: "Pushkar Kumar",
                        userEmail: "pushakkumar@example.com",
                        remarks: "Form approved by HOD",
                        createdAt: "2025-06-18T14:45:22Z",
                        userPicture: ""
                    },
                    {
                        role: "Finance",
                        userName: "Ankit",
                        userEmail: "ankit@example.com",
                        remarks: "Form approved for payment",
                        createdAt: "2025-06-19T10:15:30Z",
                        userPicture: ""
                    }
                ]
            });

            // Set models
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");
            oView.setModel(oTimelineModel, "timelinesslogdata");

            this._updateFieldEnablement();
        },

        // Route matched handler
        _onRouteMatched: function (oEvent) {
            // Handle route parameters if needed
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Initialize enablement flags
            var bFieldsEnabled = true; // Controls WBS, TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = true;     // Controls PO field

            // Apply enablement rules based on requirements
            if (sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") {
                // For both Advance Payment and Regular Payment
                if (sPoNonPo === "po") {
                    // PO, WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false;
                } else if (sPoNonPo === "nonpo") {
                    // WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false; // PO should be non-editable as per original Advance Payment logic
                }
            }

            // Update field enablement model
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/wbs", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("timelinesslogdata").setData({
                        results: oData.approvalHistory || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");

                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageToast.show("Form saved as draft successfully. Request Number: " + oPayload.reqNo);
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    var oTimelineModel = this.getView().getModel("timelinesslogdata");
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oPayload.approvalHistory[0]);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();

                    // Navigate to Approval screen with form data
                    this._oRouter.navTo("approval", {
                        reqNo: oPayload.reqNo,
                        formData: encodeURIComponent(JSON.stringify(oPayload))
                    });
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            // var oUploadModel = this.getView().getModel("UploadDoc").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata").getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Smith",
                userEmail: "alice.smith@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                // invoiceNumber: oPortalModel.getProperty("/invoiceNumber"),
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                // attachments: oUploadModel.attachments,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requestor" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("timelinesslogdata").setData({
                results: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 8

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if ((sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize models
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            var oTimelineModel = new JSONModel({
                results: [
                    {
                        role: "Submitter",
                        userName: "Mohd Aakib",
                        userEmail: "mohdaakib@example.com",
                        remarks: "Form submitted",
                        createdAt: "2025-06-18T09:30:15Z",
                        userPicture: ""
                    },
                    {
                        role: "HOD",
                        userName: "Pushkar Kumar",
                        userEmail: "pushakkumar@example.com",
                        remarks: "Form approved by HOD",
                        createdAt: "2025-06-18T14:45:22Z",
                        userPicture: ""
                    },
                    {
                        role: "Finance",
                        userName: "Ankit",
                        userEmail: "ankit@example.com",
                        remarks: "Form approved for payment",
                        createdAt: "2025-06-19T10:15:30Z",
                        userPicture: ""
                    }
                ]
            });

            // Set models
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");
            oView.setModel(oTimelineModel, "timelinesslogdata");

            this._updateFieldEnablement();
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Initialize enablement flags
            var bFieldsEnabled = true; // Controls WBS, TDS, GST, Payment Terms, Total Amount
            var bPoEnabled = true;     // Controls PO field

            // Apply enablement rules based on requirements
            if (sPaymentOption === "Advance Payment" || sPaymentOption === "Regular Payment") {
                // For both Advance Payment and Regular Payment
                if (sPoNonPo === "po") {
                    // PO, WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false;
                } else if (sPoNonPo === "nonpo") {
                    // WBS, TDS, GST, Payment Terms, Total Amount should be non-editable
                    bFieldsEnabled = false;
                    bPoEnabled = false; // PO should be non-editable as per original Advance Payment logic
                }
            }

            // Update field enablement model
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear non-editable fields to prevent stale data
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/wbs", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/paymentTerms", "");
                oPortalModel.setProperty("/totalAmount", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("timelinesslogdata").setData({
                        results: oData.approvalHistory || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment"),
                        poEnabled: !(oData.paymentOption === "Advance Payment" || oData.paymentOption === "Regular Payment")
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Save form as draft with confirmation popup
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            MessageBox.confirm("Are you sure you want to save this form as a draft?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oPayload = this._createPayload("DRAFT");

                        this._callService("/saveDraft", "POST", oPayload)
                            .then(function () {
                                MessageToast.show("Form saved as draft successfully. Request Number: " + oPayload.reqNo);
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                // MessageBox.error("Please fill all required fields correctly.");
                return;
            }

            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    var oTimelineModel = this.getView().getModel("timelinesslogdata");
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oPayload.approvalHistory[0]);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata").getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "Alice Johnson",
                userEmail: "alice.johnson@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requester" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "wbs", value: oPortalModel.wbs, label: "WBS" });
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            // var oJustification = oRequestServiceModel.ssfdDtl;
            // if (!oJustification.background || !oJustification.justification || !oJustification.deliverables) {
            //     MessageToast.show("All justification details (Background, Justification, Deliverables) are required.");
            //     bValid = false;
            // }

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("timelinesslogdata").setData({
                results: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: true
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 7

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment" && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize models
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                buyerRequesterKey: "req1",
                buyerHodKey: "hod1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            var oTimelineModel = new JSONModel({
                results: [
                    {
                        role: "Submitter",
                        userName: "Jane Smith",
                        userEmail: "jane.smith@example.com",
                        remarks: "Form submitted with Request Number: REQ20250618093015",
                        createdAt: "2025-06-18T09:30:15Z",
                        userPicture: ""
                    },
                    {
                        role: "HOD",
                        userName: "Robert Brown",
                        userEmail: "robert.brown@example.com",
                        remarks: "Form approved by HOD",
                        createdAt: "2025-06-18T14:45:22Z",
                        userPicture: ""
                    },
                    {
                        role: "Finance",
                        userName: "Emily Johnson",
                        userEmail: "emily.johnson@example.com",
                        remarks: "Form approved for payment",
                        createdAt: "2025-06-19T10:15:30Z",
                        userPicture: ""
                    }
                ]
            });

            // Set models
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");
            oView.setModel(oTimelineModel, "timelinesslogdata");

            // Bind route matched event
            // var oRouter = this.getOwnerComponent().getRouter();
            // oRouter.getRoute("capexrevex").attachPatternMatched(this._onRouteMatched, this);
        },

        // Handle route matched
        _onRouteMatched: function (oEvent) {
            var sRefNo = oEvent.getParameter("arguments").refNo;
            if (sRefNo) {
                this._loadFormData(sRefNo);
            } else {
                this._resetForm();
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        refNo: sRefNo,
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("timelinesslogdata").setData({
                        results: oData.approvalHistory || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED",
                        fieldsEnabled: oData.status !== "SUBMITTED" && oData.status !== "APPROVED" && 
                            !(oData.paymentOption === "Advance Payment" && oData.poNonPo === "po"),
                        poEnabled: oData.poNonPo === "po"
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", 
                        oData.status !== "SUBMITTED" && oData.status !== "APPROVED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + (oError.message || "Unknown error"));
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");

            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            var bFieldsEnabled = !(sPaymentOption === "Advance Payment" && sPoNonPo === "po");
            var bPoEnabled = sPoNonPo === "po";

            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/totalAmount", "");
                oPortalModel.setProperty("/paymentTerms", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Save form as draft
        onSaveCapexravexform: function () {
            if (!this._validateForm()) {
                return;
            }

            var oPayload = this._createPayload("DRAFT");

            this._callService("/saveDraft", "POST", oPayload)
                .then(function () {
                    MessageToast.show("Form saved as draft successfully. Request Number: " + oPayload.reqNo);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error saving draft: " + (oError.message || "Unknown error"));
                });
        },

        // Submit form
        onSubmitCapexravexform: function () {
            if (!this._validateForm()) {
                MessageBox.error("Please fill all required fields correctly.");
                return;
            }

            // Open remarks dialog
            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPayload = this._createPayload("SUBMITTED", sRemarks);

            this._callService("/submitForm", "POST", oPayload)
                .then(function () {
                    var oTimelineModel = this.getView().getModel("timelinesslogdata");
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oPayload.approvalHistory[0]);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form submitted successfully. Request Number: " + oPayload.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + (oError.message || "Unknown error"));
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Create payload for save and submit
        _createPayload: function (sStatus, sRemarks) {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata").getData();

            var oTimelineEntry = sRemarks ? [{
                role: "Submitter",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form ${sStatus.toLowerCase()} with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            }] : [];

            return {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks || oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: sStatus,
                approvalHistory: sStatus === "SUBMITTED" ? [...oTimelineModel.results, ...oTimelineEntry] : oTimelineModel.results
            };
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "wbs", value: oPortalModel.wbs, label: "WBS" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requester" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            var oJustification = oRequestServiceModel.ssfdDtl;
            if (!oJustification.background || !oJustification.justification || !oJustification.deliverables) {
                MessageToast.show("All justification details (Background, Justification, Deliverables) are required.");
                bValid = false;
            }

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("timelinesslogdata").setData({
                results: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approveButtonVisibility: false,
                sendBackButtonVisibility: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
                oTextArea.setValueStateText("");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    }.bind(this))
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + (oError.message || "Unknown error"));
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + (oError.message || "Unknown error"));
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + (oError.message || "Unknown error"));
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});


UPDATED CODE 6

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment" && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize models
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true,
                remarkModel: "",
                approvebuttonvisiblityData: false,
                sendbackbuttonvisiblity: false
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            var oTimelineModel = new JSONModel({
                results: [
                    {
                        role: "Submitter",
                        userName: "Jane Smith",
                        userEmail: "jane.smith@example.com",
                        remarks: "Form submitted with Request Number: REQ20250618093015",
                        createdAt: "2025-06-18T09:30:15Z",
                        userPicture: ""
                    },
                    {
                        role: "HOD",
                        userName: "Robert Brown",
                        userEmail: "robert.brown@example.com",
                        remarks: "Form approved by HOD",
                        createdAt: "2025-06-18T14:45:22Z",
                        userPicture: ""
                    },
                    {
                        role: "Finance",
                        userName: "Emily Johnson",
                        userEmail: "emily.johnson@example.com",
                        remarks: "Form approved for payment",
                        createdAt: "2025-06-19T10:15:30Z",
                        userPicture: ""
                    }
                ]
            });

            // Set models
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");
            oView.setModel(oTimelineModel, "timelinesslogdata");
        },

        // Handle route matched
        _onRouteMatched: function (oEvent) {
            var sRefNo = oEvent.getParameter("arguments").refNo;
            if (sRefNo) {
                this._loadFormData(sRefNo);
            } else {
                this._resetForm();
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("timelinesslogdata").setData({
                        results: oData.approvalHistory || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED",
                        fieldsEnabled: oData.status !== "SUBMITTED" && !(oData.paymentOption === "Advance Payment" && oData.poNonPo === "po"),
                        poEnabled: oData.poNonPo === "po"
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", oData.status !== "SUBMITTED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + oError.message);
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");

            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            var bFieldsEnabled = !(sPaymentOption === "Advance Payment" && sPoNonPo === "po");
            var bPoEnabled = sPoNonPo === "po";

            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/totalAmount", "");
                oPortalModel.setProperty("/paymentTerms", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Save form as draft
        onSaveSanctionform: function () {
            if (!this._validateForm()) {
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();

            var oData = {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: "DRAFT"
            };

            this._callService("/saveDraft", "POST", oData)
                .then(function () {
                    MessageToast.show("Form saved as draft successfully. Request Number: " + oPortalModel.reqNo);
                })
                .catch(function (oError) {
                    MessageBox.error("Error saving draft: " + oError.message);
                });
        },

        // Submit form
        onSubmitSanctionform: function () {
            if (!this._validateForm()) {
                MessageBox.error("Please fill all required fields correctly.");
                return;
            }

            // Open remarks dialog
            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.open();
            }
        },

        // // Handle remarks change
        // onRemarksChangeNBRF: function (oEvent) {
        //     var oTextArea = oEvent.getSource();
        //     var sValue = oEvent.getParameter("value");
        //     if (sValue.length > 4000) {
        //         oTextArea.setValueState("Error");
        //         oTextArea.setValueStateText("Maximum 4000 characters allowed.");
        //     } else {
        //         oTextArea.setValueState("None");
        //         oTextArea.setValueStateText("");
        //     }
        // },

        // Submit remarks and form
        onSubmitReamrksData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before submitting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oData = {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: sRemarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: "SUBMITTED",
                approvalHistory: oTimelineModel.getData().results || []
            };

            // Add timeline entry for submission
            var oTimelineEntry = {
                role: "Submitter",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form submitted with Request Number: ${oPortalModel.reqNo}. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };
            oData.approvalHistory.push(oTimelineEntry);

            this._callService("/submitForm", "POST", oData)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form submitted successfully. Request Number: " + oPortalModel.reqNo);
                    this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                    this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                    this._resetForm();
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error submitting form: " + oError.message);
                });
        },

        // Approve action
        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before approving.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oData = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "APPROVED",
                remarks: sRemarks
            };

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            this._callService("/approveForm", "POST", oData)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + oError.message);
                });
        },

        // Reject action
        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before rejecting.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oData = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "REJECTED",
                remarks: sRemarks
            };

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            this._callService("/rejectForm", "POST", oData)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + oError.message);
                });
        },

        // Send back action
        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                MessageToast.show("Please enter remarks before sending back.");
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oData = {
                refNo: oPortalModel.refNo || oPortalModel.reqNo,
                reqNo: oPortalModel.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks
            };

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            this._callService("/sendBackForm", "POST", oData)
                .then(function () {
                    var aTimelineData = oTimelineModel.getProperty("/results");
                    aTimelineData.push(oTimelineEntry);
                    oTimelineModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + oError.message);
                });
        },

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "wbs", value: oPortalModel.wbs, label: "WBS" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requester" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            var oJustification = oRequestServiceModel.ssfdDtl;
            if (!oJustification.background || !oJustification.justification || !oJustification.deliverables) {
                MessageToast.show("All justification details (Background, Justification, Deliverables) are required.");
                bValid = false;
            }

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("timelinesslogdata").setData({
                results: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            this.getView().getModel("viewenableddatacheck").setData({
                enableRowActions: true,
                remarkModel: "",
                approvebuttonvisiblityData: false,
                sendbackbuttonvisiblity: false
            });
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    })
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + oError.message);
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                })
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + oError.message);
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + oError.message);
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATED CODE 5

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/TextArea",
    "sap/m/VBox"
], function (Controller, JSONModel, MessageToast, MessageBox, History, DateFormat, Dialog, Button, TextArea, VBox) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.capexrevex", {
        // Formatter functions
        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment" && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models and bindings
        onInit: function () {
            var oView = this.getView();

            // Initialize models
            var oPortalModel = new JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                paymentTerms: "term1",
                remarks: ""
            });

            var oFieldEnablementModel = new JSONModel({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            var oViewEnabledModel = new JSONModel({
                enableRowActions: true
            });

            var oSearchModel = new JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });

            var oRequestServiceModel = new JSONModel({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: "",
                    remarks: ""
                }
            });

            var oBudgetModel = new JSONModel({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            var oUploadDocModel = new JSONModel({
                attachments: []
            });

            var oTimelineModel = new JSONModel({
                results: [
                    {
                        role: "Submitter",
                        userName: "Jane Smith",
                        userEmail: "jane.smith@example.com",
                        remarks: "Form submitted with Request Number: REQ20250618093015",
                        createdAt: "2025-06-18T09:30:15Z",
                        userPicture: ""
                    },
                    {
                        role: "HOD",
                        userName: "Robert Brown",
                        userEmail: "robert.brown@example.com",
                        remarks: "Form approved by HOD",
                        createdAt: "2025-06-18T14:45:22Z",
                        userPicture: ""
                    },
                    {
                        role: "Finance",
                        userName: "Emily Johnson",
                        userEmail: "emily.johnson@example.com",
                        remarks: "Form approved for payment",
                        createdAt: "2025-06-19T10:15:30Z",
                        userPicture: ""
                    }
                ]
            });

            // Set models
            oView.setModel(oPortalModel, "portalModel");
            oView.setModel(oFieldEnablementModel, "fieldEnablement");
            oView.setModel(oViewEnabledModel, "viewenableddatacheck");
            oView.setModel(oSearchModel, "searchModel");
            oView.setModel(oRequestServiceModel, "Requestservicemodel");
            oView.setModel(oBudgetModel, "budgetModel");
            oView.setModel(oUploadDocModel, "UploadDocSrvTabData");
            oView.setModel(oTimelineModel, "timelinesslogdata");
        },

        // Handle route matched
        _onRouteMatched: function (oEvent) {
            var sRefNo = oEvent.getParameter("arguments").refNo;
            if (sRefNo) {
                this._loadFormData(sRefNo);
            } else {
                this._resetForm();
            }
        },

        // Load form data
        _loadFormData: function (sRefNo) {
            this._callService(`/formData/${sRefNo}`, "GET")
                .then(function (oResponse) {
                    var oData = oResponse.data || {};

                    this.getView().getModel("portalModel").setData({
                        reqNo: oData.reqNo || this._generateNewRequestNumber(),
                        paymentOption: oData.paymentOption || "",
                        paymentType: oData.paymentType || "",
                        poNonPo: oData.poNonPo || "",
                        paymentDate: oData.paymentDate || null,
                        accountingDocNumber: oData.accountingDocNumber || "",
                        po: oData.po || "",
                        vendorCode: oData.vendorCode || "",
                        costCenter: oData.costCenter || "",
                        wbs: oData.wbs || "",
                        totalAmount: oData.totalAmount || "",
                        vendorName: oData.vendorName || "",
                        invoiceNumber: oData.invoiceNumber || "",
                        baseAmount: oData.baseAmount || "",
                        gst: oData.gst || "",
                        tds: oData.tds || "",
                        buyerRequester: oData.buyerRequester || "",
                        buyerHod: oData.buyerHod || "",
                        buyerRequesterKey: oData.buyerRequesterKey || "",
                        buyerHodKey: oData.buyerHodKey || "",
                        paymentTerms: oData.paymentTerms || "",
                        remarks: oData.remarks || ""
                    });

                    this.getView().getModel("Requestservicemodel").setData({
                        refNo: sRefNo,
                        ssfdDtl: {
                            background: oData.background || "",
                            justification: oData.justification || "",
                            deliverables: oData.deliverables || "",
                            remarks: oData.remarks || ""
                        }
                    });

                    this.getView().getModel("budgetModel").setData({
                        items: oData.budgetItems || [
                            { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                            { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                            { nature: "Total", amount: 0, contingency: 0, total: 0 }
                        ]
                    });

                    this.getView().getModel("UploadDocSrvTabData").setData({
                        attachments: oData.attachments || []
                    });

                    this.getView().getModel("timelinesslogdata").setData({
                        results: oData.approvalHistory || []
                    });

                    this.getView().getModel("fieldEnablement").setData({
                        submitFieldsEnabled: oData.status !== "SUBMITTED",
                        fieldsEnabled: oData.status !== "SUBMITTED" && !(oData.paymentOption === "Advance Payment" && oData.poNonPo === "po"),
                        poEnabled: oData.poNonPo === "po"
                    });

                    this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", oData.status !== "SUBMITTED");

                    MessageToast.show("Form data loaded successfully!");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error loading form data: " + oError.message);
                });
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("dashboard");
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");

            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            var bFieldsEnabled = !(sPaymentOption === "Advance Payment" && sPoNonPo === "po");
            var bPoEnabled = sPoNonPo === "po";

            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/totalAmount", "");
                oPortalModel.setProperty("/paymentTerms", "");
            }

            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        // Save form as draft
        onSaveSanctionform: function () {
            if (!this._validateForm()) {
                return;
            }

            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();

            var oData = {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: "DRAFT"
            };

            this._callService("/saveDraft", "POST", oData)
                .then(function () {
                    MessageToast.show("Form saved as draft successfully. Request Number: " + oPortalModel.reqNo);
                })
                .catch(function (oError) {
                    MessageBox.error("Error saving draft: " + oError.message);
                });
        },

        // Create remarks dialog
        _createRemarksDialog: function () {
            var that = this;
            var oDialog = new Dialog({
                title: "Enter Remarks",
                contentWidth: "400px",
                content: [
                    new VBox({
                        items: [
                            new TextArea({
                                id: "remarksTextArea",
                                value: "{portalModel>/remarks}",
                                width: "100%",
                                rows: 5,
                                placeholder: "Enter your remarks here",
                                maxLength: 4000,
                                liveChange: function (oEvent) {
                                    var sValue = oEvent.getParameter("value");
                                    if (sValue.length > 4000) {
                                        this.setValueState("Error");
                                        this.setValueStateText("Maximum 4000 characters allowed.");
                                    } else {
                                        this.setValueState("None");
                                    }
                                }
                            })
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Save",
                    type: "Accept",
                    press: function () {
                        var sRemarks = that.getView().getModel("portalModel").getProperty("/remarks");
                        if (sRemarks && sRemarks.trim().length === 0) {
                            MessageToast.show("Remarks cannot be empty.");
                            return;
                        }
                        oDialog.close();
                        that._proceedWithSubmission();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    type: "Reject",
                    press: function () {
                        that.getView().getModel("portalModel").setProperty("/remarks", "");
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            // Add dialog to view's dependents
            this.getView().addDependent(oDialog);
            return oDialog;
        },

        // Submit form
        onSubmitSanctionform: function () {
            if (!this._validateForm()) {
                MessageBox.error("Please fill all required fields correctly.");
                return;
            }

            // Open remarks dialog
            var oDialog = this._createRemarksDialog();
            oDialog.open();
        },

        // Proceed with form submission after remarks are saved
        _proceedWithSubmission: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oBudgetModel = this.getView().getModel("budgetModel").getData();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData").getData();
            var oTimelineModel = this.getView().getModel("timelinesslogdata");

            var oData = {
                refNo: oRequestServiceModel.refNo,
                reqNo: oPortalModel.reqNo,
                paymentOption: oPortalModel.paymentOption,
                paymentType: oPortalModel.paymentType,
                poNonPo: oPortalModel.poNonPo,
                paymentDate: oPortalModel.paymentDate,
                accountingDocNumber: oPortalModel.accountingDocNumber,
                po: oPortalModel.po,
                vendorCode: oPortalModel.vendorCode,
                costCenter: oPortalModel.costCenter,
                wbs: oPortalModel.wbs,
                totalAmount: oPortalModel.totalAmount,
                vendorName: oPortalModel.vendorName,
                invoiceNumber: oPortalModel.invoiceNumber,
                baseAmount: oPortalModel.baseAmount,
                gst: oPortalModel.gst,
                tds: oPortalModel.tds,
                buyerRequester: oPortalModel.buyerRequester,
                buyerHod: oPortalModel.buyerHod,
                buyerRequesterKey: oPortalModel.buyerRequesterKey,
                buyerHodKey: oPortalModel.buyerHodKey,
                paymentTerms: oPortalModel.paymentTerms,
                remarks: oPortalModel.remarks,
                background: oRequestServiceModel.ssfdDtl.background,
                justification: oRequestServiceModel.ssfdDtl.justification,
                deliverables: oRequestServiceModel.ssfdDtl.deliverables,
                budgetItems: oBudgetModel.items,
                attachments: oUploadModel.attachments,
                status: "SUBMITTED",
                approvalHistory: oTimelineModel.getData().results || []
            };

            // Add timeline entry for submission
            var oTimelineEntry = {
                role: "Submitter",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form submitted with Request Number: ${oPortalModel.reqNo}. Remarks: ${oPortalModel.remarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };
            oData.approvalHistory.push(oTimelineEntry);

            MessageBox.confirm("Are you sure you want to submit this form? Request Number: " + oPortalModel.reqNo, {
                title: "Confirm Submission",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        this._callService("/submitForm", "POST", oData)
                            .then(function () {
                                // Update timeline model with new entry
                                var aTimelineData = oTimelineModel.getProperty("/results");
                                aTimelineData.push(oTimelineEntry);
                                oTimelineModel.refresh(true);

                                MessageToast.show("Form submitted successfully. Request Number: " + oPortalModel.reqNo);
                                this.getView().getModel("fieldEnablement").setProperty("/submitFieldsEnabled", false);
                                this.getView().getModel("fieldEnablement").setProperty("/fieldsEnabled", false);
                                this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", false);
                                this._resetForm();
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error submitting form: " + oError.message);
                            });
                    }
                }.bind(this)
            });
        },

        // Validate form
        _validateForm: function () {
            var oPortalModel = this.getView().getModel("portalModel").getData();
            var oRequestServiceModel = this.getView().getModel("Requestservicemodel").getData();
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            var bValid = true;

            var aRequiredFields = [
                { field: "paymentOption", value: oPortalModel.paymentOption, label: "Payment Option" },
                { field: "paymentType", value: oPortalModel.paymentType, label: "Payment Type" },
                { field: "poNonPo", value: oPortalModel.poNonPo, label: "PO/Non PO" },
                { field: "paymentDate", value: oPortalModel.paymentDate, label: "Payment Date" },
                { field: "vendorName", value: oPortalModel.vendorName, label: "Vendor Name" },
                { field: "invoiceNumber", value: oPortalModel.invoiceNumber, label: "Invoice Number" },
                { field: "costCenter", value: oPortalModel.costCenter, label: "Cost Center" },
                { field: "wbs", value: oPortalModel.wbs, label: "WBS" },
                { field: "baseAmount", value: oPortalModel.baseAmount, label: "Base Amount" },
                { field: "buyerRequester", value: oPortalModel.buyerRequester, label: "Buyer Requester" }
            ];

            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oPortalModel.gst, label: "GST" });
                aRequiredFields.push({ field: "tds", value: oPortalModel.tds, label: "TDS" });
            }

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(`${oField.label} is a required field.`);
                    bValid = false;
                } else if (["baseAmount", "gst", "tds"].includes(oField.field) && isNaN(parseFloat(oField.value))) {
                    MessageToast.show(`${oField.label} must be a valid number.`);
                    bValid = false;
                }
            });

            var oJustification = oRequestServiceModel.ssfdDtl;
            if (!oJustification.background || !oJustification.justification || !oJustification.deliverables) {
                bValid = false;
            }

            return bValid;
        },

        // Reset form
        _resetForm: function () {
            this.getView().getModel("portalModel").setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: null,
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            this.getView().getModel("Requestservicemodel").setData({
                refNo: "REF" + Date.now(),
                ssfdDtl: {
                    background: "",
                    justification: "",
                    deliverables: "",
                    remarks: ""
                }
            });

            this.getView().getModel("budgetModel").setData({
                items: [
                    { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                    { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                    { nature: "Total", amount: 0, contingency: 0, total: 0 }
                ]
            });

            this.getView().getModel("UploadDocSrvTabData").setData({
                attachments: []
            });

            this.getView().getModel("timelinesslogdata").setData({
                results: []
            });

            this.getView().getModel("fieldEnablement").setData({
                submitFieldsEnabled: true,
                fieldsEnabled: true,
                poEnabled: false
            });

            this.getView().getModel("viewenableddatacheck").setProperty("/enableRowActions", true);
        },

        // Handle buyer requester selection
        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerRequester", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerRequesterKey", oSelectedItem.getKey());
            }
        },

        // Handle buyer HOD selection
        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this.getView().getModel("portalModel").setProperty("/buyerHod", oSelectedItem.getText());
                this.getView().getModel("portalModel").setProperty("/buyerHodKey", oSelectedItem.getKey());
            }
        },

        // Handle live change in text areas
        handleLiveChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oEvent.getParameter("value");
            if (sValue.length > 4000) {
                oTextArea.setValueState("Error");
                oTextArea.setValueStateText("Maximum 4000 characters allowed.");
            } else {
                oTextArea.setValueState("None");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var fAmount = parseFloat(oInput.getValue()) || 0;
            var oItem = oInput.getBindingContext("budgetModel").getObject();
            oItem.contingency = fAmount * 0.05;
            oItem.total = fAmount + oItem.contingency;

            var oBudgetModel = this.getView().getModel("budgetModel");
            var aItems = oBudgetModel.getProperty("/items");
            var oTotalItem = aItems.find(function (item) { return item.nature === "Total"; });
            var fTotalAmount = aItems.reduce(function (sum, item) {
                return item.nature !== "Total" ? sum + (parseFloat(item.amount) || 0) : sum;
            }, 0);
            oTotalItem.amount = fTotalAmount;
            oTotalItem.contingency = fTotalAmount * 0.05;
            oTotalItem.total = fTotalAmount + oTotalItem.contingency;

            oBudgetModel.refresh(true);
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var oFormData = new FormData();
                oFormData.append("file", oFile);
                oFormData.append("parentType", "Request");

                this._uploadFile("/uploadAttachment", oFormData)
                    .then(function (oResponse) {
                        var aAttachments = oUploadModel.getProperty("/attachments");
                        aAttachments.push({
                            fileName: oFile.name,
                            uploadedOn: new Date().toISOString(),
                            uploadedBy: "Current User",
                            ID: oResponse.ID || Date.now().toString()
                        });
                        oUploadModel.refresh(true);
                        MessageToast.show("File uploaded successfully!");
                    })
                    .catch(function (oError) {
                        MessageBox.error("Error uploading file: " + oError.message);
                    });
            }
        },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();

            this._callService(`/downloadAttachment/${sID}`, "GET")
                .then(function (oResponse) {
                    var blob = new Blob([oResponse.data], { type: oResponse.contentType });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = sFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                })
                .catch(function (oError) {
                    MessageBox.error("Error downloading file: " + oError.message);
                });
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var sFileName = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "fileName";
            }).getValue();
            var sID = oButton.getCustomData().find(function (oCustomData) {
                return oCustomData.getKey() === "ID";
            }).getValue();
            var oUploadModel = this.getView().getModel("UploadDocSrvTabData");

            MessageBox.confirm(`Are you sure you want to delete ${sFileName}?`, {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._callService(`/deleteAttachment/${sID}`, "DELETE")
                            .then(function () {
                                var aAttachments = oUploadModel.getProperty("/attachments");
                                var iIndex = aAttachments.findIndex(function (item) { return item.ID === sID; });
                                if (iIndex !== -1) {
                                    aAttachments.splice(iIndex, 1);
                                    oUploadModel.refresh(true);
                                    MessageToast.show("File deleted successfully!");
                                }
                            }.bind(this))
                            .catch(function (oError) {
                                MessageBox.error("Error deleting file: " + oError.message);
                            });
                    }
                }.bind(this)
            });
        },

        // Mock service call
        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: {
                            refNo: oData?.refNo || "REF123456",
                            reqNo: oData?.reqNo || this._generateNewRequestNumber(),
                            paymentOption: oData?.paymentOption || "",
                            paymentType: oData?.paymentType || "",
                            poNonPo: oData?.poNonPo || "",
                            paymentDate: oData?.paymentDate || null,
                            accountingDocNumber: oData?.accountingDocNumber || "",
                            po: oData?.po || "",
                            vendorCode: oData?.vendorCode || "",
                            costCenter: oData?.costCenter || "",
                            wbs: oData?.wbs || "",
                            totalAmount: oData?.totalAmount || "",
                            vendorName: oData?.vendorName || "",
                            invoiceNumber: oData?.invoiceNumber || "",
                            baseAmount: oData?.baseAmount || "",
                            gst: oData?.gst || "",
                            tds: oData?.tds || "",
                            buyerRequester: oData?.buyerRequester || "",
                            buyerHod: oData?.buyerHod || "",
                            buyerRequesterKey: oData?.buyerRequesterKey || "",
                            buyerHodKey: oData?.buyerHodKey || "",
                            paymentTerms: oData?.paymentTerms || "",
                            remarks: oData?.remarks || "",
                            background: oData?.background || "",
                            justification: oData?.justification || "",
                            deliverables: oData?.deliverables || "",
                            budgetItems: oData?.budgetItems || [
                                { nature: "Item 1", amount: 0, contingency: 0, total: 0 },
                                { nature: "Item 2", amount: 0, contingency: 0, total: 0 },
                                { nature: "Total", amount: 0, contingency: 0, total: 0 }
                            ],
                            attachments: oData?.attachments || [],
                            approvalHistory: oData?.approvalHistory || [],
                            status: oData?.status || "DRAFT"
                        }
                    });
                }.bind(this), 500);
            }.bind(this));
        },

        // Mock file upload
        _uploadFile: function (sUrl, oFormData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({ ID: Date.now().toString() });
                }, 500);
            });
        }
    });
});

UPDATE CODE 4

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("infraproject.controller.Infra", {
        onInit: function () {
            // Initialize the portalModel with data
            var oPortalModel = new sap.ui.model.json.JSONModel({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: new Date().toISOString().substring(0, 10),
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                paymentTerms: "term1",
                remarks: ""
            });
            this.getView().setModel(oPortalModel, "portalModel");

            // Initialize the searchModel for Buyer Requester and Buyer HOD suggestions
            var oSearchModel = new sap.ui.model.json.JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });
            this.getView().setModel(oSearchModel, "searchModel");

            // Initialize the viewenableddatacheck model
            var oViewEnabledModel = new sap.ui.model.json.JSONModel({
                enableRowActions: true
            });
            this.getView().setModel(oViewEnabledModel, "viewenableddatacheck");

            // Initialize the fieldEnablement model
            var oFieldEnablementModel = new sap.ui.model.json.JSONModel({
                fieldsEnabled: true,
                poEnabled: true
            });
            this.getView().setModel(oFieldEnablementModel, "fieldEnablement");

            // Initial check for field enablement and label
            this._updateFieldEnablement();
        },

        _generateNewRequestNumber: function() {
            // Generate a new request number with timestamp to ensure uniqueness
            var now = new Date();
            var timestamp = now.getFullYear().toString().substr(-2) + 
                          (now.getMonth() + 1).toString().padStart(2, '0') + 
                          now.getDate().toString().padStart(2, '0') + 
                          now.getHours().toString().padStart(2, '0') + 
                          now.getMinutes().toString().padStart(2, '0') + 
                          now.getSeconds().toString().padStart(2, '0');
            return "REQ" + timestamp;
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteHome");
            }
        },

        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");

            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Disable GST, TDS, Total Amount, and Payment Terms if Payment Option is "Advance Payment" and PO/Non PO is "po"
            var bFieldsEnabled = !(sPaymentOption === "Advance Payment" && sPoNonPo === "po");
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);

            // If fields are disabled, clear their values
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/totalAmount", "");
                oPortalModel.setProperty("/paymentTerms", "");
            }

            // Disable PO field if Payment Option is "Regular Payment" or "Advance Payment"
            var bPoEnabled = !(sPaymentOption === "Regular Payment" || sPaymentOption === "Advance Payment");
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear PO field if disabled
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            if (sPaymentOption === "Advance Payment" && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        onSaveSanctionform: function () {
            if (this._validateForm()) {
                // Generate new request number
                var sNewReqNo = this._generateNewRequestNumber();
                this.getView().getModel("portalModel").setProperty("/reqNo", sNewReqNo);
                
                MessageBox.success("Form saved as draft successfully.\nNew Request Number: " + sNewReqNo, {
                    title: "Saved Successfully",
                    actions: [MessageBox.Action.OK],
                    onClose: function() {
                        // Optional: Any action after message is closed
                    }
                });
            }
        },        

        onSubmitSanctionform: function () {
            if (this._validateForm()) {
                // Generate new request number
                var sNewReqNo = this._generateNewRequestNumber();
                this.getView().getModel("portalModel").setProperty("/reqNo", sNewReqNo);
        
                MessageBox.confirm("Are you sure you want to submit this form?\nNew Request Number: " + sNewReqNo, {
                    title: "Confirm Submission",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            MessageBox.success("Form submitted successfully.\nRequest Number: " + sNewReqNo, {
                                title: "Submitted Successfully",
                                actions: [MessageBox.Action.OK],
                                onClose: function() {
                                    // Optional: Any action after submission
                                }
                            });
                            this._resetForm();
                        }
                    }.bind(this)
                });
            }
        },

        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerRequester", sText);
                oPortalModel.setProperty("/buyerRequesterKey", sKey);
            }
        },

        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerHod", sText);
                oPortalModel.setProperty("/buyerHodKey", sKey);
            }
        },

        _validateForm: function () {
            var oModel = this.getView().getModel("portalModel");
            var oData = oModel.getData();

            var aRequiredFields = [
                { field: "paymentOption", value: oData.paymentOption },
                { field: "paymentType", value: oData.paymentType },
                { field: "poNonPo", value: oData.poNonPo },
                { field: "paymentDate", value: oData.paymentDate },
                { field: "vendorName", value: oData.vendorName },
                { field: "invoiceNumber", value: oData.invoiceNumber },
                { field: "costCenter", value: oData.costCenter },
                { field: "wbs", value: oData.wbs },
                { field: "baseAmount", value: oData.baseAmount },
                { field: "buyerRequester", value: oData.buyerRequester },
                { field: "buyerHod", value: oData.buyerHod }
            ];

            // Only validate GST and TDS if they are enabled
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oData.gst });
                aRequiredFields.push({ field: "tds", value: oData.tds });
            }

            var bIsValid = true;

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(oField.field + " is a required field");
                    bIsValid = false;
                }
            });

            return bIsValid;
        },

        _resetForm: function () {
            // Reset the form to initial state with a new request number
            var oModel = this.getView().getModel("portalModel");
            oModel.setData({
                reqNo: this._generateNewRequestNumber(),
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: "",
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            // Reset field enablement
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            oFieldEnablementModel.setProperty("/fieldsEnabled", true);
            oFieldEnablementModel.setProperty("/poEnabled", true);
        }
    });
});

UPDATED CODE 3

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("infraproject.controller.Infra", {
        onInit: function () {
            // Initialize the portalModel with data as shown in the image
            var oPortalModel = new sap.ui.model.json.JSONModel({
                reqNo: "REQ12345",
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: "2025-06-16", // Current date as per system (June 16, 2025)
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                paymentTerms: "term1",
                remarks: "Payment for infrastructure project"
            });
            this.getView().setModel(oPortalModel, "portalModel");

            // Initialize the searchModel for Buyer Requester and Buyer HOD suggestions
            var oSearchModel = new sap.ui.model.json.JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });
            this.getView().setModel(oSearchModel, "searchModel");

            // Initialize the viewenableddatacheck model
            var oViewEnabledModel = new sap.ui.model.json.JSONModel({
                enableRowActions: true
            });
            this.getView().setModel(oViewEnabledModel, "viewenableddatacheck");

            // Initialize the fieldEnablement model
            var oFieldEnablementModel = new sap.ui.model.json.JSONModel({
                fieldsEnabled: true,
                poEnabled: true
            });
            this.getView().setModel(oFieldEnablementModel, "fieldEnablement");

            // Initial check for field enablement and label
            this._updateFieldEnablement();
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteHome");
            }
        },

        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");

            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            // Disable GST, TDS, Total Amount, and Payment Terms if Payment Option is "Advance Payment" and PO/Non PO is "po"
            var bFieldsEnabled = !(sPaymentOption === "Advance Payment" && sPoNonPo === "po");
            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);

            // If fields are disabled, clear their values
            if (!bFieldsEnabled) {
                oPortalModel.setProperty("/gst", "");
                oPortalModel.setProperty("/tds", "");
                oPortalModel.setProperty("/totalAmount", "");
                oPortalModel.setProperty("/paymentTerms", "");
            }

            // Disable PO field if Payment Option is "Regular Payment" or "Advance Payment"
            var bPoEnabled = !(sPaymentOption === "Regular Payment" || sPaymentOption === "Advance Payment");
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);

            // Clear PO field if disabled
            if (!bPoEnabled) {
                oPortalModel.setProperty("/po", "");
            }
        },

        formatInvoiceLabel: function (sPaymentOption, sPoNonPo) {
            // Change label to "Proforma Number" if Payment Option is "Advance Payment" and PO/Non PO is "po"
            if (sPaymentOption === "Advance Payment" && sPoNonPo === "po") {
                return "Proforma Number";
            }
            return "Invoice Number";
        },

        onSaveSanctionform: function () {
            // Validate form before saving
            if (this._validateForm()) {
                MessageToast.show("Form saved as draft successfully");
                // Add your save logic here (e.g., API call to save the form data)
            }
        },

        onSubmitSanctionform: function () {
            // Validate form before submitting
            if (this._validateForm()) {
                MessageBox.confirm("Are you sure you want to submit this form?", {
                    title: "Confirm Submission",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            MessageToast.show("Form submitted successfully");
                            this._resetForm();
                        }
                    }.bind(this)
                });
            }
        },

        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerRequester", sText);
                oPortalModel.setProperty("/buyerRequesterKey", sKey);
            }
        },

        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerHod", sText);
                oPortalModel.setProperty("/buyerHodKey", sKey);
            }
        },

        _validateForm: function () {
            var oModel = this.getView().getModel("portalModel");
            var oData = oModel.getData();

            var aRequiredFields = [
                { field: "paymentOption", value: oData.paymentOption },
                { field: "paymentType", value: oData.paymentType },
                { field: "poNonPo", value: oData.poNonPo },
                { field: "paymentDate", value: oData.paymentDate },
                { field: "vendorName", value: oData.vendorName },
                { field: "invoiceNumber", value: oData.invoiceNumber },
                { field: "costCenter", value: oData.costCenter },
                { field: "wbs", value: oData.wbs },
                { field: "baseAmount", value: oData.baseAmount },
                { field: "buyerRequester", value: oData.buyerRequester },
                { field: "buyerHod", value: oData.buyerHod }
            ];

            // Only validate GST and TDS if they are enabled
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var bFieldsEnabled = oFieldEnablementModel.getProperty("/fieldsEnabled");
            if (bFieldsEnabled) {
                aRequiredFields.push({ field: "gst", value: oData.gst });
                aRequiredFields.push({ field: "tds", value: oData.tds });
            }

            var bIsValid = true;

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(oField.field + " is a required field");
                    bIsValid = false;
                }
            });

            return bIsValid;
        },

        _resetForm: function () {
            // Reset the form to initial state, keeping some default values
            var oModel = this.getView().getModel("portalModel");
            oModel.setData({
                reqNo: "REQ12345",
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: "",
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });

            // Reset field enablement
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            oFieldEnablementModel.setProperty("/fieldsEnabled", true);
            oFieldEnablementModel.setProperty("/poEnabled", true);
        }
    });
});


UPDATED CODE 2 

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("infraproject.controller.Infra", {
        onInit: function () {
            // Initialize the portalModel with data as shown in the image
            var oPortalModel = new sap.ui.model.json.JSONModel({
                reqNo: "REQ12345",
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPo: "po",
                paymentDate: "2025-06-16", // Current date as per system (June 16, 2025)
                accountingDocNumber: "ACC123456",
                po: "PO789",
                vendorCode: "VEND456",
                costCenter: "CC123",
                wbs: "WBS456",
                totalAmount: "54000",
                vendorName: "Sample Vendor",
                invoiceNumber: "INV001",
                baseAmount: "50000",
                gst: "5000",
                tds: "1000",
                buyerRequester: "Requestor 1",
                buyerHod: "HOD 1",
                paymentTerms: "term1",
                remarks: "Payment for infrastructure project"
            });
            this.getView().setModel(oPortalModel, "portalModel");

            // Initialize the searchModel for Buyer Requester and Buyer HOD suggestions
            var oSearchModel = new sap.ui.model.json.JSONModel({
                requestors: [
                    { name: "Requestor 1", key: "req1" },
                    { name: "Requestor 2", key: "req2" }
                ],
                hods: [
                    { name: "HOD 1", key: "hod1" },
                    { name: "HOD 2", key: "hod2" }
                ]
            });
            this.getView().setModel(oSearchModel, "searchModel");

            // Initialize the viewenableddatacheck model
            var oViewEnabledModel = new sap.ui.model.json.JSONModel({
                enableRowActions: true
            });
            this.getView().setModel(oViewEnabledModel, "viewenableddatacheck");
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteHome");
            }
        },

        onSaveSanctionform: function () {
            // Validate form before saving
            if (this._validateForm()) {
                MessageToast.show("Form saved as draft successfully");
                // Add your save logic here (e.g., API call to save the form data)
            }
        },

        onSubmitSanctionform: function () {
            // Validate form before submitting
            if (this._validateForm()) {
                MessageBox.confirm("Are you sure you want to submit this form?", {
                    title: "Confirm Submission",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            MessageToast.show("Form submitted successfully");
                            this._resetForm();
                        }
                    }.bind(this)
                });
            }
        },

        onSuggestionItemSelectedBuyerRequester: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerRequester", sText);
                oPortalModel.setProperty("/buyerRequesterKey", sKey);
            }
        },

        onSuggestionItemSelectedBuyerHod: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();
                var oPortalModel = this.getView().getModel("portalModel");
                oPortalModel.setProperty("/buyerHod", sText);
                oPortalModel.setProperty("/buyerHodKey", sKey);
            }
        },

        _validateForm: function () {
            var oModel = this.getView().getModel("portalModel");
            var oData = oModel.getData();

            var aRequiredFields = [
                { field: "paymentOption", value: oData.paymentOption },
                { field: "paymentType", value: oData.paymentType },
                { field: "poNonPo", value: oData.poNonPo },
                { field: "paymentDate", value: oData.paymentDate },
                { field: "vendorName", value: oData.vendorName },
                { field: "invoiceNumber", value: oData.invoiceNumber },
                { field: "costCenter", value: oData.costCenter },
                { field: "wbs", value: oData.wbs },
                { field: "baseAmount", value: oData.baseAmount },
                { field: "gst", value: oData.gst },
                { field: "tds", value: oData.tds },
                { field: "buyerRequester", value: oData.buyerRequester },
                { field: "buyerHod", value: oData.buyerHod }
            ];

            var bIsValid = true;

            aRequiredFields.forEach(function (oField) {
                if (!oField.value || oField.value === "") {
                    MessageToast.show(oField.field + " is a required field");
                    bIsValid = false;
                }
            });

            return bIsValid;
        },

        _resetForm: function () {
            // Reset the form to initial state, keeping some default values
            var oModel = this.getView().getModel("portalModel");
            oModel.setData({
                reqNo: "REQ12345",
                paymentOption: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: "",
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                costCenter: "",
                wbs: "",
                totalAmount: "",
                vendorName: "",
                invoiceNumber: "",
                baseAmount: "",
                gst: "",
                tds: "",
                buyerRequester: "",
                buyerHod: "",
                buyerRequesterKey: "",
                buyerHodKey: "",
                paymentTerms: "",
                remarks: ""
            });
        }
    });
});
UPDATED CODE

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("infraproject.controller.Infra", {

        onInit: function() {
            // Initialize any required data or models
        },

        onNavBack: function() {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteHome");
            }
        },

        onSaveForm: function() {
            // Validate form before saving
            if (this._validateForm()) {
                MessageToast.show("Form saved successfully");
                // Add your save logic here
            }
        },

        onSubmitForm: function() {
            // Validate form before submitting
            if (this._validateForm()) {
                MessageBox.confirm("Are you sure you want to submit this form?", {
                    title: "Confirm Submission",
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            MessageToast.show("Form submitted successfully");
                            // Add your submission logic here
                        }
                    }
                });
            }
        },

        _validateForm: function() {
            // Since all fields are read-only in this implementation,
            // validation is not strictly necessary
            return true;
        }
    });
});




OLD CODE
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.mmapprovalhub.approvalhub.controller.CapexandRevex", {
        onInit() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("CapexandRevex").attachPatternMatched(this._onRouteCapexandRevexController, this);
        },
        onDashboardui: function(){
            var Name = this._capexandrevexNameUI;
            if(Name === "INTP"){
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("DashboardUI", {
                    Name: "INTP"
                });
            }
        },
        _onRouteCapexandRevexController: function(oEvent){
            var oArgs = oEvent.getParameter("arguments");
            var basedNameUI = oArgs.basedNameUI;
          this._capexandrevexNameUI = basedNameUI;
          this.onPaymentTypeDataFetch();
          this.onPaymentTermsDataFetch();

        },
        onPaymentTermsDataFetch: function(){
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
            oModelV2.read("/ControlValues", {
                urlParameters: {
                  "$filter": "category eq '" + "PaymentTerms" + "'"
                },
                success: function (oData) {
                  if (oData) {
                    var oJSONModel = new sap.ui.model.json.JSONModel(oData);
                    oView.setModel(oJSONModel, "PaymentTermsDataFetch");
                  }
                },
                error: function (oError) {
                  sap.m.MessageToast.show("Failed to load data.", oError);
                }
              });

        },
        onPaymentTypeDataFetch: function(){
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
            oModelV2.read("/ControlValues", {
                urlParameters: {
                  "$filter": "category eq '" + "PaymentType" + "'"
                },
                success: function (oData) {
                  if (oData) {
                    var oJSONModel = new sap.ui.model.json.JSONModel(oData);
                    oView.setModel(oJSONModel, "PaymentTypeDataFetch");
                  }
                },
                error: function (oError) {
                  sap.m.MessageToast.show("Failed to load data.", oError);
                }
              });

        },
        onPaymentOptionChange: function (oEvent) {
            var sSelectedKey = oEvent.getSource().getSelectedKey();
            if (sSelectedKey === "Advanced Payment") {
                this.byId("TDSInput").setEditable(false);
                this.byId("TotalAmountInput").setEditable(false);
                this.byId("PaymentTermsId").setEditable(false);
                this.byId("GSTInput").setEditable(false);
                var oPoNonPoCombo = this.byId("PONonPoid");
                if (oPoNonPoCombo) {
                    oPoNonPoCombo.setSelectedKey("PO Based");
                    // oPoNonPoCombo.setEnabled(false);
                }
            } else {
                this.byId("TDSInput").setEditable(true);
                this.byId("TotalAmountInput").setEditable(true);
                this.byId("PaymentTermsId").setEditable(true);
                this.byId("GSTInput").setEditable(true);
                this.byId("PONonPoid").setSelectedKey("");
            }
        }
    });
});
