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
            return sPaymentOption === "Advance Payment" ? "Proforma Number" : "Invoice Number";
        },

        
        formatTimelineTitle: function (sRole, sUserName, sUserEmail) {
            return sRole ? `${sRole}: ${sUserName} (${sUserEmail})` : `${sUserName} (${sUserEmail})`;
        },

        // Lifecycle method: Initialize models, bindings, and router
        onInit: function () {

            //viewmatrix

            // timeline
            var oTimelineData = {};
            var oTimelineModel = new JSONModel(oTimelineData);
            this.getView().setModel(oTimelineModel, "timelinelogdataallApporval");
            var oViewModel = new JSONModel({
                remarkModel: "",
                relesedatabuttonvisiblity: false,

            });
            this.getView().setModel(oViewModel, "viewenableddatacheck");
            
            //route
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("CAPEX_AND_REVEX").attachPatternMatched(this._onRouteCAPEX_AND_REVEXController, this);
            oRouter.getRoute("CAPEX_AND_REVEXReqID").attachPatternMatched(this._onRouteCAPEX_AND_REVEXReqID, this);
            oRouter.getRoute("CAPEX_AND_REVEXReqIDApprover").attachPatternMatched(this._onRouteCAPEX_AND_REVEXReqIDApprover, this);

            // Initialize remarks dialog
            this.remarksDialog = sap.ui.xmlfragment(this.getView().getId(), "com.mmapprovalhub.approvalhub.Fragments.remarks", this);
            this.getView().addDependent(this.remarksDialog);


            this.onbuyerRequestor();
            this.onbuyerHOD();
            this.onpaymentType();
            this.onpaymentOption();
            this.onpoNonPO();
            this.onPaymentTerms();
            
      
            //from hrere reomveit ''

        },

        onGetCurrUserforUploadonInitiator: function () {
            var that = this;
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
       
            oModel.read("/getCurrentUser", {
              urlParameters: {
                role: 'Initiator'
              },
              success: function (oData) {
                that.uploadbyEmail = oData.email;
                var oUserModel = new sap.ui.model.json.JSONModel(oData);
                that.getView().setModel(oUserModel, "CurrentUser");
              },
              error: function (oError) {
                console.error("Error fetching current user:", oError);
              }
            });
       
            },
            


            formatUserDisplay: function (userID, name) {
                return userID + " - " + name;
            },
            
            formatDepartmentDisplay: function (department) {
                return department;
            },

            setCurrentDateForDatePicker: function () {
                var oToday = new Date();
            
                var yyyy = oToday.getFullYear();
                var mm = String(oToday.getMonth() + 1).padStart(2, '0'); 
                var dd = String(oToday.getDate()).padStart(2, '0');
                var sFormattedDate = yyyy + "-" + mm + "-" + dd;
      
                var oViewModel = new sap.ui.model.json.JSONModel({
                    currentDate: sFormattedDate
                });
            
                this.getView().setModel(oViewModel, "viewModel");
            },

        // Route handler for CAPEX_AND_REVEX
        _onRouteCAPEX_AND_REVEXController: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            this._CAPEXREVEXNameUI = oArgs.basedNameUICAPEXREVEX;
            var onInitiateValue = localStorage.getItem("onInitiateValue");

            this._onSubType = onInitiateValue;
            this._reqIDData = "";
            this._ApprovedCheck = "";

            this.onGetCurrUserforUploadonInitiator();

            this.setCurrentDateForDatePicker();

            var oViewModel = this.getView().getModel("viewenableddatacheck");

            var oView = this.getView();
                        
            oView.byId("SaveCapexravexForm").setEnabled(true);
            oView.byId("SubmitCapexravexForm").setEnabled(true);
            oView.byId("ApprovedCapexravexForm").setVisible(false);
            oView.byId("SendbackCapexravexForm").setVisible(false);
        
            // oView.byId("CapexRevexForm").setEditable(false);
        
            var aFieldIds = [
                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
            ];
        
            aFieldIds.forEach(function (sId) {
                var oControl = oView.byId(sId);
                if (oControl && oControl.setEditable) {
                    oControl.setEditable(true);
                }
            });

            // oViewModel.setProperty("/enableRowActions", true);
            // oViewModel.setProperty("/enableIRR", false);
            // oViewModel.setProperty("/approverRequiredVisible", false);
            // oViewModel.setProperty("/isApproverScreen", false);
            // oViewModel.setProperty("/enableRowActionsapproval", false);

            var oRequestServiceModel = this.getOwnerComponent().getModel("Requestservicemodel");
            if (!oRequestServiceModel) {
                oRequestServiceModel = new sap.ui.model.json.JSONModel();
                this.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
            }

            var oEmptyData = {
                refNo: "",
                requesterName: "",
                department: "",
                paymentType: "",
                poNonPo: "",
                paymentDate: "",
                vendorCode: "",
                vendorName: "",
                paymentTerms: "",
                invoiceNumber: "",
                gst: "",
                ipmDtl: []
            };
            oRequestServiceModel.setData(oEmptyData);

 
            // this.onfetchDepartmentDataandTime();
        },

        onfetchDepartmentDataandTime: function () {
            var that = this;
            $.ajax({
                url: "/Createusertype",
                method: "GET",
                success: function (oData) {
                    if (oData && oData.requesterToken && oData.department) {
                        var oPortalModel = that.getView().getModel("portalModel");
                        oPortalModel.setProperty("/requesterToken", oData.requesterToken);
                        oPortalModel.setProperty("/department", oData.department);

                        // Set today's date as yyyy-MM-dd
                        var oToday = new Date();
                        var sDate = oToday.toISOString().split("T")[0];
                        oPortalModel.setProperty("/date", sDate);
                    }
                },
                error: function (err) {
                    MessageBox.error("Failed to fetch user details from /Createusertype endpoint.");
                }
            });
        },


        onbuyerRequestor: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/Approvers", {
                urlParameters: {
                    "$filter": "role eq 'CAPX_Requestor'"
                },
                success: function (oData) {
                    oView.setModel(new sap.ui.model.json.JSONModel(oData), "buyerRequestorModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load Buyer Requestor values.");
                    console.error("onbuyerRequestor error:", oError);
                }
            });
        },

        onbuyerHOD: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/Approvers", {
                urlParameters: {
                    "$filter": "role eq 'CAPX_HOD'"
                },
                success: function (oData) {
                    oView.setModel(new sap.ui.model.json.JSONModel(oData), "buyerHODModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load Buyer HOD values.");
                    console.error("onbuyerHOD error:", oError);
                }
            });
        },
        
        onpaymentType: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/ControlValues", {
                urlParameters: {
                    "$filter": "category eq 'CAPEX_Payment_Type'"
                },
                success: function (oData) {
                    oView.setModel(new sap.ui.model.json.JSONModel(oData), "paymentTypeModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load Payment Type values.");
                    console.error("onpaymentType error:", oError);
                }
            });
        },
        onpaymentOption: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/ControlValues", {
                urlParameters: {
                    "$filter": "category eq 'CAPEX_PaymentMethod'"
                },
                success: function (oData) {
                    oView.setModel(new sap.ui.model.json.JSONModel(oData), "paymentOptionModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load Payment Option values.");
                    console.error("onpaymentOption error:", oError);
                }
            });
        },
        onpoNonPO: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/ControlValues", {
                urlParameters: {
                    "$filter": "category eq 'CAPEX_PO/NonPO'"
                },
                success: function (oData) {
                    oView.setModel(new sap.ui.model.json.JSONModel(oData), "poNonPOModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load PO/Non-PO values.");
                    console.error("onpoNonPO error:", oError);
                }
            });
        },

        onPaymentTerms: function () {
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/ControlValues", {
                urlParameters: {
                    "$filter": "category eq 'PaymentTerms'"
                },
                success: function (oData) {
                    var oJSONModel = new sap.ui.model.json.JSONModel(oData);
                    oView.setModel(oJSONModel, "paymentTermsModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load Payment Terms values.");
                    console.error("onPaymentTerms error:", oError);
                }
            });
        },

    //  // Fetch timeliness data
    //  onFetchTimelinessData: function () {
    //     var reqid = this._reqIDData;
    //     var oView = this.getView();
    //     var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

    //     oModelV2.read("/ProcessLogs", {
    //         filters: [
    //             new sap.ui.model.Filter("reqID", sap.ui.model.FilterOperator.EQ, reqid)
    //         ],
    //         urlParameters: {
    //             "$orderby": "createdAt desc"
    //         },
    //         success: function (oData) {
    //             if (oData && oData.results) {
    //                 var aProcessedData = oData.results.map(function (oLog) {
    //                     return {
    //                         createdAt: oLog.createdAt,
    //                         role: oLog.stage ? "[" + oLog.stage + "]" : "[N/A]",
    //                         userName: oLog.userName || "Unknown User",
    //                         userEmail: oLog.userEmail || "N/A",
    //                         remarks: oLog.remarks || "No remarks provided"
    //                     };
    //                 });

    //                 var initiatorIndex = aProcessedData.findIndex(function (item) {
    //                     return item.role.toLowerCase().includes("initiator");
    //                 });

    //                 if (initiatorIndex > -1) {
    //                     var initiatorEntry = aProcessedData.splice(initiatorIndex, 1)[0];
    //                     aProcessedData.push(initiatorEntry);
    //                 }

    //                 var oJSONModel = new JSONModel({
    //                     results: aProcessedData
    //                 });
    //                 oView.setModel(oJSONModel, "timelinesslogdata");
    //             }
    //         },
    //         error: function (oError) {
    //             MessageToast.show("Failed to load process log data.", { position: "bottom center" });
    //             // console.error("Error fetching timeliness data:", oError);
    //         }
    //     });
    // },

        // onFetchTimelinessData: function () {
        //     var reqid = this._reqIDData;
        //     var oView = this.getView();
        //     var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

        //     oModelV2.read("/ProcessLogs", {
        //         filters: [
        //             new sap.ui.model.Filter("reqID", sap.ui.model.FilterOperator.EQ, reqid)
        //         ],
        //         urlParameters: {
        //             "$orderby": "createdAt desc"
        //         },
        //         success: function (oData) {
        //             if (oData && oData.results) {
        //                 var aProcessedData = oData.results.map(function (oLog) {
        //                     return {
        //                         createdAt: oLog.createdAt,
        //                         role: oLog.stage ? "[" + oLog.stage + "]" : "[N/A]",
        //                         userName: oLog.userName || "Unknown User",
        //                         userEmail: oLog.userEmail || "N/A",
        //                         remarks: oLog.remarks || "No remarks provided"
        //                     };
        //                 });

        //                 // Find and move Initiator to bottom
        //                 var initiatorIndex = aProcessedData.findIndex(function (item) {
        //                     return item.role.toLowerCase().includes("initiator");
        //                 });

        //                 if (initiatorIndex > -1) {
        //                     var initiatorEntry = aProcessedData.splice(initiatorIndex, 1)[0];
        //                     aProcessedData.push(initiatorEntry);
        //                 }

        //                 var oJSONModel = new sap.ui.model.json.JSONModel({
        //                     results: aProcessedData
        //                 });
        //                 oView.setModel(oJSONModel, "timelinesslogdata");
        //             }
        //         },
        //         error: function (oError) {
        //             sap.m.MessageToast.show("Failed to load process log data.", { position: "bottom center" });
        //             console.error("Error fetching timeliness data:", oError);
        //         }
        //     });
        // },

        // formatTimelineTitle: function (role, userName, userEmail) {
        //     return role + " " + userName + " (" + userEmail + ")";
        // },

        onFetchTimelinessData: function() {
            // var reqid = reqidNo;
            var reqid = this._reqIDData;
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
           
            oModelV2.read("/ProcessLogs", {
                filters: [
                    new sap.ui.model.Filter("reqID", sap.ui.model.FilterOperator.EQ, reqid)
                ],
                sorters: [
                    new sap.ui.model.Sorter("receivedDt", false)
                ],
                success: function(oData) {
                    if (oData && oData.results) {
                        var aProcessedData = oData.results.map(function(oLog) {
                            var statusKey = oLog.status ? oLog.status.trim().toUpperCase() : "";
                            var visualStatus = "None";
           
                    switch (statusKey) {
                        case "APPROVED":
                        case "SUBMITTED":
                            visualStatus = "Success";
                            break;
                        case "PENDING":
                            visualStatus = "Warning";  
                            break;
                         
                        case "SEND BACK":
                            visualStatus = "Error";    
                            break;
                        case "INITIATED":
                            visualStatus = "Success";    
                            break;
                        case "":
                            visualStatus = "None";    
                            break;    
                        default:
                            visualStatus = "None";    
                            break;
                    }
                     
                            return {
                                createdAt: oLog.createdAt,
                                role: oLog.stage ? "[" + oLog.stage + "]" : "[N/A]",
                                userName: oLog.userName || "Unknown User",
                                userEmail: oLog.userEmail || "N/A",
                                remarks: oLog.remarks || "",
                                status: visualStatus
                            };
                        });
           
                        // Find and move Initiator to bottom
                        var initiatorIndex = aProcessedData.findIndex(function(item) {
                            return item.role.toLowerCase().includes("initiator");
                        });
           
                        if (initiatorIndex > -1) {
                            var initiatorEntry = aProcessedData.splice(initiatorIndex, 1)[0];
                            aProcessedData.push(initiatorEntry);
                        }
           
                        var oJSONModel = new sap.ui.model.json.JSONModel({
                            results: aProcessedData
                        });
                        oView.setModel(oJSONModel, "timelinesslogdata");
                    }
                },
                error: function(oError) {
                    sap.m.MessageToast.show("Failed to load process log data.", { position: "bottom center" });
                    console.error("Error fetching timeliness data:", oError);
                }
            });
          },
           
           
          formatTimelineTitle: function(role, userName, userEmail) {
            return role + " " + userName + " (" + userEmail + ")";
          },
           
          formatDateTimeWithRemarks: function(createdAt, remarks) {
            if (!createdAt) return "";
            const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                style: "medium",
                strictParsing: true,
                UTC: false
            });
            const sDate = oDateFormat.format(new Date(createdAt));
            if (!remarks || remarks.trim() === "") {
                return sDate + " - Not Yet Approved";
            }
           
            return sDate;
          },

        // Route handler for CAPEX_AND_REVEXReqID
        _onRouteCAPEX_AND_REVEXReqID: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            this._CAPEX_AND_REVEX = oArgs.basedNameUICAPEX_AND_REVEX;
            var reqID = oArgs.reqID;
            this._reqIDData = reqID;
            this._ApprovedCheck = "";
            this.onPaymentDetailsChange();

            this.onGetCurrUserforUploadonInitiator();

            this.setCurrentDateForDatePicker();

            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
        
            var that = this;

            oModelV2.read("/Requests", {
                urlParameters: {
                    "$filter": "reqID eq '" + reqID + "'",
                    "$expand": "ipmDtl"
                },
                success: function (oData) {
                    if (oData && oData.results.length > 0) {
                        let oRequestServiceModel = that.getOwnerComponent().getModel("Requestservicemodel") || new sap.ui.model.json.JSONModel();
                        that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        oRequestServiceModel.setData(oData.results[0]);
                        var statusDatacheck = oData.results[0].status;
                        var oStage = oData.results[0].stage;
                        that.statusData = statusDatacheck;

                        var oViewModel = that.getView().getModel("viewenableddatacheck");

                        if (statusDatacheck === "Pending" && oStage === "Buyer Requester") {
                            var oView = that.getView();
                        
                            oView.byId("SaveCapexravexForm").setEnabled(false);
                            oView.byId("SubmitCapexravexForm").setEnabled(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(false);
                            oView.byId("SendbackCapexravexForm").setVisible(false);
                        
                            // oView.byId("CapexRevexForm").setEditable(false);
                        
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                            
                        }else if (statusDatacheck === "Pending" && oStage === "Buyer HOD") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setEnabled(false);
                            oView.byId("SubmitCapexravexForm").setEnabled(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(false);
                            oView.byId("SendbackCapexravexForm").setVisible(false);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }else if (statusDatacheck === "Pending" && oStage === "Finance") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setEnabled(false);
                            oView.byId("SubmitCapexravexForm").setEnabled(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(false);
                            oView.byId("SendbackCapexravexForm").setVisible(false);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }else if (statusDatacheck === "Approved") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setEnabled(false);
                            oView.byId("SubmitCapexravexForm").setEnabled(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(false);
                            oView.byId("SendbackCapexravexForm").setVisible(false);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }

                        // Initialize dropdown model
                        var oDropdownModel = new sap.ui.model.json.JSONModel({
                            departments: [],
                            paymentTypes: [],
                            poNonPOs: [],
                            paymentDates: [],
                            vendors: [],
                            paymentTerms: []
                        });
                        that.getView().setModel(oDropdownModel, "dropdownModel");

                        // Set initial dropdown data
                        that._setDropdownData();

                        // Bind dropdowns to the view
                        that._bindDropdowns();

                        // Retain remaining conditions as shown in the image
                        that.onFetchTimelinessData();
                        // that.onAttchmentDataFetch();
                        // that.onBudgetDetailDataFetch(reqID);
                    } else {
                        sap.m.MessageToast.show("No data found for Req ID: " + reqID, { position: "bottom center" });
                    }
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load request data.", { position: "bottom center" });
                    console.error("Error fetching request data:", oError);
                }
            });
        },

        _setDropdownData: function () {
            var oDropdownModel = this.getView().getModel("dropdownModel");

            // Simulated data for Department
            oDropdownModel.setProperty("/departments", [
                { deptId: "D001", deptName: "Finance" },
                { deptId: "D002", deptName: "HR" },
                { deptId: "D003", deptName: "Operations" }
            ]);

            // Simulated data for Payment Type
            oDropdownModel.setProperty("/paymentTypes", [
                { typeId: "PT001", typeName: "Capex" },
                { typeId: "PT002", typeName: "Revex" }
            ]);

            // Simulated data for PO/Non PO
            oDropdownModel.setProperty("/poNonPOs", [
                { poId: "PO001", poName: "PO Based" },
                { poId: "PO002", poName: "Non PO" }
            ]);

            // Simulated data for Payment Date
            oDropdownModel.setProperty("/paymentDates", [
                { dateId: "PD001", dateName: "02-08-2023" },
                { dateId: "PD002", dateName: "03-08-2023" }
            ]);

            // Simulated data for Vendor
            oDropdownModel.setProperty("/vendors", [
                { vendorId: "V001", vendorName: "Vendor A" },
                { vendorId: "V002", vendorName: "Vendor B" }
            ]);

            // Simulated data for Payment Terms
            oDropdownModel.setProperty("/paymentTerms", [
                { termId: "PT001", termName: "Net 30" },
                { termId: "PT002", termName: "Net 60" }
            ]);
        },

        _bindDropdowns: function () {
            var oView = this.getView();
            var oDropdownModel = oView.getModel("dropdownModel");

            // Bind Department dropdown
            var oDepartmentDropdown = oView.byId("departmentDropdown");
            if (oDepartmentDropdown) {
                oDepartmentDropdown.setModel(oDropdownModel);
                oDepartmentDropdown.bindItems({
                    path: "/departments",
                    template: new sap.ui.core.Item({
                        key: "{deptId}",
                        text: "{deptName}"
                    })
                });
            }

            // Bind Payment Type dropdown
            var oPaymentTypeDropdown = oView.byId("paymentTypeDropdown");
            if (oPaymentTypeDropdown) {
                oPaymentTypeDropdown.setModel(oDropdownModel);
                oPaymentTypeDropdown.bindItems({
                    path: "/paymentTypes",
                    template: new sap.ui.core.Item({
                        key: "{typeId}",
                        text: "{typeName}"
                    })
                });
            }

            // Bind PO/Non PO dropdown
            var oPoNonPODropdown = oView.byId("poNonPODropdown");
            if (oPoNonPODropdown) {
                oPoNonPODropdown.setModel(oDropdownModel);
                oPoNonPODropdown.bindItems({
                    path: "/poNonPOs",
                    template: new sap.ui.core.Item({
                        key: "{poId}",
                        text: "{poName}"
                    })
                });
            }

            // Bind Payment Date dropdown
            var oPaymentDateDropdown = oView.byId("paymentDateDropdown");
            if (oPaymentDateDropdown) {
                oPaymentDateDropdown.setModel(oDropdownModel);
                oPaymentDateDropdown.bindItems({
                    path: "/paymentDates",
                    template: new sap.ui.core.Item({
                        key: "{dateId}",
                        text: "{dateName}"
                    })
                });
            }

            // Bind Vendor dropdown
            var oVendorDropdown = oView.byId("vendorDropdown");
            if (oVendorDropdown) {
                oVendorDropdown.setModel(oDropdownModel);
                oVendorDropdown.bindItems({
                    path: "/vendors",
                    template: new sap.ui.core.Item({
                        key: "{vendorId}",
                        text: "{vendorName}"
                    })
                });
            }

            // Bind Payment Terms dropdown
            var oPaymentTermsDropdown = oView.byId("paymentTermsDropdown");
            if (oPaymentTermsDropdown) {
                oPaymentTermsDropdown.setModel(oDropdownModel);
                oPaymentTermsDropdown.bindItems({
                    path: "/paymentTerms",
                    template: new sap.ui.core.Item({
                        key: "{termId}",
                        text: "{termName}"
                    })
                });
            }
        },

        // Route handler for CAPEX_AND_REVEXReqIDApprover
        
        _onRouteCAPEX_AND_REVEXReqIDApprover: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var allDataFlag = localStorage.getItem("AllDataFlag");
            this._InboxDatacheck = allDataFlag;
            if (allDataFlag === "All") {
            }else{
                localStorage.removeItem("AllDataFlag");
            }
            this._CAPEX_AND_REVEX = oArgs.basedNameUICAPEX_AND_REVEX;
            var reqID = oArgs.reqID;
            this._reqIDData = reqID;
            this._ApprovedCheck = oArgs.approved;
            this.onPaymentDetailsChange();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
            
            var that = this;

            oModelV2.read("/Requests", {
                urlParameters: {
                    "$filter": "reqID eq '" + reqID + "'",
                    "$expand": "ipmDtl"
                },
                success: function (oData) {
                    if (oData && oData.results.length > 0) {
                        let oRequestServiceModel = that.getOwnerComponent().getModel("Requestservicemodel") || new sap.ui.model.json.JSONModel();
                        that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        oRequestServiceModel.setData(oData.results[0]);
                        var statusDatacheck = oData.results[0].status;
                        that.statusData = statusDatacheck;
                        var oStage = oData.results[0].stage;
                        var oRequesterToken = oData.results[0].ipmDtl.requesterToken;
                        var oDept = oData.results[0].ipmDtl.dept;
                        var oDate = oData.results[0].ipmDtl.createdDate;

                        that.getView().byId("requesterTokenInput").setValue(oRequesterToken);
                        that.getView().byId("departmentInput").setValue(oDept);
                        that.getView().byId("dateInput").setValue(oDate);

                        var oViewModel = that.getView().getModel("viewenableddatacheck");

                        if (statusDatacheck === "Pending" && oStage === "Buyer Requester") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setVisible(false);
                            oView.byId("SubmitCapexravexForm").setVisible(false);
                            oView.byId("BackCapexravexForm").setVisible(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(true);
                            oView.byId("SendbackCapexravexForm").setVisible(true);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }else if (statusDatacheck === "Pending" && oStage === "Buyer HOD") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setVisible(false);
                            oView.byId("SubmitCapexravexForm").setVisible(false);
                            oView.byId("BackCapexravexForm").setVisible(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(true);
                            oView.byId("SendbackCapexravexForm").setVisible(true);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }else if (statusDatacheck === "Pending" && oStage === "Finance") {
                            var oView = that.getView();
                            oView.byId("SaveCapexravexForm").setVisible(false);
                            oView.byId("SubmitCapexravexForm").setVisible(false);
                            oView.byId("BackCapexravexForm").setVisible(false);
                            oView.byId("ApprovedCapexravexForm").setVisible(true);
                            oView.byId("SendbackCapexravexForm").setVisible(true);
                    
                            var aFieldIds = [
                                "buyerRequestorInput", "buyerHodInput", "paymentOptionDropdown", "accountingDocInput",
                                "costcenterInput", "gstInput", "paymentTypeDropdown", "paymentDateInput",
                                "WbsInput", "tdsInput", "poNonPODropdown", "vendorCodeInput", "baseAmountInput",
                                "totalAmountInput", "poInput", "vendorNameInput", "invoiceNumberInput", "paymentTermsDropdown"
                            ];
                        
                            aFieldIds.forEach(function (sId) {
                                var oControl = oView.byId(sId);
                                if (oControl && oControl.setEditable) {
                                    oControl.setEditable(false);
                                }
                            });
                        }
                       

                        // Initialize dropdown model
                        var oDropdownModel = new sap.ui.model.json.JSONModel({
                            departments: [],
                            paymentTypes: [],
                            poNonPOs: [],
                            paymentDates: [],
                            vendors: [],
                            paymentTerms: []
                        });
                        that.getView().setModel(oDropdownModel, "dropdownModel");

                        // Set initial dropdown data
                        that._setDropdownData();

                        // Bind dropdowns to the view
                        that._bindDropdowns();

                        // Retain remaining conditions as shown in the image
                        that.onFetchTimelinessData();
                        // that.onAttchmentDataFetch();
                        // that.onBudgetDetailDataFetch(reqID);
                    } else {
                        sap.m.MessageToast.show("No data found for Req ID: " + reqID, { position: "bottom center" });
                    }
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load request data.", { position: "bottom center" });
                    console.error("Error fetching request data:", oError);
                }
            });
        },

        _setDropdownData: function () {
            var oDropdownModel = this.getView().getModel("dropdownModel");

            // Simulated data for Department
            oDropdownModel.setProperty("/departments", [
                { deptId: "D001", deptName: "Finance" },
                { deptId: "D002", deptName: "HR" },
                { deptId: "D003", deptName: "Operations" }
            ]);

            // Simulated data for Payment Type
            oDropdownModel.setProperty("/paymentTypes", [
                { typeId: "PT001", typeName: "Capex" },
                { typeId: "PT002", typeName: "Revex" }
            ]);

            // Simulated data for PO/Non PO
            oDropdownModel.setProperty("/poNonPOs", [
                { poId: "PO001", poName: "PO Based" },
                { poId: "PO002", poName: "Non PO" }
            ]);

            // Simulated data for Payment Date
            oDropdownModel.setProperty("/paymentDates", [
                { dateId: "PD001", dateName: "02-08-2023" },
                { dateId: "PD002", dateName: "03-08-2023" }
            ]);

            // Simulated data for Vendor
            oDropdownModel.setProperty("/vendors", [
                { vendorId: "V001", vendorName: "Vendor A" },
                { vendorId: "V002", vendorName: "Vendor B" }
            ]);

            // Simulated data for Payment Terms
            oDropdownModel.setProperty("/paymentTerms", [
                { termId: "PT001", termName: "Net 30" },
                { termId: "PT002", termName: "Net 60" }
            ]);
        },

        _bindDropdowns: function () {
            var oView = this.getView();
            var oDropdownModel = oView.getModel("dropdownModel");

            // Bind Department dropdown
            var oDepartmentDropdown = oView.byId("departmentDropdown");
            if (oDepartmentDropdown) {
                oDepartmentDropdown.setModel(oDropdownModel);
                oDepartmentDropdown.bindItems({
                    path: "/departments",
                    template: new sap.ui.core.Item({
                        key: "{deptId}",
                        text: "{deptName}"
                    })
                });
            }

            // Bind Payment Type dropdown
            var oPaymentTypeDropdown = oView.byId("paymentTypeDropdown");
            if (oPaymentTypeDropdown) {
                oPaymentTypeDropdown.setModel(oDropdownModel);
                oPaymentTypeDropdown.bindItems({
                    path: "/paymentTypes",
                    template: new sap.ui.core.Item({
                        key: "{typeId}",
                        text: "{typeName}"
                    })
                });
            }

            // Bind PO/Non PO dropdown
            var oPoNonPODropdown = oView.byId("poNonPODropdown");
            if (oPoNonPODropdown) {
                oPoNonPODropdown.setModel(oDropdownModel);
                oPoNonPODropdown.bindItems({
                    path: "/poNonPOs",
                    template: new sap.ui.core.Item({
                        key: "{poId}",
                        text: "{poName}"
                    })
                });
            }

            // Bind Payment Date dropdown
            var oPaymentDateDropdown = oView.byId("paymentDateDropdown");
            if (oPaymentDateDropdown) {
                oPaymentDateDropdown.setModel(oDropdownModel);
                oPaymentDateDropdown.bindItems({
                    path: "/paymentDates",
                    template: new sap.ui.core.Item({
                        key: "{dateId}",
                        text: "{dateName}"
                    })
                });
            }

            // Bind Vendor dropdown
            var oVendorDropdown = oView.byId("vendorDropdown");
            if (oVendorDropdown) {
                oVendorDropdown.setModel(oDropdownModel);
                oVendorDropdown.bindItems({
                    path: "/vendors",
                    template: new sap.ui.core.Item({
                        key: "{vendorId}",
                        text: "{vendorName}"
                    })
                });
            }

            // Bind Payment Terms dropdown
            var oPaymentTermsDropdown = oView.byId("paymentTermsDropdown");
            if (oPaymentTermsDropdown) {
                oPaymentTermsDropdown.setModel(oDropdownModel);
                oPaymentTermsDropdown.bindItems({
                    path: "/paymentTerms",
                    template: new sap.ui.core.Item({
                        key: "{termId}",
                        text: "{termName}"
                    })
                });
            }
        },

        // Fetch attachment data
        onAttchmentDataFetch: function () {
            var reqid = this._reqIDData;
            var oView = this.getView();
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");

            oModelV2.read("/ReqAttachments", {
                filters: [
                    new sap.ui.model.Filter("reqID", sap.ui.model.FilterOperator.EQ, reqid)
                ],
                success: function (oData) {
                    if (oData && oData.results) {
                        var oJSONModel = new JSONModel({
                            attachments: oData.results
                        });
                        oView.setModel(oJSONModel, "UploadDocSrvTabData");
                    }
                },
                error: function (oError) {
                    MessageToast.show("Failed to load attachment data.", { position: "bottom center" });
                    console.error("Error fetching attachment data:", oError);
                }
            });
        },

        // Update field enablement
        _updateFieldEnablement: function () {
            var oPortalModel = this.getView().getModel("portalModel");
            var oFieldEnablementModel = this.getView().getModel("fieldEnablement");
            var sPaymentOption = oPortalModel.getProperty("/paymentOption");
            var sPoNonPo = oPortalModel.getProperty("/poNonPo");

            var bFieldsEnabled = false;
            var bPoEnabled = false;
            var bWbsEnabled = true;

            if (sPaymentOption === "Advance Payment") {
                if (sPoNonPo === "po") {
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bFieldsEnabled = false;
                } else if (sPoNonPo === "nonpo") {
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bFieldsEnabled = false;
                }
            } else if (sPaymentOption === "Regular Payment") {
                if (sPoNonPo === "po") {
                    bPoEnabled = true;
                    bWbsEnabled = true;
                    bFieldsEnabled = true;
                } else if (sPoNonPo === "nonpo") {
                    bPoEnabled = false;
                    bWbsEnabled = true;
                    bFieldsEnabled = true;
                }
            }

            oFieldEnablementModel.setProperty("/fieldsEnabled", bFieldsEnabled);
            oFieldEnablementModel.setProperty("/poEnabled", bPoEnabled);
            oFieldEnablementModel.setProperty("/wbsEnabled", bWbsEnabled);

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

        // Handle payment option change
        onPaymentOptionChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Handle PO/Non-PO change
        onPoNonPoChange: function (oEvent) {
            this._updateFieldEnablement();
        },

        // Navigation to dashboard
        onDashboardui: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            if (this._ApprovedCheck === "Approved") {
                // oRouter.navTo("approverdashboard", { Name: "CAPEX_AND_REVEX"});
                var inboxdatacheck = this._InboxDatacheck
                    if(inboxdatacheck === "All"){
                        var oRouter = this.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                        Name: "All"
                        });
                    }  else{
                        var oRouter = this.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                            Name: "CAPEX_AND_REVEX"
                        });
                    }
            } else {
                oRouter.navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
            }
        },

        // Cancel Capex/Revex form
        onCancelCapexRevexForm: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            MessageToast.show("Navigating back to dashboard...", { position: "bottom center" });
            if (this._ApprovedCheck === "Approved") {
                oRouter.navTo("approverdashboard", {Name: "CAPEX_AND_REVEX"});
            } else {
                oRouter.navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
            }
        },

        // Generate unique request number
        _generateNewRequestNumber: function () {
            var now = new Date();
            var year = now.getFullYear().toString().substr(-2);
            var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            return "REQ" + year + dayOfYear.toString().padStart(3, '0');
        },

        _formatDate: function (oDate) {
            if (!oDate) return "";
            return oDate.toISOString().split("T")[0]; // "yyyy-MM-dd"
        },

        // Save form as draft
        onSaveCapexravexform: function () {
            var oView = this.getView();
            var reqid = this._reqIDData;
            var statusData = this.statusData || "Draft";
            var statusCheckData = statusData === "Pending" ? "Pending" : "Draft";

            if (statusData === "Sent Back") {
                statusCheckData = "Sent Back";
            }

            var oPortalModel = oView.getModel("portalModel");

            var bHasError = false;

    
            var aRequiredFields = [
              { id: "paymentOptionDropdown", name: "Payment Option" },
              { id: "paymentTypeDropdown", name: "Payment Type" },
              { id: "poNonPODropdown", name: "PO/Non PO" }
            ];
          
    
            aRequiredFields.forEach(function (field) {
              var oControl = oView.byId(field.id);
              var sValue = oControl.getSelectedKey ? oControl.getSelectedKey() : oControl.getValue();
          
              if (!sValue) {
                oControl.setValueState("Error");
                oControl.setValueStateText(field.name + " is required");
                bHasError = true;
              } else {
                oControl.setValueState("None");
              }
            });
          
            if (bHasError) {
              MessageBox.error("Please fill all required fields before saving.");
              return; 
            }

            var oPaymentDate = oView.byId("paymentDateInput").getDateValue();
            var sFormattedPaymentDate = oPaymentDate ? oPaymentDate.toISOString().split("T")[0] : null;

            var oipmDtl = {
                reqID: reqid || "",
                email: this.getOwnerComponent().getModel("userModel")?.getProperty("/email") || "",
                requesterToken: oView.byId("requesterTokenInput").getValue(),
                dept: oView.byId("departmentInput").getValue(),
                createdDate: oView.byId("dateInput").getValue(),
                accDocNo: oView.byId("accountingDocInput").getValue(),
                PO: oView.byId("poInput").getValue(),
                vendorCode: oView.byId("vendorCodeInput").getValue(),
                vendorName: oView.byId("vendorNameInput").getValue(),
                invoiceNumber: oView.byId("invoiceNumberInput").getValue(),
                costCenter: oView.byId("costcenterInput").getValue(),
                WBS: oView.byId("WbsInput").getValue(),
                paymentOption: oView.byId("paymentOptionDropdown").getSelectedKey(),
                paymentType: oView.byId("paymentTypeDropdown").getSelectedKey(),
                poNonPo: oView.byId("poNonPODropdown").getSelectedKey(),
                paymentTerms: oView.byId("paymentTermsDropdown").getSelectedKey(),
                buyerRequester: oView.byId("buyerRequestorInput").getSelectedKey(),
                buyerHOD: oView.byId("buyerHodInput").getSelectedKey(),
                paymentDt: sFormattedPaymentDate,  // ✅ Safe ISO date string
                baseAmount: parseFloat(oView.byId("baseAmountInput").getValue()) || 0,
                totalAmount: parseFloat(oView.byId("totalAmountInput").getValue()) || 0,
                GST: parseFloat(oView.byId("gstInput").getValue()) || 0,
                TDS: parseFloat(oView.byId("tdsInput").getValue()) || 0
            };
        
            var oSavePayload = {
                status: statusCheckData,
                type: "CAPEXREQ",
                ipmDtl: oipmDtl
            };
        
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var that = this;
        
            if (!reqid) {
                oModel.create("/Requests", oSavePayload, {
                    success: function (oData) {
                        that._reqIDData = oData.reqID;
                        var refNo = oData.refNo;
                        // that.getView().byId("requestNumberInput").setValue(refNo);
        
                        var oRequestServiceModel = that.getOwnerComponent().getModel("Requestservicemodel") || new sap.ui.model.json.JSONModel();
                        that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        oRequestServiceModel.setData(oData);
        
                        MessageBox.success("Request saved successfully!");
                    },
                    error: function (oError) {
                        MessageToast.show("Error saving request: " + oError.message, { position: "bottom center" });
                        console.error("Error saving request:", oError);
                    }
                });
            } else {
                oModel.update("/Requests('" + reqid + "')", oSavePayload, {
                    success: function () {
                        // that.attachmentuploadFilesData(reqid);
                        // that.onBudgetDetailDataFetch(reqid);
                        MessageBox.success("Request updated successfully!");
                    },
                    error: function (oError) {
                        MessageToast.show("Error updating request: " + oError.message, { position: "bottom center" });
                        console.error("Error updating request:", oError);
                    }
                });
            }
        },

        _formatDate: function (oDate) {
            if (!oDate) return "";
        
            var year = oDate.getFullYear();
            var month = (oDate.getMonth() + 1).toString().padStart(2, "0");
            var day = oDate.getDate().toString().padStart(2, "0");
        
            return day + "-" + month + "-" + year;
        },
        formatDatePaymentDt: function(oDateValue) {
            if (!oDateValue) {
                return null;
            }
        
            var oDate = new Date(oDateValue);
        
            if (isNaN(oDate.getTime())) {
                return null;
            }
        
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "yyyy-MM-dd"
            });
        
            return oDateFormat.format(oDate);
        },
        

        // on confirm save
        onConfirmSave: function () {
            var oView = this.getView();
            var oipmDtl = {
                requesterToken: oView.byId("requesterTokenInput").getValue(),
                department: oView.byId("departmentInput").getValue(),
                createdDate: oView.byId("dateInput").getValue(),
                requestNumber: oView.byId("requestNumberInput").getValue(),
                paymentOption: oView.byId("paymentOptionDropdown").getSelectedKey(),
                paymentType: oView.byId("paymentTypeDropdown").getSelectedKey(),
                accountingDocumentNumber: oView.byId("accountingDocInput").getValue(),
                paymentDate: oView.byId("paymentDateDropdown").getValue(), // use getValue for DatePicker
                poNonPo: oView.byId("poNonPODropdown").getSelectedKey(),
                po: oView.byId("poInput").getValue(),
                vendorCode: oView.byId("vendorCodeInput").getValue(),
                vendorName: oView.byId("vendorNameInput").getValue(),
                invoiceNumber: oView.byId("invoiceNumberInput").getValue(),
                costCenter: oView.byId("costcenterInput").getValue(),
                wbs: oView.byId("WbsInput").getValue(),
                baseAmount: parseFloat(oView.byId("baseAmountInput").getValue()) || 0,
                tds: oView.byId("tdsInput").getValue(),
                gst: oView.byId("gstInput").getValue(),
                totalAmount: parseFloat(oView.byId("totalAmountInput").getValue()) || 0,
                paymentTerms: oView.byId("paymentTermsDropdown").getSelectedKey(),
                buyerRequestor: oView.byId("buyerRequestorInput").getValue(),
                buyerHOD: oView.byId("buyerHodInput").getValue(),
                remarks: oView.byId("remarksInput").getValue(),
                selectedApprover: this._ApprovedCheck === "Approved" ? oView.byId("approverRequiredFrom").getSelectedKey() : "",
                attachments: oView.getModel("UploadDocSrvTabData")?.getProperty("/attachments") || []
            };

            MessageToast.show("Form data and attachments saved.", { position: "bottom center" });
            this._oSaveDialog.close();
        },

        onCancelSave: function () {
            this._oSaveDialog.close();
            MessageToast.show("Save action canceled.", { position: "bottom center" });
        },

 
        // onSubmitCapexravexform: function () {

        //     var isValid = true;
        //     function checkField(oControl) {
        //         if (oControl && oControl.getVisible() && oControl.getValue) {
        //             if (!oControl.getValue()) {
        //                 oControl.setValueState(sap.ui.core.ValueState.Error);
        //                 isValid = false;
        //             } else {
        //                 oControl.setValueState(sap.ui.core.ValueState.None);
        //             }
        //         }
        //     }
        
        //     checkField(this.getView().byId("buyerRequestorInput"));
        //     checkField(this.getView().byId("buyerHodInput"));
        //     checkField(this.getView().byId("paymentOptionDropdown"));
        //     checkField(this.getView().byId("accountingDocInput"));
        //     checkField(this.getView().byId("costcenterInput"));
        //     checkField(this.getView().byId("paymentTypeDropdown"));
        //     checkField(this.getView().byId("paymentDateInput"));
        //     checkField(this.getView().byId("WbsInput"));
        //     checkField(this.getView().byId("poNonPODropdown"));
        //     checkField(this.getView().byId("vendorCodeInput"));
        //     checkField(this.getView().byId("baseAmountInput"));
        //     checkField(this.getView().byId("vendorNameInput"));
        //     checkField(this.getView().byId("invoiceNumberInput"));
        
        //     if (!isValid) {
        //         sap.m.MessageBox.error("Please fill all the required fields.");
        //         return;
        //     }

        //     this.remarksDialog.open();
        // },


        onSubmitCapexravexform: function () {
            const oView = this.getView();
            var isValid = true;
            var that = this;
            function checkField(oControl) {
                if (oControl && oControl.getVisible()) {
                    var value = (typeof oControl.getValue === "function") ? oControl.getValue() : 
                                (typeof oControl.getSelectedKey === "function") ? oControl.getSelectedKey() : "";
        
                    if (!value) {
                        oControl.setValueState(sap.ui.core.ValueState.Error);
                        isValid = false;
        
                        if (typeof oControl.attachLiveChange === "function") {
                            oControl.attachLiveChange(that._resetValueState);
                        }
                        if (typeof oControl.attachChange === "function") {
                            oControl.attachChange(that._resetValueState);
                        }
                    } else {
                        oControl.setValueState(sap.ui.core.ValueState.None);
                    }
                }
            }
        
            // Validate visible required fields
            checkField(this.getView().byId("buyerRequestorInput"));
            checkField(this.getView().byId("buyerHodInput"));
            checkField(this.getView().byId("paymentOptionDropdown"));
            checkField(this.getView().byId("accountingDocInput"));
            checkField(this.getView().byId("costcenterInput"));
            checkField(this.getView().byId("paymentTypeDropdown"));
            checkField(this.getView().byId("paymentDateInput"));
            checkField(this.getView().byId("WbsInput"));
            checkField(this.getView().byId("poNonPODropdown"));
            checkField(this.getView().byId("vendorCodeInput"));
            checkField(this.getView().byId("baseAmountInput"));
            checkField(this.getView().byId("vendorNameInput"));
            checkField(this.getView().byId("invoiceNumberInput"));
             
  const oViewModel = oView.getModel("viewenableddatacheck"); 
  oViewModel.setProperty("/remarkModel", "");
        
            if (!isValid) {
                sap.m.MessageBox.error("Please fill all the required fields.");
                return;
            }   
    
            // All validations passed — proceed to open remarks dialog
            this.remarksDialog.open();
            this.getView().byId("Approverremark2").setVisible(false);
            this.getView().byId("Sendremark").setVisible(false);
        },

        onSubmitReamrksData: function () {
            var oView = this.getView();
            var reqid = this._reqIDData;
            var statusData = this.statusData;

            var remarkInput = this.getView().byId("RemarkInput").getValue();
            if (!remarkInput) {
              MessageBox.information("Please provide a remark before submitting.");
              return;
            }
            // var statusCheckData = statusData === "Pending" ? "Pending" : "Draft";
            var statusCheckData = "";
            if (statusData === "Sent Back") {
                statusCheckData = "Sent Back";
            }else{
                statusCheckData = "Pending";
            }
            var oPaymentDate = oView.byId("paymentDateInput").getDateValue();
            var sFormattedPaymentDate = oPaymentDate ? oPaymentDate.toISOString().split("T")[0] : null;
            var oipmDtl = {
                reqID: reqid || "",
                email: this.getOwnerComponent().getModel("userModel")?.getProperty("/email") || "",
                requesterToken: oView.byId("requesterTokenInput").getValue(),
                dept: oView.byId("departmentInput").getValue(),
                createdDate: oView.byId("dateInput").getValue(),
                accDocNo: oView.byId("accountingDocInput").getValue(),
                PO: oView.byId("poInput").getValue(),
                vendorCode: oView.byId("vendorCodeInput").getValue(),
                vendorName: oView.byId("vendorNameInput").getValue(),
                invoiceNumber: oView.byId("invoiceNumberInput").getValue(),
                costCenter: oView.byId("costcenterInput").getValue(),
                WBS: oView.byId("WbsInput").getValue(),
                paymentOption: oView.byId("paymentOptionDropdown").getSelectedKey(),
                paymentType: oView.byId("paymentTypeDropdown").getSelectedKey(),
                poNonPo: oView.byId("poNonPODropdown").getSelectedKey(),
                paymentTerms: oView.byId("paymentTermsDropdown").getSelectedKey(),
                buyerRequester: oView.byId("buyerRequestorInput").getSelectedKey(),
                buyerHOD: oView.byId("buyerHodInput").getSelectedKey(),
                paymentDt: sFormattedPaymentDate,
                // paymentDt: (oView.byId("paymentDateInput").getDateValue()),
                baseAmount: parseFloat(oView.byId("baseAmountInput").getValue()) || 0,
                totalAmount: parseFloat(oView.byId("totalAmountInput").getValue()) || 0,
                GST: parseFloat(oView.byId("gstInput").getValue()) || 0,
                TDS: parseFloat(oView.byId("tdsInput").getValue()) || 0
            };
        
            var oSubmitPayload = {
                status: statusCheckData,
                type: "CAPEXREQ",
                ipmDtl: oipmDtl,
                remarks: remarkInput,
            };
        
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var that = this;
        
            if (!reqid) {
                oModel.create("/Requests", oSubmitPayload, {
                    success: function (oData) {
                        that._reqIDData = oData.reqID;
                        var reqID = oData.reqID;
                        var refNo = oData.refNo;

                        // var oRequestServiceModel = that.getOwnerComponent().getModel("Requestservicemodel") || new sap.ui.model.json.JSONModel();
                        // that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        // oRequestServiceModel.setData(oData);
                        // MessageBox.success("Request submitted successfully!");

                        that.Approversendtonext(reqID);

                        sap.m.MessageBox.success("Request " + refNo + " has been submit successfully ", {
                          title: "Success",
                          actions: [sap.m.MessageBox.Action.OK],
                          onClose: function (oAction) {
                            if (oAction === sap.m.MessageBox.Action.OK) {
                              var oRouter = that.getOwnerComponent().getRouter();
                              oRouter.navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
                            }
                          }
                        });

                    },
                    error: function (oError) {
                        MessageToast.show("Error submiting request: " + oError.message, { position: "bottom center" });
                        console.error("Error submiting request:", oError);
                    }
                });
            } else {
                oModel.update("/Requests('" + reqid + "')", oSubmitPayload, {
                    success: function (oData) {
                        // that.attachmentuploadFilesData(reqid);
                        // that.onBudgetDetailDataFetch(reqid);
                        // MessageBox.success("Request submitted successfully!");

                        that._reqIDData = oData.reqID;
                        var reqID = oData.reqID;
                        var refNo = oData.refNo;
                        // var oRequestServiceModel = that.getOwnerComponent().getModel("Requestservicemodel") || new sap.ui.model.json.JSONModel();
                        // that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        // oRequestServiceModel.setData(oData);
        
                        // MessageBox.success("Request submitted successfully!");

                        that.Approversendtonext(reqID);

                        // sap.m.MessageBox.success("Request " + refNo + " has been submit successfully ", {
                        //   title: "Success",
                        //   actions: [sap.m.MessageBox.Action.OK],
                        //   onClose: function (oAction) {
                        //     if (oAction === sap.m.MessageBox.Action.OK) {
                        //       var oRouter = that.getOwnerComponent().getRouter();
                        //       oRouter.navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
                        //     }
                        //   }
                        // });

                    },
                    error: function (oError) {
                        MessageToast.show("Error submiting request: " + oError.message, { position: "bottom center" });
                        console.error("Error submiting request:", oError);
                    }
                });
            }
        },

        Approversendtonext: function (reqID) {
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            // var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var remarkInput = this.getView().byId("RemarkInput").getValue();
      
            var statusData = this.statusData;
      
            // var sdata = {
            //   wbsNo: this.getView().byId("WBSNumberInput").getValue(),
            // }
      
        //   if(statusData === "Pending"){
        //       var oApprovedPayload = {
        //         reqID: reqID,
        //         action: "APPROVE",
        //         remarks: remarkInput,
        //         data : sdata
        //       };
        //     }else{
        //       var oApprovedPayload = {
        //         reqID: reqID,
        //         action: "SUBMIT",
        //         remarks: remarkInput
        //       };
        //     }
        var oApprovedPayload = {
            reqID: reqID,
            action: "SUBMIT",
            remarks: remarkInput
          };
           
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
      
            oModel.create("/IPMApproval", oApprovedPayload, {
              success: function (oData) {
                // MessageBox.success("Mail sent successfully!");
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.success(oData.IPMApproval.message || "Request has been submit successfully ", {
                    // title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: function (oAction) {
                      if (oAction === sap.m.MessageBox.Action.OK) {
                        var oRouter = that.getOwnerComponent().getRouter();
                        oRouter.navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
                      }
                    }
                  });
              },
              error: function (oError) {
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show("Error approving request.", { position: "bottom center" });
                console.error("Error approving request:", oError);
              }
            });
          },


          onApprovedCapexravexForm: function () {
            // var isFormValid = this._validateFormFields();
            this.getView().byId("RemarkInput").setValue("");
            this.getView().byId("Approverremark2").setVisible(true);
            this.getView().byId("approverremark").setVisible(false);
            this.getView().byId("submitremark").setVisible(false);
            this.getView().byId("Sendremark").setVisible(false);
          
        
            this.remarksDialog.open();
            
            // this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
          },

          
          onSendbackCapexravexForm: function () {
        // var isFormValid = this._validateFormFields();
        this.getView().byId("RemarkInput").setValue("");
        this.getView().byId("approverremark").setVisible(false);
        this.getView().byId("Approverremark2").setVisible(false);
        this.getView().byId("submitremark").setVisible(false);
        this.getView().byId("Sendremark").setVisible(true);
        // if (isFormValid) {
        //   this.remarksDialog.open();
        // }
        this.remarksDialog.open();
        // this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
      },

        _resetValueState: function (oEvent) {
            var oControl = oEvent.getSource();
            var value = (typeof oControl.getValue === "function") ? oControl.getValue() :
                        (typeof oControl.getSelectedKey === "function") ? oControl.getSelectedKey() : "";
        
            if (value) {
                oControl.setValueState(sap.ui.core.ValueState.None);
            }
        },
        

        // onApprovedData: function () {
        //     var oView = this.getView();
        //     var reqid = this._reqIDData;
        //     var remarkInput = oView.getModel("viewenableddatacheck").getProperty("/remarkModel");
        //     if (!remarkInput) {
        //         MessageBox.information("Please provide a remark before approving.");
        //         return;
        //     }
        //     sap.ui.core.BusyIndicator.show(0);

        //     var aBudgetItems = oView.getModel("budgetModel").getProperty("/items");
        //     var oSsfdDtl = this._createSsfdDtl(oView, aBudgetItems, remarkInput);

        //     var oSubmitPayload = {
        //         type: "CAPEX_AND_REVEX",
        //         remarks: remarkInput,
        //         ssfdDtl: oSsfdDtl
        //     };

        //     var oModel = this.getOwnerComponent().getModel("approvalservicev2");
        //     var that = this;

        //     if (!reqid) {
        //         oModel.create("/Requests", oSubmitPayload, {
        //             success: function (oData) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 that._reqIDData = oData.reqID;
        //                 that.approverdatacheckApproved(oData.reqID);
        //             },
        //             error: function (oError) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 MessageToast.show("Error saving request: " + oError.message, { position: "bottom center" });
        //                 console.error("Error saving request:", oError);
        //             }
        //         });
        //     } else {
        //         oModel.update("/Requests('" + reqid + "')", oSubmitPayload, {
        //             success: function () {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 that.approverdatacheckApproved(reqid);
        //             },
        //             error: function (oError) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 MessageToast.show("Error updating request: " + oError.message, { position: "bottom center" });
        //                 console.error("Error updating request:", oError);
        //             }
        //         });
        //     }
        // },

        onApprovedData: function () {
            var oView = this.getView();
            var reqid = this._reqIDData;
            var statusData = this.statusData;
            var subtypedata = this._onSubType;
            // var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var remarkInput = this.getView().byId("RemarkInput").getValue();
            if (!remarkInput) {
              MessageBox.information("Please provide a remark before submitting.");
              return;
            }
      
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var oApprovedPayload;
              oApprovedPayload = {
                reqID: reqid,
                action: "Approve",
                remarks: remarkInput
              };
            
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
      
            oModel.create("/IPMApproval", oApprovedPayload, {
              success: function () {
                // that.attachmentuploadFilesData(reqid)
                MessageBox.success("Request approved successfully!", {
                  onClose: function () {
                    if (that._ApprovedCheck === "Approved") {
                      sap.ui.core.BusyIndicator.hide();
                      // that.getOwnerComponent().getRouter().navTo("approverdashboard");
                    var inboxdatacheck = that._InboxDatacheck
                    if(inboxdatacheck === "All"){
                        var oRouter = that.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                        Name: "All"
                        });
                    }  else{
                        var oRouter = that.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                            Name: "CAPEX_AND_REVEX"
                        });
                    } 
                    }
                  }
                });
              },
              error: function (oError) {
                console.error("Error approving request:", oError);
              }
            }); 
        },

   

        // Reject action
        onRejectData: function () {
         
        },

        // Send back action
        onSendbackData: function () {
            var oView = this.getView();
            var reqid = this._reqIDData;
            var statusData = this.statusData;
            var subtypedata = this._onSubType;
            // var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var remarkInput = this.getView().byId("RemarkInput").getValue();
            if (!remarkInput) {
              MessageBox.information("Please provide a remark before submitting.");
              return;
            }
      
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var oApprovedPayload;
              oApprovedPayload = {
                reqID: reqid,
                action: "Reject",
                remarks: remarkInput
              };
            
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
      
            oModel.create("/IPMApproval", oApprovedPayload, {
              success: function () {
                // that.attachmentuploadFilesData(reqid)
                MessageBox.success("Request Send back successfully!", {
                  onClose: function () {
                    if (that._ApprovedCheck === "Approved") {
                      sap.ui.core.BusyIndicator.hide();
                      // that.getOwnerComponent().getRouter().navTo("approverdashboard");
                   
                    var inboxdatacheck = that._InboxDatacheck
                    if(inboxdatacheck === "All"){
                        var oRouter = that.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                        Name: "All"
                        });
                    }  else{
                        var oRouter = that.getOwnerComponent().getRouter();
                        oRouter.navTo("approverdashboard", {
                            Name: "CAPEX_AND_REVEX"
                        });
                    }
                    }
                  }
                });
              },
              error: function (oError) {
                console.error("Error approving request:", oError);
              }
            }); 
        },

        // Submit remarks and form
        onSubmitRemarksCapexRevex: function () {
            var oView = this.getView();
            var reqid = this._reqIDData;
            var remarkInput = oView.getModel("viewenableddatacheck").getProperty("/remarkModel");

            if (!remarkInput) {
                MessageBox.information("Please provide a remark before submitting.");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);

            // Collect budget data if applicable
            var aBudgetItems = oView.getModel("budgetModel")?.getProperty("/items") || [];

            var oPaymentDate = oView.byId("paymentDateInput").getDateValue();
            var sFormattedPaymentDate = oPaymentDate ? oPaymentDate.toISOString().split("T")[0] : null;

            // Prepare CapexRevex details payload
            var oipmDtl = {
                reqID: this._reqIDData || "", // or generate a UUID
                email: this.getOwnerComponent().getModel("userModel")?.getProperty("/email") || "",

                requesterToken: oView.byId("requesterTokenInput").getValue(),
                dept: oView.byId("departmentInput").getValue(),
                createdDate: oView.byId("dateInput").getValue(),
                accDocNo: oView.byId("accountingDocInput").getValue(),
                PO: oView.byId("poInput").getValue(),
                vendorCode: oView.byId("vendorCodeInput").getValue(),
                vendorName: oView.byId("vendorNameInput").getValue(),
                invoiceNumber: oView.byId("invoiceNumberInput").getValue(),
                costCenter: oView.byId("costcenterInput").getValue(),
                WBS: oView.byId("WbsInput").getValue(),

                requester: "", // optional, leave blank or remove from payload if unused

                paymentOption: oView.byId("paymentOptionDropdown").getSelectedKey(),
                paymentType: oView.byId("paymentTypeDropdown").getSelectedKey(),
                poNonPo: oView.byId("poNonPODropdown").getSelectedKey(),
                paymentTerms: oView.byId("paymentTermsDropdown").getSelectedKey(),
                buyerRequester: oView.byId("cbBuyerRequestore").getSelectedKey(),
                buyerHOD: oView.byId("cbBuyerHO3D").getSelectedKey(),

                paymentDt: sFormattedPaymentDate,
                // paymentDt: (oView.byId("paymentDateInput").getDateValue()),
                baseAmount: parseFloat(oView.byId("baseAmountInput").getValue()) || 0,
                totalAmount: parseFloat(oView.byId("totalAmountInput").getValue()) || 0,
                GST: parseFloat(oView.byId("gstInput").getValue()) || 0,
                TDS: parseFloat(oView.byId("tdsInput").getValue()) || 0
            };

            var oFinalPayload = {
                stage: "HOD",
                status: "Pending",
                type: "CAPEX_REVEX",
                remarks: remarkInput,
                ipmDtl: oipmDtl
            };

            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var that = this;

            if (!reqid) {
                oModel.create("/Requests", oFinalPayload, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        that._reqIDData = oData.reqID;
                        that.attachmentuploadFilesData(oData.reqID);
                        that.approverdatacheck(oData.reqID);

                        var oRequestServiceModel = new sap.ui.model.json.JSONModel(oData);
                        that.getOwnerComponent().setModel(oRequestServiceModel, "Requestservicemodel");
                        that.onBudgetDetailDataFetch(oData.reqID);
                    },
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Error saving request: " + oError.message, { position: "bottom center" });
                        console.error("Create error:", oError);
                    }
                });
            } else {
                oModel.update("/Requests('" + reqid + "')", oFinalPayload, {
                    success: function () {
                        sap.ui.core.BusyIndicator.hide();
                        that.attachmentuploadFilesData(reqid);
                        that.approverdatacheck(reqid);
                        that.onBudgetDetailDataFetch(reqid);
                    },
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Error updating request: " + oError.message, { position: "bottom center" });
                        console.error("Update error:", oError);
                    }
                });
            }
        },



        // Create ssfdDtl object
        // _createSsfdDtl: function (oView, aBudgetItems, remarkInput, subType) {
        //     return {
        //         paymentOption: oView.byId("cbPaymentOptieon").getSelectedKey(),
        //         paymentType: oView.byId("cbPaymentTyepe").getSelectedKey(),
        //         poNonPo: oView.byId("cbPoNonePo").getSelectedKey(),
        //         paymentDate: oView.byId("dpPaymentDaete").getDateValue(),
        //         accountingDocNumber: oView.byId("inpAccDocNumberer").getValue(),
        //         po: oView.byId("po").getValue(),
        //         vendorCode: oView.byId("inpVendorCodeee").getValue(),
        //         costCenter: oView.byId("inpCostCenterer").getValue(),
        //         wbs: oView.byId("inpWBSes").getValue(),
        //         totalAmount: parseFloat(oView.byId("totalAmount").getValue()) || 0,
        //         vendorName: oView.byId("inpVendorNameee").getValue(),
        //         invoiceNumber: oView.byId("inpInvoiceee").getValue(),
        //         baseAmount: parseFloat(oView.byId("inpBaseAmouneta").getValue()) || 0,
        //         gst: parseFloat(oView.byId("gst").getValue()) || 0,
        //         tds: parseFloat(oView.byId("tds").getValue()) || 0,
        //         buyerRequester: oView.byId("inpBuyerRequester").getValue(),
        //         buyerHod: oView.byId("inpBuyerHod").getValue(),
        //         paymentTerms: oView.byId("paymentTerms").getValue(),
        //         remarks: remarkInput,
        //         subType: subType || "",
        //         background: oView.byId("_IDGenTextArea").getValue(),
        //         justification: oView.byId("_IDGenTextArea1").getValue(),
        //         deliverables: oView.byId("_IDGenTextArea2").getValue(),
        //         capitalBudget: aBudgetItems.find(item => item.nature === "Capital Budget")?.amount || 0,
        //         revenueBudget: aBudgetItems.find(item => item.nature === "Revenue Budget")?.amount || 0,
        //         personnelCost: aBudgetItems.find(item => item.nature === "Personnel Cost")?.amount || 0,
        //         selectedApprover: this._ApprovedCheck === "Approved" ? oView.byId("approverRequiredFrom").getSelectedKey() : ""
        //     };
        // },

        // Approve request
        approverdatacheckApproved: function (reqid) {
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var oApprovedPayload = {
                reqID: reqid,
                action: "APPROVE",
                remarks: remarkInput
            };
            var that = this;
            sap.ui.core.BusyIndicator.show(0);

            oModel.create("/SSFDApproval", oApprovedPayload, {
                success: function () {
                    MessageBox.success("Request approved successfully!", {
                        onClose: function () {
                            if (that._ApprovedCheck === "Approved") {
                                sap.ui.core.BusyIndicator.hide();
                                that.getOwnerComponent().getRouter().navTo("approverdashboard");
                            }
                        }
                    });
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Error approving request.", { position: "bottom center" });
                    console.error("Error approving request:", oError);
                }
            });
        },

        // Reject request
        rejecteddatacheckRejected: function (reqid) {
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var oApprovedPayload = {
                reqID: reqid,
                action: "REJECT",
                remarks: remarkInput
            };
            var that = this;

            oModel.create("/SSFDApproval", oApprovedPayload, {
                success: function () {
                    MessageBox.success("Request rejected successfully!", {
                        onClose: function () {
                            if (that._ApprovedCheck === "Approved") {
                                that.getOwnerComponent().getRouter().navTo("approverdashboard");
                            }
                        }
                    });
                },
                error: function (oError) {
                    MessageToast.show("Error rejecting request.", { position: "bottom center" });
                    console.error("Error rejecting request:", oError);
                }
            });
        },

        // Send back request
        sendbackdatacheckApproved: function (reqid) {
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var oApprovedPayload = {
                reqID: reqid,
                action: "SENT BACK",
                remarks: remarkInput
            };
            var that = this;

            oModel.create("/SSFDApproval", oApprovedPayload, {
                success: function () {
                    MessageBox.success("Request sent back successfully!", {
                        onClose: function () {
                            if (that._ApprovedCheck === "Approved") {
                                that.getOwnerComponent().getRouter().navTo("approverdashboard");
                            }
                        }
                    });
                },
                error: function (oError) {
                    MessageToast.show("Error sending back request.", { position: "bottom center" });
                    console.error("Error sending back request:", oError);
                }
            });
        },

        // Submit request
        approverdatacheck: function (reqid) {
            var oModel = this.getOwnerComponent().getModel("approvalservicev2");
            var remarkInput = this.getView().getModel("viewenableddatacheck").getProperty("/remarkModel");
            var oApprovedPayload = {
                reqID: reqid,
                action: "SUBMIT",
                remarks: remarkInput
            };
            var that = this;
            sap.ui.core.BusyIndicator.show(0);

            oModel.create("/SSFDApproval", oApprovedPayload, {
                success: function () {
                    MessageBox.success("Request submitted successfully!", {
                        onClose: function () {
                            if (that._CAPEX_AND_REVEX === "CAPEX_AND_REVEX") {
                                sap.ui.core.BusyIndicator.hide();
                                that.getOwnerComponent().getRouter().navTo("DashboardUI", { Name: "CAPEX_AND_REVEX" });
                            }
                        }
                    });
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Error submitting request.", { position: "bottom center" });
                    console.error("Error submitting request:", oError);
                }
            });
        },

        // Handle live validation
        _handleLiveValidation: function (oEvent) {
            var oControl = oEvent.getSource();
            var sValue = oControl.getValue ? oControl.getValue().trim() : oControl.getSelectedKey ? oControl.getSelectedKey().trim() : "";
            var sId = oControl.getId();

            if (sId.includes("dpPaymentDaete") && sValue) {
                oControl.setValueState("None");
            } else if (sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer",
                "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee", "po"].includes(sId)) {
                oControl.setValueState("None");
            } else if (sId.includes("inpBaseAmouneta") && sValue && !isNaN(parseFloat(sValue)) && parseFloat(sValue) > 0) {
                oControl.setValueState("None");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && !isNaN(parseFloat(sValue)) && parseFloat(sValue) >= 0) {
                oControl.setValueState("None");
            } else if (sId.includes("dpPaymentDaete") && !sValue) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (!sValue && ["cbPaymentOptieon", "cbPaymentTyepe", "cbPoNonePo", "inpAccDocNumberer", "inpCostCenterer",
                "inpWBSes", "inpVendorCodeee", "inpVendorNameee", "inpInvoiceee"].includes(sId)) {
                oControl.setValueState("Error");
                oControl.setValueStateText("This field is mandatory");
            } else if (sId.includes("inpBaseAmouneta") && sValue && (isNaN(parseFloat(sValue)) || parseFloat(sValue) <= 0)) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid positive number");
            } else if (["gst", "tds", "totalAmount"].includes(sId) && sValue && (isNaN(parseFloat(sValue)) || parseFloat(sValue) < 0)) {
                oControl.setValueState("Error");
                oControl.setValueStateText("Must be a valid non-negative number");
            }
        },

        // Handle budget amount change
        onBudgetAmountChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sNewValue = oEvent.getParameter("value");
            var fValue = parseFloat(sNewValue);
            var oModel = this.getView().getModel("budgetModel");
            var sPath = oInput.getBinding("value").getPath();
            var oContext = oInput.getBindingContext("budgetModel");
            var iIndex = parseInt(oContext.getPath().split("/").pop());
            var aItems = oModel.getProperty("/items");

            if (isNaN(fValue) || fValue < 0) {
                oInput.setValueState("Error");
                MessageToast.show("Budget amount cannot be negative.", { position: "bottom center" });
                return;
            }
            oInput.setValueState("None");

            aItems[iIndex].amount = fValue || 0;
            aItems[iIndex].contingency = aItems[iIndex].nature === "Capital Budget" ? Number((aItems[iIndex].amount * 0.05).toFixed(2)) : 0;
            aItems[iIndex].total = Number((aItems[iIndex].amount + aItems[iIndex].contingency).toFixed(2));

            var iTotalAmount = 0;
            var iTotalContingency = 0;
            for (var i = 0; i < aItems.length - 1; i++) {
                iTotalAmount += aItems[i].amount || 0;
                iTotalContingency += aItems[i].contingency || 0;
            }

            aItems[3].amount = Number(iTotalAmount.toFixed(2));
            aItems[3].contingency = Number(iTotalContingency.toFixed(2));
            aItems[3].total = Number((iTotalAmount + iTotalContingency).toFixed(2));

            oModel.setProperty("/items", aItems);
            oModel.refresh(true);
            oView.byId("totalAmount").setValue(aItems[3].total.toString());
        },

        // Handle file upload
        onUploadTabAttchmment: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            if (!aFiles || aFiles.length === 0) {
                MessageToast.show("No files selected.", { position: "bottom center" });
                return;
            }

            var oModel = this.getView().getModel("UploadDocSrvTabData");
            var aAttachments = oModel.getProperty("/attachments") || [];
            var sUploadedOn = new Date().toISOString().split("T")[0];

            for (var i = 0; i < aFiles.length; i++) {
                (function (file, index) {
                    var oReader = new FileReader();
                    oReader.onload = function (e) {
                        var sBase64Data = e.target.result;
                        aAttachments.push({
                            ID: new Date().getTime().toString() + index,
                            fileName: file.name,
                            mimeType: file.type,
                            content: sBase64Data,
                            uploadedBy: "Current User",
                            uploadedOn: sUploadedOn,
                            deleteTabVisible: true
                        });

                        if (index === aFiles.length - 1) {
                            oModel.setProperty("/attachments", aAttachments);
                            oModel.refresh(true);
                            MessageToast.show("Files uploaded: " + aFiles.length, { position: "bottom center" });
                            oFileUploader.setValue("");
                        }
                    };
                    oReader.onerror = function () {
                        MessageToast.show("Error reading file: " + file.name, { position: "bottom center" });
                    };
                    oReader.readAsDataURL(file);
                })(aFiles[i], i);
            }
        },

        // Handle file upload press
        onUploadPress: function () {
            var oFileUploader = this.byId("fileUploaderTabAttchment");
            var aFiles = oFileUploader.getDomRef().files;

            if (!aFiles || aFiles.length === 0) {
                MessageToast.show("Please select at least one file first.", { position: "bottom center" });
                return;
            }

            var oModel = this.getView().getModel("UploadDocSrvTabData");
            var aAttachments = oModel.getProperty("/attachments") || [];
            var sUploadedOn = new Date().toISOString().split("T")[0];

            aAttachments = aAttachments.filter(function (item) {
                return !item.temp;
            });

            for (var i = 0; i < aFiles.length; i++) {
                (function (file, index) {
                    var oReader = new FileReader();
                    oReader.onload = function (e) {
                        var sBase64Data = e.target.result;
                        aAttachments.push({
                            ID: new Date().getTime().toString() + index,
                            fileName: file.name,
                            uploadedBy: "Current User",
                            uploadedOn: sUploadedOn,
                            deleteTabVisible: true,
                            content: sBase64Data
                        });

                        if (index === aFiles.length - 1) {
                            oModel.setProperty("/attachments", aAttachments);
                            oModel.refresh(true);
                            MessageToast.show("Uploaded " + aFiles.length + " file(s) successfully!", { position: "bottom center" });
                            oFileUploader.setValue("");
                        }
                    };
                    oReader.onerror = function () {
                        MessageToast.show("Error reading file: " + file.name, { position: "bottom center" });
                    };
                    oReader.readAsDataURL(file);
                })(aFiles[i], i);
            }
        },

        // Upload attachments
        // attachmentuploadFilesData: function (reqid) {
        //     var oModelTabdata = this.getView().getModel("UploadDocSrvTabData");
        //     var aFilesData = oModelTabdata.getProperty("/attachments") || [];
        //     var oModel = this.getOwnerComponent().getModel("approvalservicev2");
        //     sap.ui.core.BusyIndicator.show(0);

        //     aFilesData.forEach(function (file) {
        //         if (!file.fileName || file.uploaded) return;

        //         if (file.content && typeof file.content === "string" && file.content.includes(',')) {
        //             var base64Content = file.content.split(',')[1];
        //             var payload = {
        //                 fileName: file.fileName,
        //                 content: base64Content,
        //                 mediaType: file.mimeType || "text/plain",
        //                 reqID: reqid
        //             };

        //             oModel.create("/ReqAttachments", payload, {
        //                 success: function () {
        //                     file.uploaded = true;
        //                     oModelTabdata.refresh(true);
        //                     sap.ui.core.BusyIndicator.hide();
        //                 },
        //                 error: function (oError) {
        //                     MessageToast.show("Error uploading attachment: " + file.fileName, { position: "bottom center" });
        //                     console.error("Error uploading attachment:", oError);
        //                     sap.ui.core.BusyIndicator.hide();
        //                 }
        //             });
        //         }
        //     });
        // },

        // Handle file download
        onDownloadTabAttachemnt: function (oEvent) {
            var oButton = oEvent.getSource();
            var sID = oButton.getCustomData().find(function (oData) {
                return oData.getKey() === "ID";
            }).getValue();
            var sFileName = oButton.getCustomData().find(function (oData) {
                return oData.getKey() === "fileName";
            }).getValue();

            var oModel = this.getView().getModel("UploadDocSrvTabData");
            var aAttachments = oModel.getProperty("/attachments") || [];
            var oAttachment = aAttachments.find(function (oItem) {
                return oItem.ID === sID;
            });

            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
            var sPath = "/ReqAttachments(guid'" + sID + "')";
            var that = this;

            oModelV2.read(sPath, {
                success: function (oData) {
                    if (oData && oData.__metadata && oData.__metadata.media_src) {
                        var oLink = document.createElement("a");
                        oLink.href = oData.__metadata.media_src;
                        oLink.download = sFileName;
                        document.body.appendChild(oLink);
                        oLink.click();
                        document.body.removeChild(oLink);
                        MessageToast.show("Downloading file from server: " + sFileName, { position: "bottom center" });
                    } else {
                        that._downloadLocalAttachment(oAttachment, sFileName);
                    }
                },
                error: function () {
                    that._downloadLocalAttachment(oAttachment, sFileName);
                }
            });
        },

        // Download local attachment
        _downloadLocalAttachment: function (oAttachment, sFileName) {
            if (!oAttachment || !oAttachment.content) {
                MessageToast.show("Local file content not found for: " + sFileName, { position: "bottom center" });
                return;
            }
            this._downloadBase64File(oAttachment.content, sFileName);
        },

        // Download base64 file
        _downloadBase64File: function (sBase64Content, sFileName) {
            try {
                var sBase64Data = sBase64Content.split(',')[1];
                var sMimeType = sBase64Content.split(';')[0].split(':')[1];
                var byteCharacters = atob(sBase64Data);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var oBlob = new Blob([byteArray], { type: sMimeType });
                var sUrl = URL.createObjectURL(oBlob);

                var oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = sFileName;
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
                URL.revokeObjectURL(sUrl);
                MessageToast.show("Downloading file: " + sFileName, { position: "bottom center" });
            } catch (e) {
                MessageToast.show("Error downloading file: " + sFileName, { position: "bottom center" });
                console.error("Error downloading file:", e);
            }
        },

        // Handle file deletion
        onDeleteTabAttchment: function (oEvent) {
            var oButton = oEvent.getSource();
            var oModel = this.getView().getModel("UploadDocSrvTabData");
            var aAttachments = oModel.getProperty("/attachments");
            var sID = oButton.getCustomData().find(function (oData) {
                return oData.getKey() === "ID";
            }).getValue();
            var iIndex = aAttachments.findIndex(function (oItem) {
                return oItem.ID === sID;
            });
            if (iIndex === -1) return;

            var sFileName = aAttachments[iIndex].fileName;
            var oModelV2 = this.getOwnerComponent().getModel("approvalservicev2");
            var sPath = "/ReqAttachments(guid'" + sID + "')";
            var that = this;

            oModelV2.remove(sPath, {
                success: function () {
                    that._removeAttachmentFromLocalModel(oModel, aAttachments, iIndex, sFileName);
                    MessageToast.show("Deleted " + sFileName, { position: "bottom center" });
                },
                error: function (oError) {
                    that._removeAttachmentFromLocalModel(oModel, aAttachments, iIndex, sFileName);
                    MessageToast.show("Deleted " + sFileName, { position: "bottom center" });
                    console.error("Error deleting attachment:", oError);
                }
            });
        },

        // Remove attachment from local model
        _removeAttachmentFromLocalModel: function (oModel, aAttachments, iIndex, sFileName) {
            aAttachments.splice(iIndex, 1);
            oModel.setProperty("/attachments", aAttachments);
            oModel.refresh(true);
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

        // Close remarks dialog
        onCloseReamrksFrag: function () {
            // this.getView().getModel("viewenableddatacheck").setProperty("/remarkModel", "");
            this.remarksDialog.close();
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

        onPaymentDetailsChange: function () {
            var oView = this.getView();
        
            var sPOType = oView.byId("poNonPODropdown").getValue();
            var sPaymentOption = oView.byId("paymentOptionDropdown").getValue();
        
            var oGST = oView.byId("gstInput");
            var oTDS = oView.byId("tdsInput");
            var oTotalAmt = oView.byId("totalAmountInput");
            var oPaymentTerms = oView.byId("paymentTermsDropdown");
            var oPOInput = oView.byId("poInput");
            var oInvoiceLabel = oView.byId("invoiceNumberInput").getLabels()[0]; // Label for Invoice
        
            // Reset all field states
            oGST.setEditable(true);
            oTDS.setEditable(true);
            oTotalAmt.setEditable(true);
            oPaymentTerms.setEditable(true);
            oPOInput.setEditable(true);
            oInvoiceLabel.setText("Invoice Number");
        
            // PO Based + Advance Payment
            if (sPOType === "PO Based" && sPaymentOption === "Advance Payment") {
                oInvoiceLabel.setText("Proforma Number");
                oGST.setEditable(false);
                oTDS.setEditable(false);
                oTotalAmt.setEditable(false);
                oPaymentTerms.setEditable(false);
                oGST.setValue("");
                oTDS.setValue("");                                       
                oTotalAmt.setValue("");              
                oPaymentTerms.setValue("");
            }
        
            // Non-PO Based + Advance Payment
            if (sPOType === "Non-PO" && sPaymentOption === "Advance Payment") {
                oPOInput.setEditable(false);
                oInvoiceLabel.setText("Proforma Number");
                oGST.setEditable(false);
                oTDS.setEditable(false);
                oTotalAmt.setEditable(false);
                oPaymentTerms.setEditable(false);

                oPOInput.setValue("");   
                oGST.setValue("");
                oTDS.setValue("");             
                oTotalAmt.setValue("");
                oPaymentTerms.setValue("");
            }
        
            // Non-PO Based + Regular Payment
            if (sPOType === "Non-PO" && sPaymentOption === "Regular Payment") {
                oPOInput.setEditable(false);
                oPOInput.setValue(""); 
            }
        
       
        },


        onAlphaNumericInput: function (oEvent) {
            const value = oEvent.getParameter("value");
            const regex = /^[a-zA-Z0-9]*$/;
            if (!regex.test(value)) {
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("Only alphanumeric characters allowed.");
            } else {
                oEvent.getSource().setValueState("None");
            }
        },
        
        onSpecialCharAllowedInput: function (oEvent) {
            const value = oEvent.getParameter("value");
            if (value.length > 30) {
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("Maximum 30 characters allowed.");
            } else {
                oEvent.getSource().setValueState("None");
            }
        },
        
        
    });
});
