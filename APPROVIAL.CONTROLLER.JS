sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, History, Fragment) {
    "use strict";

    return Controller.extend("com.capexrevex.capexravex.controller.Approval", {
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

        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            this._oRouter.getRoute("approval").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var sFormData = decodeURIComponent(oArguments.formData);
            var oFormData = JSON.parse(sFormData);

            // Set form data model
            var oFormDataModel = new JSONModel(oFormData);
            this.getView().setModel(oFormDataModel, "formData");

            // Initialize view model for remarks dialog
            var oViewModel = new JSONModel({
                remarkModel: ""
            });
            this.getView().setModel(oViewModel, "viewenableddatacheck");
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo("capexrevex");
            }
        },

        onApprovedData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                this._openRemarksDialog("approve");
                return;
            }

            var oFormDataModel = this.getView().getModel("formData");
            var oFormData = oFormDataModel.getData();

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form approved. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oFormData.refNo || oFormData.reqNo,
                reqNo: oFormData.reqNo,
                status: "APPROVED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/approveForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oFormDataModel.getProperty("/approvalHistory");
                    aTimelineData.push(oTimelineEntry);
                    oFormDataModel.refresh(true);

                    MessageToast.show("Form approved successfully.");
                    this._oRemarksDialog.close();
                    this._oRouter.navTo("dashboard");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error approving form: " + (oError.message || "Unknown error"));
                });
        },

        onRejectData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                this._openRemarksDialog("reject");
                return;
            }

            var oFormDataModel = this.getView().getModel("formData");
            var oFormData = oFormDataModel.getData();

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form rejected. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oFormData.refNo || oFormData.reqNo,
                reqNo: oFormData.reqNo,
                status: "REJECTED",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/rejectForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oFormDataModel.getProperty("/approvalHistory");
                    aTimelineData.push(oTimelineEntry);
                    oFormDataModel.refresh(true);

                    MessageToast.show("Form rejected successfully.");
                    this._oRemarksDialog.close();
                    this._oRouter.navTo("dashboard");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error rejecting form: " + (oError.message || "Unknown error"));
                });
        },

        onSendbackData: function () {
            var sRemarks = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            if (!sRemarks) {
                this._openRemarksDialog("sendback");
                return;
            }

            var oFormDataModel = this.getView().getModel("formData");
            var oFormData = oFormDataModel.getData();

            var oTimelineEntry = {
                role: "Approver",
                userName: "John Doe",
                userEmail: "john.doe@example.com",
                remarks: `Form sent back. Remarks: ${sRemarks}`,
                createdAt: new Date().toISOString(),
                userPicture: ""
            };

            var oPayload = {
                refNo: oFormData.refNo || oFormData.reqNo,
                reqNo: oFormData.reqNo,
                status: "SENT_BACK",
                remarks: sRemarks,
                approvalHistory: [oTimelineEntry]
            };

            this._callService("/sendBackForm", "POST", oPayload)
                .then(function () {
                    var aTimelineData = oFormDataModel.getProperty("/approvalHistory");
                    aTimelineData.push(oTimelineEntry);
                    oFormDataModel.refresh(true);

                    MessageToast.show("Form sent back successfully.");
                    this._oRemarksDialog.close();
                    this._oRouter.navTo("capexrevex");
                }.bind(this))
                .catch(function (oError) {
                    MessageBox.error("Error sending back form: " + (oError.message || "Unknown error"));
                });
        },

        _openRemarksDialog: function (sAction) {
            if (!this._oRemarksDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.capexrevex.capexravex.view.RemarksDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oRemarksDialog = oDialog;
                    this.getView().addDependent(this._oRemarksDialog);
                    this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                    this._oRemarksDialog.data("action", sAction);
                    this._oRemarksDialog.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
                this._oRemarksDialog.data("action", sAction);
                this._oRemarksDialog.open();
            }
        },

        onSubmitReamrksData: function () {
            var sAction = this._oRemarksDialog.data("action");
            if (sAction === "approve") {
                this.onApprovedData();
            } else if (sAction === "reject") {
                this.onRejectData();
            } else if (sAction === "sendback") {
                this.onSendbackData();
            }
        },

        onCloseReamrksFrag: function () {
            this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this._oRemarksDialog.close();
        },

        _callService: function (sUrl, sMethod, oData) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({
                        status: "Success",
                        data: oData
                    });
                }, 500);
            });
        }
    });
});
