import { Text, View, StyleSheet, TextInput, Button, Alert } from "react-native";
import { GetLastAddress, GetLastCameraType, RenameImage, SetLastAddress, SetLastCameraType, UploadFile, checkServerIp, clearListener, clearSocket, clearsocketCloseListener, setListener, setsocketCloseListener } from "./Helpers";
import { Dropdown } from 'react-native-element-dropdown';
const { useRef, useState, useEffect } = require("react");
const { useCameraDevices, Camera } = require("react-native-vision-camera");

export function CameraPage() {

    const [hasPermission, setHasPermission] = useState(false);
    const [serverIp, setServerIp] = useState('');
    const devices = useCameraDevices();
    const device = devices['back'];
    const CameraRef = useRef();
    const [showCamera, setshowCamera] = useState(false);
    const [selectedLabel, setselectedLabel] = useState('0');
    const [isFocus, setIsFocus] = useState(false);


    //ADD OTHER CAMERA TYPES HERE 
    const labels = [
        { label: 'Top', value: '0' },
        { label: 'I_Front', value: '1' },
        { label: 'I_Back', value: '2' },
        { label: 'O_Front', value: '3' },
        { label: 'O_Back', value: '4' },
      ];

      const renderLabel = () => {
        if (selectedLabel || isFocus) {
          return (
            <Text style={[styles.label, isFocus && { color: 'blue' }]}>
              Dropdown label
            </Text>
          );
        }
        return null;
      };
  


    const handleTextInputChange = (text) => {
        setServerIp(text);
    };
    async function askForCameraAndMicrophonePermissions() {
        try {
            const cameraPermissionStatus = await Camera.getCameraPermissionStatus();
            const microphonePermissionStatus = await Camera.getMicrophonePermissionStatus();
            if (cameraPermissionStatus === "authorized" && microphonePermissionStatus === "authorized") {
                setHasPermission(true)

            }

            const cameraPermissionResult = await Camera.requestCameraPermission();
            const microphonePermissionResult = await Camera.requestMicrophonePermission();

            if (cameraPermissionResult === 'authorized' && microphonePermissionResult === 'authorized') {
                setHasPermission(true)
            }
            else {
                setHasPermission(false)
            }


        } catch (error) {
            console.error("Error asking for permissions:", error);
        }
    }

    useEffect(() => {
        const fetchPermissions = async () => {
            await askForCameraAndMicrophonePermissions();

        };

        fetchPermissions();
        return () => {
            clearSocket();
            clearListener();
            clearsocketCloseListener();
        };
    }, []);

    useEffect(() => {
        if (showCamera){
            setListener(TakePicture());
            setsocketCloseListener(() => {
                setshowCamera(false);
                Alert.alert("Connection closed!");
            })
        }
    }, [showCamera]);

    useEffect(() => {
        GetLastCameraType().then((CameraType) => {
            setselectedLabel(CameraType);
        })
    }, []);

    useEffect(() => {
        if (showCamera){
            SetLastCameraType(selectedLabel).then(() => {
                console.log("Saved last value");
            })
        }
    }, [selectedLabel]);

    useEffect(() => {
        const fetchLastAddress = async () => {
            let lastAddres = await GetLastAddress();
            setServerIp(lastAddres);
        }

        if (hasPermission){
            fetchLastAddress();
        }
    }, [hasPermission]);



    if (hasPermission === false) {
        return (
            <View style={{ flex: 1 }}>
                <Text>No permissions</Text>
            </View>
        );
    }
    else if (device == null) {
        return (
            <View style={{ flex: 1 }}>
                <Text>No camera device detected</Text>
            </View>
        )
    }
    else if (!showCamera) {
        return (
            <View style={{ flex: 1 }}>
                <TextInput
                    value={serverIp}
                    onChangeText={handleTextInputChange}
                    style={{ color: 'red', borderWidth: 1, borderColor: 'red', }}
                    placeholder="Enter IP and port"
                    cursorColor={'red'}></TextInput>
                <Button title="Submit" onPress={async () => {
                    const serverIpAndPort = serverIp;
                    const cameraType = selectedLabel;
                    checkServerIp(serverIpAndPort, selectedLabel).then(isServerRunning => {
                        setshowCamera(isServerRunning)
                        if (!isServerRunning) {
                            Alert.alert("Server not active or invalid IP and port");
                        }
                        else{
                            SetLastAddress(serverIpAndPort).then(() => {
                                console.log("Saved last value");
                            })
                            SetLastCameraType(cameraType).then(() => {
                                console.log("Saved last value");
                            })
                        }
                    });
                }}></Button>
                 <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    itemTextStyle={{color : 'red'}}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={labels}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select camera type' : '...'}
                    value={selectedLabel}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={item => {
                        setselectedLabel(item.value);
                        setIsFocus(false);
                    }}
                    />
            </View>
        )

    }
    else {
        return (
            <View style={{ flex: 1 }}>
                <Camera
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        zIndex: 0
                    }}
                    device={device}
                    isActive={true}
                    ref={CameraRef}
                    photo={true}
                ></Camera>
                <Button
                    title="Take image manually"
                    onPress={TakePicture()}
                >
                </Button>
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    itemTextStyle={{color : 'red'}}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={labels}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select camera type' : '...'}
                    value={selectedLabel}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={item => {
                        setselectedLabel(item.value);
                        setIsFocus(false);
                    }}
                    />

                
            </View>
        )
    }

    function TakePicture() {
        return async () => {
            const photo = await CameraRef.current?.takePhoto();
            if (photo) {
                let newPath = await RenameImage(photo.path);
                if (newPath.length > 0) {
                    let res = await UploadFile(newPath);
                    console.log(res);
                }

            }
        };
    }
}

const styles = StyleSheet.create({
    container: {
    //   backgroundColor: 'white',
      padding: 16,
    },
    dropdown: {
      height: 50,
      borderColor: 'white',
      borderWidth: 3,
      borderRadius: 8,
      paddingHorizontal: 8,
      backgroundColor : 'black'
    },
    icon: {
      marginRight: 5,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'transparent',
      left: 22,
      top: 8,
      zIndex: 999,
      paddingHorizontal: 8,
      fontSize: 14,
    },
    placeholderStyle: {
      fontSize: 16,
    },
    selectedTextStyle: {
      fontSize: 16,
      color : 'red'
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
    },
  });