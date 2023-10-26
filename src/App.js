import React, { useState, useEffect } from "react";
import { DataQuery, useDataEngine, useDataQuery } from "@dhis2/app-runtime";
import classes from "./App.module.css";
import HeaderComponent from "./components/widgets/headerComponent";
import {
  AlertBar,
  Box,
  Button,
  Center,
  CircularLoader,
  Divider,
  I,
  Layer,
} from "@dhis2/ui";
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
      fields: [
        "id,name,level,path,displayName,code,children,ancestors,created,href,user,users,userAccesses",
      ],
      order: "level",
    },
  },
  visualizations: {
    resource: "visualizations",
    params: {
      paging: false,
      field: ["id", "displayName"],
    },
  },
  indicators: {
    resource: "indicators",
    params: {
      paging: false,
      fields: ["id", "name", "displayName", "code"],
    },
  },
  dataElements: {
    resource: "dataElements",
    params: {
      paging: false,
      fields: ["id", "name", "formName", "displayName", "code"],
    },
  },
  periodTypes: {
    resource: "periodTypes",
    params: {
      fields: ["*"],
    },
  },
  aggregateDataExchanges: {
    resource: "aggregateDataExchanges",
    params: {
      fields: ["*"],
    },
  },
  dataStore: {
    resource: "dataStore",
    params: {
      paging: false,
      fields: ["*"],
    },
  },
};

// const validater = new UrlValidator();
const MyApp = () => {
  const [formInputValues, setFormInputValues] = useState({
    dexname: "",
    url: "",
  });
  const [updateFormInputValues, setUpdateFormInputValues] = useState({
    dexname: "",
    url: "",
  });
  const [authValues, setAuthValues] = useState({
    username: "",
    password: "",
    token: "",
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
  const [selectedDataDimensionsCodes, setSelectedDataDimensionsCodes] =
    useState([]);
  const [hide, setHidden] = useState(true);
  const [message, setMessage] = useState("");

  const [isSuccessMessage, setSuccessMessage] = useState(false);
  const [authType, setAuthType] = useState({
    TOKEN: "TOKEN",
    BASICAUTH: "BASICAUTH",
  });

  const { loading, error, data, refetch } = useDataQuery(query);

  // save to datastore
  const saveGeneralInputValues = () => {
    if (
      type == null ||
      type == undefined ||
      type == "" ||
      formInputValues?.dexname == null ||
      formInputValues?.dexname == undefined ||
      formInputValues?.dexname == "" ||
      formInputValues?.url == null ||
      formInputValues?.url == undefined ||
      formInputValues?.url == ""
    ) {
      setSuccessMessage(true);
      setHidden(false);
      setMessage("Error occured.");
    } else {
      let payload = {
        resource: `dataStore/DEX_initializer_values/${new Date().getTime()}`,
        type: "create",
        data: {
          createdAt: new Date().toLocaleString(),
          dexname: formInputValues?.dexname,
          url: formInputValues?.url,
          type: type,
        },
      };
      engine
        .mutate(payload)
        .then((res) => {
          if (res.httpStatusCode == 201) {
            setOpen(!open);
            setSuccessMessage(true);
            setHidden(false);
            setMessage("Data saved in the datastore successfully.");
          }
        })
        .catch((e) => {
          setHidden(false);
          setMessage(
            "Error occured. Either server or the inputs causes this error."
          );
        });
    }
  };
  // a post request to the data echange resource
  const mutation = (data) => {
    engine
      .mutate(data)
      .then((res) => {
        if (res.httpStatusCode == 201) {
          setOpenIntegration(false);
          setSuccessMessage(true);
          setHidden(false);
          setMessage(
            "Data exchange initialization is successfull\nPlease use the Data Exchange app to submit the Data."
          );
        }
      })
      .catch((e) => {
        setHidden(false);
        setMessage(
          "Error occured. Either server or the inputs causes this error."
        );
      });
  };

  // check if token or password
  const checkIfTokenOrBasiAuth = (authTypeValue) => {
    if (authTypeValue == authType.BASICAUTH) {
      return true;
    } else {
      return false;
    }
  };

  // constructing a data exchange api layout as defined in the url
  // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/data-exchange.html
  const initializeIntegration = (data) => {
    if (formData?.type == type?.EXTERNAL) {
      if (dataToIntegrate?.value?.url == "") {
        setMessage("Please enter target DHIS2 instance url");
        setHidden(false);
      } else {
        if (UrlValidator?.isValidUrl(dataToIntegrate?.value?.url) == false) {
          setMessage("The url format is invalid.");
          setHidden(false);
        } else {
          if (checkIfTokenOrBasiAuth(authType?.authType) == true) {
            if (dataToIntegrate?.value?.source?.requests?.length > 0) {
              let holder = [];
              dataToIntegrate?.value?.source?.requests?.map((dd) => {
                holder.push({
                  name: dd?.name,
                  visualization: dd?.visualizations,
                  dx: dd?.dx,
                  pe: dd?.pe,
                  ou: dd?.ou,
                  inputIdScheme: "code",
                  outputIdScheme: "code",
                });
              });
              if (
                authValues?.username == undefined ||
                authValues?.username == "" ||
                authValues?.password == undefined ||
                authValues?.password == ""
              ) {
                setMessage("Username or password is missing");
                setHidden(false);
              } else {
                let payload = {
                  resource: "aggregateDataExchanges",
                  type: "create",
                  data: {
                    name: dataToIntegrate?.value?.dexname,
                    source: {
                      requests: holder,
                    },
                    target: {
                      type: dataToIntegrate?.value?.type,
                      api: {
                        url: dataToIntegrate?.value?.url,
                        username: authValues?.username,
                        password: authValues?.password,
                      },
                      request: {
                        idScheme: "code",
                      },
                    },
                  },
                };
                mutation(payload);
              }
            } else {
            }
          } else {
          }
        }
      }
    } else {
      let payload = {
        resource: "aggregateDataExchanges",
        type: "create",
        data: {
          name: dataToIntegrate?.value?.dexname,
          source: { requests: dataToIntegrate?.value?.source?.request },
          target: {
            type: dataToIntegrate?.value?.type,
            api: {
              url: dataToIntegrate?.value?.url,
              accessToken: authValues?.token,
            },
            request: {
              idScheme: "code",
            },
          },
        },
      };
      mutation(payload);
    }
  };

  if (error) {
    return <span> Error : {error.message}</span>;
  }
  if (loading) {
    return (
      <Center>
        <CircularLoader large />
      </Center>
    );
  }
  const updateEntry = (data) => {
    setDataToUpdate(data);
  };

  // update the initialized entry in the datastore
  const updateGeneralInputValues = ({ data, values }) => {
    if (
      values?.dexname == "" ||
      values?.dexname == null ||
      values?.dexname == undefined ||
      values?.url == "" ||
      values?.url == null ||
      values?.url == undefined
    ) {
    } else {
      if (
        dataToUpdate?.value?.source == undefined ||
        dataToUpdate?.value?.source == null
      ) {
        engine
          .mutate({
            resource: `dataStore/DEX_initializer_values/${data?.key}`,
            type: "update",
            data: ({}) => ({
              createdAt: dataToUpdate?.value?.createdAt,
              updatedAt: new Date().toLocaleDateString(),
              dexname: values?.dexname,
              type: type,
              url: values?.url,
            }),
          })
          .then((res) => {
            if (res.httpStatusCode == 200) {
              setOpenUpdate(!openUpdate);
              setSuccessMessage(true);
              setHidden(false);
              setMessage("Data saved in the datastore successfully.");
            }
          })
          .catch((e) => {
            setHidden(false);
            setMessage(
              "Error occured. Either server or the inputs causes this error."
            );
          });
      } else {
        engine
          .mutate({
            resource: `dataStore/DEX_initializer_values/${data?.key}`,
            type: "update",
            data: ({}) => ({
              createdAt: dataToUpdate?.value?.createdAt,
              updatedAt: new Date().toLocaleDateString(),
              dexname: values?.dexname,
              source: dataToUpdate?.value?.source,
              type: type,
              url: values?.url,
            }),
          })
          .then((res) => {
            if (res.httpStatusCode == 200) {
              setOpenUpdate(!openUpdate);
              setSuccessMessage(true);
              setHidden(false);
              setMessage("Data saved in the datastore successfully.");
            }
          })
          .catch((e) => {
            setHidden(false);
            setMessage(
              "Error occured. Either server or the inputs causes this error."
            );
          });
      }
    }
  };
  // delete the initialized entry in datastore
  const deleteEntry = (data) => {
    setDataToDelete(data);
  };

  const integrateEntry = (data) => {
    setDataToIntegrate(data);
  };

  const deleteDataEntry = (data) => {
    if (data?.key == null || data?.key == undefined || data?.key == "") {
    } else {
      let payload = {
        resource: "dataStore/DEX_initializer_values",
        id: data?.key,
        type: "delete",
      };
      engine
        .mutate(payload)
        .then((res) => {
          if (res.httpStatusCode == 200) {
            setOpenDelete(!openDelete);
            setSuccessMessage(true);
            setHidden(false);
            setMessage("Data saved in the datastore successfully.");
          }
        })
        .catch((e) => {
          setHidden(false);
          setMessage(
            "Error occured. Either server or the inputs causes this error."
          );
        });
    }
  };
  return (
    <div>
      <div>
        <HeaderComponent />
        <br />
        <div style={{ padding: "20px" }}>
          <BrowserRouter>
            <Routes>
              <Route
                index
                element={
                  <HomePage
                    data={data}
                    styles={classes}
                    open={open}
                    setOpenUpdate={setOpenUpdate}
                    openUpdate={openUpdate}
                    openIntegration={openIntegration}
                    setOpenIntegration={setOpenIntegration}
                    setOpen={setOpen}
                    setOpenDelete={setOpenDelete}
                    openDelete={openDelete}
                    deleteEntry={deleteEntry}
                    updateEntry={updateEntry}
                    integrateEntry={integrateEntry}
                    // initializeIntegration={initializeIntegration}
                  />
                }
              />
              <Route
                path="/view/:key"
                element={<ViewDataStoreById data={data} styles={classes} />}
              />
              <Route
                path="/new-request/:key"
                element={<AddNewRequests data={data} style={classes} />}
              />
              <Route path="*" element={<NoPageFound />} />
            </Routes>
          </BrowserRouter>
        </div>

        {/* <div style={{ marginLeft: "50px" }}> */}
        {!hide &&<Layer translucent>
          <div style={{position: 'absolute',bottom: '0px',right: '25%',left:'35%',}}>        
        <Box>
          {isSuccessMessage == true ? (
            <AlertBar
              hidden={hide}
              success
              duration={4000}
              onHidden={(e) => {
                setHidden(true);
                // window.location.reload(true);
              }}
            >
              {message}
            </AlertBar>
          ) : (
            <AlertBar
              hidden={hide}
              warning
              duration={4000}
              onHidden={(e) => {
                setHidden(true);
              }}
            >
              {message}
            </AlertBar>
          )}
        </Box>
        </div>
        </Layer>}
      </div>
      <NewDataInitialization
        open={open}
        setOpen={setOpen}
        styles={classes}
        setType={setType}
        formInputValues={formInputValues}
        type={type}
        setFormInputValues={setFormInputValues}
        saveGeneralInputValues={saveGeneralInputValues}
      />
      <UpdateDataInitialization
        setType={setType}
        styles={classes}
        type={type}
        setOpenUpdate={setOpenUpdate}
        openUpdate={openUpdate}
        setUpdateFormInputValues={setUpdateFormInputValues}
        updateFormInputValues={updateFormInputValues}
        updateGeneralInputValues={updateGeneralInputValues}
        data={dataToUpdate}
      />
      <IntegrateDataStoreInitializationToDEX
        setAuthType={setAuthType}
        styles={classes}
        type={type}
        authType={authType}
        setOpenIntegration={setOpenIntegration}
        openIntegration={openIntegration}
        setAuthValues={setAuthValues}
        authValues={authValues}
        initializeIntegration={initializeIntegration}
        data={dataToIntegrate}
      />
      <DeleteEntry
        setOpenDelete={setOpenDelete}
        openDelete={openDelete}
        deleteDataEntry={deleteDataEntry}
        data={dataToDelete}
      />
    </div>
  );
};

export default MyApp;
