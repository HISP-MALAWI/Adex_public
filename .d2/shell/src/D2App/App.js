import React, { useState, useEffect } from "react";
import { DataQuery, useDataEngine, useDataQuery } from "@dhis2/app-runtime";
import classes from "./App.module.css";
import HeaderComponent from "./components/widgets/headerComponent";
import { AlertBar, Box, Button, Center, CircularLoader, Divider, I } from "@dhis2/ui";
import HomePage from "./components/widgets/homePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NewDataInitialization from "./components/widgets/newDataInitialization";
import NoPageFound from "./components/widgets/noPageFound";
import AddNewRequests from "./components/widgets/addNewRequests";
import ViewDataStoreById from "./components/widgets/view";
import DeleteEntry from "./components/forms/deleteEntry";
import UpdateDataInitialization from "./components/widgets/update.dataStore.dexEntry";
import IntegrateDataStoreInitializationToDEX from "./components/widgets/integrate.dataStore.dexEntry";
import UrlValidator from "./services/urlValidator";
const query = {
  organisationUnits: {
    resource: "organisationUnits",
    params: {
      paging: false,
      fields: ["id,name,level,path,displayName,code,children,ancestors,created,href,user,users,userAccesses"],
      order: "level"
    }
  },
  visualizations: {
    resource: "visualizations",
    params: {
      paging: false,
      field: ["id", "displayName"]
    }
  },
  indicators: {
    resource: "indicators",
    params: {
      paging: false,
      fields: ["id", "name", "displayName", "code"]
    }
  },
  dataElements: {
    resource: "dataElements",
    params: {
      paging: false,
      fields: ["id", "name", "formName", "displayName", "code"]
    }
  },
  periodTypes: {
    resource: "periodTypes",
    params: {
      fields: ["*"]
    }
  },
  aggregateDataExchanges: {
    resource: "aggregateDataExchanges",
    params: {
      fields: ["*"]
    }
  },
  dataStore: {
    resource: "dataStore",
    params: {
      paging: false,
      fields: ["*"]
    }
  }
};

// const validater = new UrlValidator();
const MyApp = () => {
  const [formInputValues, setFormInputValues] = useState({
    dexname: "",
    url: ""
  });
  const [updateFormInputValues, setUpdateFormInputValues] = useState({
    dexname: "",
    url: ""
  });
  const [authValues, setAuthValues] = useState({
    username: "",
    password: "",
    token: ""
  });

  // updateFormInputValues
  const [type, setType] = useState("EXTERNAL");
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openIntegration, setOpenIntegration] = useState(false);
  const [dataToDelete, setDataToDelete] = useState();
  const [dataToUpdate, setDataToUpdate] = useState();
  const [dataToIntegrate, setDataToIntegrate] = useState();
  const engine = useDataEngine();
  const [formData, setFormData] = useState();
  const [selecteOrgUnit, setSelecteOrgUnit] = useState([]);
  const [selectedDataDimensionsCodes, setSelectedDataDimensionsCodes] = useState([]);
  const [hide, setHidden] = useState(true);
  const [message, setMessage] = useState("");
  const [isSuccessMessage, setSuccessMessage] = useState(false);
  // const [type, setType] = useState({
  //   INTERNAL: "INTERNAL",
  //   EXTERNAL: "EXTERNAL",
  // });
  const [authType, setAuthType] = useState({
    TOKEN: "TOKEN",
    BASICAUTH: "BASICAUTH"
  });
  const {
    loading,
    error,
    data,
    refetch
  } = useDataQuery(query);

  // save to datastore
  const saveGeneralInputValues = () => {
    if (type == null || type == undefined || type == "" || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.dexname) == null || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.dexname) == undefined || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.dexname) == "" || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.url) == null || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.url) == undefined || (formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.url) == "") {
      setSuccessMessage(true);
      setHidden(false);
      setMessage("Error occured.");
    } else {
      let payload = {
        resource: `dataStore/DEX_initializer_values/${new Date().getTime()}`,
        type: "create",
        data: {
          createdAt: new Date().toLocaleString(),
          dexname: formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.dexname,
          url: formInputValues === null || formInputValues === void 0 ? void 0 : formInputValues.url,
          type: type
        }
      };
      engine.mutate(payload).then(res => {
        if (res.httpStatusCode == 201) {
          setOpen(!open);
          setSuccessMessage(true);
          setHidden(false);
          setMessage("Data saved in the datastore successfully.");
        }
      }).catch(e => {
        setHidden(false);
        setMessage("Error occured. Either server or the inputs causes this error.");
      });
    }
  };
  // a post request to the data echange resource
  const mutation = data => {
    engine.mutate(data).then(res => {
      if (res.httpStatusCode == 201) {
        setSuccessMessage(true);
        setHidden(false);
        setMessage("Data exchange initialization is successfull\nPlease use the Data Exchange app to submit the Data.");
      }
    }).catch(e => {
      setHidden(false);
      setMessage("Error occured. Either server or the inputs causes this error.");
    });
  };

  // check if token or password
  const checkIfTokenOrBasiAuth = authTypeValue => {
    if (authTypeValue == authType.BASICAUTH) {
      return true;
    } else {
      return false;
    }
  };

  // constructing a data exchange api layout as defined in the url
  // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/data-exchange.html
  const initializeIntegration = data => {
    if ((formData === null || formData === void 0 ? void 0 : formData.type) == (type === null || type === void 0 ? void 0 : type.EXTERNAL)) {
      var _dataToIntegrate$valu;
      if ((dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu = dataToIntegrate.value) === null || _dataToIntegrate$valu === void 0 ? void 0 : _dataToIntegrate$valu.url) == "") {
        setMessage("Please enter target DHIS2 instance url");
        setHidden(false);
      } else {
        var _dataToIntegrate$valu2;
        if ((UrlValidator === null || UrlValidator === void 0 ? void 0 : UrlValidator.isValidUrl(dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu2 = dataToIntegrate.value) === null || _dataToIntegrate$valu2 === void 0 ? void 0 : _dataToIntegrate$valu2.url)) == false) {
          setMessage("The url format is invalid.");
          setHidden(false);
        } else {
          if (checkIfTokenOrBasiAuth(authType === null || authType === void 0 ? void 0 : authType.authType) == true) {
            var _dataToIntegrate$valu3, _dataToIntegrate$valu4, _dataToIntegrate$valu5;
            if ((dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu3 = dataToIntegrate.value) === null || _dataToIntegrate$valu3 === void 0 ? void 0 : (_dataToIntegrate$valu4 = _dataToIntegrate$valu3.source) === null || _dataToIntegrate$valu4 === void 0 ? void 0 : (_dataToIntegrate$valu5 = _dataToIntegrate$valu4.requests) === null || _dataToIntegrate$valu5 === void 0 ? void 0 : _dataToIntegrate$valu5.length) > 0) {
              var _dataToIntegrate$valu6, _dataToIntegrate$valu7, _dataToIntegrate$valu8;
              let holder = [];
              dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu6 = dataToIntegrate.value) === null || _dataToIntegrate$valu6 === void 0 ? void 0 : (_dataToIntegrate$valu7 = _dataToIntegrate$valu6.source) === null || _dataToIntegrate$valu7 === void 0 ? void 0 : (_dataToIntegrate$valu8 = _dataToIntegrate$valu7.requests) === null || _dataToIntegrate$valu8 === void 0 ? void 0 : _dataToIntegrate$valu8.map(dd => {
                holder.push({
                  name: dd === null || dd === void 0 ? void 0 : dd.name,
                  visualization: dd === null || dd === void 0 ? void 0 : dd.visualizations,
                  dx: dd === null || dd === void 0 ? void 0 : dd.dx,
                  pe: dd === null || dd === void 0 ? void 0 : dd.pe,
                  ou: dd === null || dd === void 0 ? void 0 : dd.ou,
                  inputIdScheme: "code",
                  outputIdScheme: "code"
                });
              });
              if ((authValues === null || authValues === void 0 ? void 0 : authValues.username) == undefined || (authValues === null || authValues === void 0 ? void 0 : authValues.username) == "" || (authValues === null || authValues === void 0 ? void 0 : authValues.password) == undefined || (authValues === null || authValues === void 0 ? void 0 : authValues.password) == "") {
                setMessage("Username or password is missing");
                setHidden(false);
              } else {
                var _dataToIntegrate$valu9, _dataToIntegrate$valu10, _dataToIntegrate$valu11;
                console.log(holder);
                let payload = {
                  resource: "aggregateDataExchanges",
                  type: "create",
                  data: {
                    name: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu9 = dataToIntegrate.value) === null || _dataToIntegrate$valu9 === void 0 ? void 0 : _dataToIntegrate$valu9.dexname,
                    source: {
                      requests: holder
                    },
                    // source: {
                    //   requests: dataToIntegrate?.value?.source?.request,
                    // },
                    target: {
                      type: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu10 = dataToIntegrate.value) === null || _dataToIntegrate$valu10 === void 0 ? void 0 : _dataToIntegrate$valu10.type,
                      api: {
                        url: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu11 = dataToIntegrate.value) === null || _dataToIntegrate$valu11 === void 0 ? void 0 : _dataToIntegrate$valu11.url,
                        username: authValues === null || authValues === void 0 ? void 0 : authValues.username,
                        password: authValues === null || authValues === void 0 ? void 0 : authValues.password
                      },
                      request: {
                        idScheme: "code"
                      }
                    }
                  }
                };
                mutation(payload);
              }
            } else {}
          } else {}
        }
      }
    } else {
      var _dataToIntegrate$valu12, _dataToIntegrate$valu13, _dataToIntegrate$valu14, _dataToIntegrate$valu15, _dataToIntegrate$valu16;
      let payload = {
        resource: "aggregateDataExchanges",
        type: "create",
        data: {
          name: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu12 = dataToIntegrate.value) === null || _dataToIntegrate$valu12 === void 0 ? void 0 : _dataToIntegrate$valu12.dexname,
          source: {
            requests: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu13 = dataToIntegrate.value) === null || _dataToIntegrate$valu13 === void 0 ? void 0 : (_dataToIntegrate$valu14 = _dataToIntegrate$valu13.source) === null || _dataToIntegrate$valu14 === void 0 ? void 0 : _dataToIntegrate$valu14.request
          },
          target: {
            type: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu15 = dataToIntegrate.value) === null || _dataToIntegrate$valu15 === void 0 ? void 0 : _dataToIntegrate$valu15.type,
            api: {
              url: dataToIntegrate === null || dataToIntegrate === void 0 ? void 0 : (_dataToIntegrate$valu16 = dataToIntegrate.value) === null || _dataToIntegrate$valu16 === void 0 ? void 0 : _dataToIntegrate$valu16.url,
              accessToken: authValues === null || authValues === void 0 ? void 0 : authValues.token
            },
            request: {
              idScheme: "code"
            }
          }
        }
      };
      // mutation(payload);
    }
  };

  if (error) {
    return /*#__PURE__*/React.createElement("span", null, " Error : ", error.message);
  }
  if (loading) {
    return /*#__PURE__*/React.createElement(Center, null, /*#__PURE__*/React.createElement(CircularLoader, {
      large: true
    }));
  }
  const updateEntry = data => {
    setDataToUpdate(data);
  };

  // update the initialized entry in the datastore
  const updateGeneralInputValues = _ref => {
    let {
      data,
      values
    } = _ref;
    console.log({
      data,
      values
    });
    if ((values === null || values === void 0 ? void 0 : values.dexname) == "" || (values === null || values === void 0 ? void 0 : values.dexname) == null || (values === null || values === void 0 ? void 0 : values.dexname) == undefined || (values === null || values === void 0 ? void 0 : values.url) == "" || (values === null || values === void 0 ? void 0 : values.url) == null || (values === null || values === void 0 ? void 0 : values.url) == undefined) {} else {
      engine.mutate({
        resource: `dataStore/DEX_initializer_values/${data === null || data === void 0 ? void 0 : data.key}`,
        type: "update",
        data: _ref2 => {
          var _dataToUpdate$value;
          let {} = _ref2;
          return {
            createdAt: dataToUpdate === null || dataToUpdate === void 0 ? void 0 : (_dataToUpdate$value = dataToUpdate.value) === null || _dataToUpdate$value === void 0 ? void 0 : _dataToUpdate$value.createdAt,
            updatedAt: new Date().toLocaleDateString(),
            dexname: values === null || values === void 0 ? void 0 : values.dexname,
            type: type,
            url: values === null || values === void 0 ? void 0 : values.url
          };
        }
      }).then(res => {
        if (res.httpStatusCode == 200) {
          setOpenUpdate(!openUpdate);
          setSuccessMessage(true);
          setHidden(false);
          setMessage("Data saved in the datastore successfully.");
        }
      }).catch(e => {
        setHidden(false);
        setMessage("Error occured. Either server or the inputs causes this error.");
      });
    }
  };
  // delete the initialized entry in datastore
  const deleteEntry = data => {
    setDataToDelete(data);
  };
  const integrateEntry = data => {
    setDataToIntegrate(data);
  };
  const deleteDataEntry = data => {
    if ((data === null || data === void 0 ? void 0 : data.key) == null || (data === null || data === void 0 ? void 0 : data.key) == undefined || (data === null || data === void 0 ? void 0 : data.key) == "") {} else {
      let payload = {
        resource: "dataStore/DEX_initializer_values",
        id: data === null || data === void 0 ? void 0 : data.key,
        type: "delete"
      };
      engine.mutate(payload).then(res => {
        if (res.httpStatusCode == 200) {
          setOpenDelete(!openDelete);
          setSuccessMessage(true);
          setHidden(false);
          setMessage("Data saved in the datastore successfully.");
        }
      }).catch(e => {
        setHidden(false);
        setMessage("Error occured. Either server or the inputs causes this error.");
      });
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HeaderComponent, null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(Routes, null, /*#__PURE__*/React.createElement(Route, {
    index: true,
    element: /*#__PURE__*/React.createElement(HomePage, {
      data: data,
      styles: classes,
      open: open,
      setOpenUpdate: setOpenUpdate,
      openUpdate: openUpdate,
      openIntegration: openIntegration,
      setOpenIntegration: setOpenIntegration,
      setOpen: setOpen,
      setOpenDelete: setOpenDelete,
      openDelete: openDelete,
      deleteEntry: deleteEntry,
      updateEntry: updateEntry,
      integrateEntry: integrateEntry
      // initializeIntegration={initializeIntegration}
    })
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/view/:key",
    element: /*#__PURE__*/React.createElement(ViewDataStoreById, {
      data: data,
      styles: classes
    })
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/new-request/:key",
    element: /*#__PURE__*/React.createElement(AddNewRequests, {
      data: data,
      style: classes
    })
  }), /*#__PURE__*/React.createElement(Route, {
    path: "*",
    element: /*#__PURE__*/React.createElement(NoPageFound, null)
  }))))), /*#__PURE__*/React.createElement(NewDataInitialization, {
    open: open,
    setOpen: setOpen,
    styles: classes,
    setType: setType,
    formInputValues: formInputValues,
    type: type,
    setFormInputValues: setFormInputValues,
    saveGeneralInputValues: saveGeneralInputValues
  }), /*#__PURE__*/React.createElement(UpdateDataInitialization, {
    setType: setType,
    styles: classes,
    type: type,
    setOpenUpdate: setOpenUpdate,
    openUpdate: openUpdate,
    setUpdateFormInputValues: setUpdateFormInputValues,
    updateFormInputValues: updateFormInputValues,
    updateGeneralInputValues: updateGeneralInputValues,
    data: dataToUpdate
  }), /*#__PURE__*/React.createElement(IntegrateDataStoreInitializationToDEX, {
    setAuthType: setAuthType,
    styles: classes,
    type: type,
    authType: authType,
    setOpenIntegration: setOpenIntegration,
    openIntegration: openIntegration,
    setAuthValues: setAuthValues,
    authValues: authValues,
    initializeIntegration: initializeIntegration,
    data: dataToIntegrate
  }), /*#__PURE__*/React.createElement(DeleteEntry, {
    setOpenDelete: setOpenDelete,
    openDelete: openDelete,
    deleteDataEntry: deleteDataEntry,
    data: dataToDelete
  }));
};
export default MyApp;