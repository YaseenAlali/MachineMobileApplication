import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerCommands } from './enum';

var RNFS = require('react-native-fs')
var socket = null;
var socketListener = null;
var socketCloseListener = null;
function clearSocket(){
    if (socket){
        socket.close();
        socket = null;
    }
}


function setSocket(newsocket){
    socket = newsocket;
}

function setListener(callback){
    socketListener = callback;
}
function clearListener(){
    socketListener = null;
}

function clearsocketCloseListener(){
    socketCloseListener = null;
}

function setsocketCloseListener(callback){
    socketCloseListener = callback;
}


async function checkServerIp(serverIpAndPort = "", CameraType = '0') {
    return new Promise((resolve, reject) => {
        const url = `ws://${serverIpAndPort}/ws/`;
        const socket = new WebSocket(url, undefined, {
            headers : {
                'CameraType' : CameraType,
            }
        });;
        socket.addEventListener('open', function (event) {
            console.log('Connected to server', event);
            resolve(true);
        });

        socket.addEventListener('error', function (event) {
            console.log('Failed to connect to server', event);
            resolve(false);
        });

        socket.addEventListener('close', function (event) {
            console.log('Disconnected from server', event);
            if (socketCloseListener){
                socketCloseListener();
            }
        });

        socket.addEventListener('message', async function (event) {
            if (event.data == ServerCommands.TakePicture) {
                if (socketListener){
                    console.log("socket listener")
                    await socketListener();
                }
                else{
                    console.log("no listerner")
                }
            }
            else{
                console.log("not equal")
            }
            console.log('Message from server: ', event.data);
            // event.data
        });
        setSocket(socket);
    });
}



async function RenameImage(imagePath) {
    try {
        let dateString = new Date().toISOString();
        var charsToRemove = '-TZ.:'
        const regexPattern = `[${charsToRemove}]`;
        const regex = new RegExp(regexPattern, 'g');
        dateString = dateString.replace(regex, '');


        let newName = RNFS.ExternalCachesDirectoryPath + "/" + dateString + ".jpg";
        await RNFS.moveFile(imagePath, newName);
        let res = await RNFS.exists(newName);
        if (res) {
            return newName;
        }
        return "";
    }
    catch (error) {
        console.warn(error)
        return "";
    }
}
const UploadFile = async (uri) => {
    try {
        RNFS.readFile(uri, 'base64')
        .then((base64Data) => {
            if (socket){
            socket.send(base64Data);
            }
            else{
                console.log("no socket")
            }
        }).catch((error) => {
            console.warn(error)
        })
    } catch (error) {
        console.warn(error)
    }

};

const GetLastAddress = async () => {
    let lastAddres = AsyncStorage.getItem('lastAddress');
    return lastAddres || "";    
}


/**
 * @param {string} newAddress 
 */
const SetLastAddress = async (newAddress) => {
    await AsyncStorage.setItem('lastAddress', newAddress);   
}

const GetLastCameraType = async () => {
    let CameraType = AsyncStorage.getItem('CameraType');
    return CameraType === null ? "0" : CameraType;    
}


/**
 * @param {string} CameraType 
 */
const SetLastCameraType = async (CameraType) => {
    await AsyncStorage.setItem('CameraType', CameraType);   
}

export { checkServerIp, RenameImage, UploadFile , socket, clearSocket, setSocket, setListener, clearListener, socketListener, GetLastAddress, SetLastAddress,
     clearsocketCloseListener, setsocketCloseListener, SetLastCameraType, GetLastCameraType}