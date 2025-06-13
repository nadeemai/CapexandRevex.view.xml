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
