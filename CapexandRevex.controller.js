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
