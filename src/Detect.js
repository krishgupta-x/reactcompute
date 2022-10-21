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

    const [flag, setFlag] = useState({
        backbuttonFlag: false,
    });

    var url = "";
    var data = "";
    var runind = "";
    var experiment = "";

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

    function readyCall() {
        console.log(params.state);
        if (params.state === null) {
            navigate("/detect");
        } else {
            url = params.state.url;
            data = params.state.data;
            experiment = params.state.exper;
            runind = params.state.run;
        }
    }

    function handleBack() {
        flag.backbuttonFlag = true;
        navigate("/detect");
    }

    const run = async() => {
        readyCall();
        setInterval(() => {
            if (detectFlag.current === true) {
                var t0 = performance.now();
                detect();
                var t1 = performance.now();
            }
        }, 100);
    };

    const drawBoxes = async() => {
        setInterval(() => {
            if (boxes.current !== null && !flag.backbuttonFlag) {
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

            const api = await predictions(screen);
            boxes.current = api;
            console.log(boxes.current);
        }
        detectFlag.current = true;
    };

    async function predictions(imageSrc) {
        console.log("predictions");
        const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);

		return axios.post(url + "/api/ar/data/experiments/" + experiment + "/run/" + runind + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + data
            }
		}).then((response) => response.data);
    }

    useEffect(() => { drawBoxes() }, []);
    useEffect(() => { run() }, []);

    return (
        <>
            <div style={{
                display: "block",
                width: 500,
            }}>
                <Toolbar modifier="material">
                    <div className="left">
                        <BackButton onClick={handleBack}> Back </BackButton>
                    </div>
                </Toolbar>
            </div>
            <div className="App">
                <header className="App-header">
                    <Webcam
                        ref={webcamRef}
                        muted={true}
                        //video={{ facingMode: "user"}}
                        //video={{ facingMode: { exact: "environment" } }}
                        videoConstraints={{
				device: deviceId,
				facingMode: { exact: "environment" },
			}}
                        screenshotFormat="image/jpeg"
                        style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        width: 640,
                        height: 480,
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        width: 640,
                        height: 480,
                        }}
                    />
                </header>
                <div>
                    {devices.map((device, key) => (
                        <button
                        class="button"
                        type="button"
                        key={device.deviceId}
                        onClick={() => setDeviceId(device.deviceId)}
                        >
                            {device.label || `Device ${key + 1}`}{" "}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

export default App;
