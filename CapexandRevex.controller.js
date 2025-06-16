UPDATED CODE 2 

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("infraproject.controller.Infra", {
        onInit: function () {
            // Initialize the model with default data
            var oModel = new sap.ui.model.json.JSONModel({
                requesterTokenName: "50002151 - PRIYATHAM TELAPROLU",
                department: "TEMP",
                date: "2023-08-02",
                reqNo: "REQ12345",
                paymentOption: "Advance Payment",
                paymentType: "Capex",
                poNonPO: "po",
                paymentDate: "2025-06-16", // Current date as per system
                vendorName: "",
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                invoiceNumber: "",
                costCenter: "",
                wbs: "",
                baseAmount: "",
                gst: "",
                tds: "",
                totalAmount: "",
                paymentTerms: "term1",
                buyerHOD: "hod1",
                buyerRequester: "req1",
                remarks: ""
            });
            this.getView().setModel(oModel, "PortalModel");
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

        onSaveForm: function () {
            // Validate form before saving
            if (this._validateForm()) {
                MessageToast.show("Form saved successfully");
                // Add your save logic here
            }
        },

        onSubmitForm: function () {
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

        _validateForm: function () {
            var oModel = this.getView().getModel("PortalModel");
            var oData = oModel.getData();

            var aRequiredFields = [
                { field: "requesterTokenName", value: oData.requesterTokenName },
                { field: "department", value: oData.department },
                { field: "paymentOption", value: oData.paymentOption },
                { field: "paymentType", value: oData.paymentType },
                { field: "poNonPO", value: oData.poNonPO },
                { field: "paymentDate", value: oData.paymentDate },
                { field: "vendorName", value: oData.vendorName },
                { field: "invoiceNumber", value: oData.invoiceNumber },
                { field: "costCenter", value: oData.costCenter },
                { field: "wbs", value: oData.wbs },
                { field: "baseAmount", value: oData.baseAmount },
                { field: "buyerHOD", value: oData.buyerHOD },
                { field: "buyerRequester", value: oData.buyerRequester }
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
            // Reset the form to initial state
            var oModel = this.getView().getModel("PortalModel");
            oModel.setData({
                requesterTokenName: "50002151 - PRIYATHAM TELAPROLU",
                department: "TEMP",
                date: "2023-08-02",
                reqNo: "REQ12345",
                paymentOption: "",
                paymentType: "",
                poNonPO: "",
                paymentDate: "",
                vendorName: "",
                accountingDocNumber: "",
                po: "",
                vendorCode: "",
                invoiceNumber: "",
                costCenter: "",
                wbs: "",
                baseAmount: "",
                gst: "",
                tds: "",
                totalAmount: "",
                paymentTerms: "",
                buyerHOD: "",
                buyerRequester: "",
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
