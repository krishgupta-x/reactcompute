// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import { drawRect, drawRect3 } from "./utilities";
import 'onsenui/css/onsen-css-components.css';
import { Toolbar, BackButton } from 'react-onsenui';

function App() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectFlag = useRef(true);
    const boxes = useRef(null);
    const prevBoxes = useRef(null);

    const params = useLocation();
    let navigate = useNavigate();

    var protocol = "",
        ipaddr = "",
        port = "";
    var score = '/predict?score_threshold=';
    var scorethresh = '0.5';
    var iou = '&iou_threshold=';
    var iouthresh = '0.5';

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const handleDevices = React.useCallback(
        mediaDevices =>
        setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")), [setDevices]
    );

    React.useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        }, [handleDevices]
    );
    //multi camera end ---

    function readyAPIData() {
        if (params.state === null) {
            navigate("/");
        } else {
            protocol = params.state.protocol + "://";
            ipaddr = params.state.ipaddress;
            port = ":" + params.state.port;
        }
    }

    function handleBack() {
        console.log("hello");
        navigate("/");
    }

    const run = async() => {
        readyAPIData();
        setInterval(() => {
            if (detectFlag.current === true) {
                var t0 = performance.now();
                detect();
                var t1 = performance.now();
                //console.log(`detect took ${t1 - t0} milliseconds.`);
                //console.log(" ----- ");
            }
        }, 100);
    };

    const drawBoxes = async() => {
        setInterval(() => {
            if (boxes.current !== null) {
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const ctx = canvasRef.current.getContext("2d");
                drawRect3(ctx);
                if (boxes.current.predictions.length > 0) drawRect(boxes.current, ctx);
            }
        }, 0);
    }

    const detect = async() => {
        detectFlag.current = false;
        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null &&
            webcamRef.current.video.readyState === 4
        ) {
            const screen = webcamRef.current.getScreenshot();
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            // video height/width
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            // canvas height/width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const api = await apiCall(screen);
            boxes.current = api;
            // console.log(`Call to api took ${t1 - t0} milliseconds.`);

            //const ctx = canvasRef.current.getContext("2d");
            //if(api.predictions.length > 0) drawRect(api, ctx);
            //drawRect2(obj, ctx);
        }
        detectFlag.current = true;
        var tfull2 = performance.now();
        //console.log(`Function took ${tfull2 - tfull} milliseconds.`);
    };

    async function apiCall(imageSrc) {
        const image = await fetch(imageSrc);
        const imageBlob = await image.blob();
        const file = new File([imageBlob], "test.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('file', file);

        return axios.put("https://192.168.4.23:4433/predict?score_threshold=0.5&iou_threshold=0.5",
            formData, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data'
                },
            }).then(response => response.data);

        /*
        console.log(data.image.height);
        console.log(data.image.width);
        console.log(data.predictions);
        console.log(data.predictions.length);
        if(data.predictions.length >= 1){
          console.log(data.predictions[0].name);
          console.log(data.predictions[0].bbox[0]);
          console.log(data.predictions[0].bbox[1]);
          console.log(data.predictions[0].bbox[2]);
          console.log(data.predictions[0].bbox[3]);
        }
        console.log("-------"); */
    }

    useEffect(() => { drawBoxes() }, []);
    useEffect(() => { run() }, []);

    return ( <
        >
        <
        div style = {
            {
                display: 'block',
                width: 500
            }
        } >
        <
        Toolbar modifier = "material" >
        <
        div className = "left" >
        <
        BackButton onClick = { handleBack } > Back < /BackButton></div >
        <
        /Toolbar> <
        /div> <
        div className = "App" >
        <
        header className = "App-header" >
        <
        Webcam ref = { webcamRef }
        muted = { true }
        //video={{ facingMode: "user"}}
        //video={{ facingMode: { exact: "environment" } }}
        videoConstraints = {
            { deviceId } }
        screenshotFormat = "image/jpeg"
        //className="webcamCapture"
        style = {
            {
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                width: 640,
                height: 480,
            }
        }

        /> <
        canvas ref = { canvasRef }
        style = {
            {
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                width: 640,
                height: 480,
            }
        }
        /> <
        /header> <
        div > {
            devices.map((device, key) => ( <
                button className = "buttons"
                type = "button"
                key = { device.deviceId }
                onClick = {
                    () => setDeviceId(device.deviceId) } > { device.label || `Device ${key + 1}` } <
                /button>
            ))
        } <
        /div> <
        /div> <
        />
    );
}

export default App;