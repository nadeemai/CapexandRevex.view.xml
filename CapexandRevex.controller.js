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
