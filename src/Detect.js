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
import { faC } from "@fortawesome/free-solid-svg-icons";

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
        setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

function App() {
    const { height, width } = useWindowDimensions();
    //const [width, height] = useWindowSize();
    //const [widthT, heightT] = throttled({ fps: 60 });
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectFlag = useRef(true);
    const boxes = useRef(null);
    const params = useLocation();
    let navigate = useNavigate();

    const [flag, setFlag] = useState({
        backbuttonFlag: false,
    });
    const [fps, setFPS] = useState("Loading Predictions");

    var current = "";
    var token = "";
    var clickIndex = "";
    var project = "";
    var projectItems = "";
    var scene = "";
    var sceneItems = "";
    var experiment = "";
    var experimentItems = "";
    var run = "";
    var runItems = "";
    var url = "";
    var apikey = "";
    var apisecret = "";

    var t0 = 0, t1 = 0;

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const handleDevices = React.useCallback(
        mediaDevices => {
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"))
        }, [setDevices]
    );

    React.useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        }, [handleDevices]
    );
    //multi camera end ---

    function readyCall() {
        if (params.state === null) {
            navigate("/detect");
        }
        else {
            current = params.state.current;
            token = params.state.token;
            clickIndex = params.state.clickIndex;
            project = params.state.project;
            projectItems = params.state.projectItems;
            scene = params.state.scene;
            sceneItems = params.state.sceneItems;
            experiment = params.state.experiment;
            experimentItems = params.state.experimentItems;
            run = params.state.run;
            runItems = params.state.runItems;
            url = params.state.url;
            apikey = params.state.apikey;
            apisecret = params.state.apisecret;
        }
    }

    function handleBack() {
        flag.backbuttonFlag = true;
        navigate("/detect", {
            current,
            token,
            clickIndex,
            project,
            projectItems,
            scene,
            sceneItems,
            experiment,
            experimentItems,
            run,
            runItems,
            url,
            apikey,
            apisecret
        });
    }

    const frameCount = async() => {
        setInterval(() => {
            setFPS(1000/(t1 - t0));
        }, 1000);
    };

    const runFunc = async() => {
        readyCall();
        frameCount();
        setInterval(() => {
            if (detectFlag.current === true) {
                detect();
            }
        }, 100);
    };

    const drawBoxes = async() => {
        setInterval(() => {
            t0 = performance.now();
            if (boxes.current !== null && !flag.backbuttonFlag) {
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const ctx = canvasRef.current.getContext("2d");
                if(boxes.current.predictions.length > 0){
                    drawRect(boxes.current, ctx);
                    drawRect(ctx);
                }
            }
            t1 = performance.now();
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
            setFPS(0);
            if(api != "error") boxes.current = api;
        }
        detectFlag.current = true;
    };

    async function predictions(imageSrc) {
        const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);

		return axios.post(url + "/api/ar/data/experiments/" + experiment + "/run/" + run + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => console.log());
    }

    useEffect(() => { drawBoxes() }, []);
    useEffect(() => { runFunc() }, []);

    const handleFlip = (e) => {
        const value = e.target.value;
        setDeviceId(value);
	}

    return (
        <>
            <div style={{
                display: "block",
                width: "100%",
            }}>
                <Toolbar modifier="material">
                    <div className="left">
                        <BackButton onClick={handleBack}> Back </BackButton>
                        {' '}
                        <button>{fps}</button>
                    </div>

                    <div className="right">
                        <select
                            name="url"
                            onChange={handleFlip}
                        >
                            {devices.map((device, key) => (
                                <option value={device.deviceId}>{device.label || `Device ${key + 1}`}{" "}</option>
                            ))}
                        </select>
                    </div>
                </Toolbar>
            </div>
            <div className="App">
                <>
                    <Webcam
                        ref={webcamRef}
                        muted={true}
                        //video={{ facingMode: "user"}}
                        //video={{ facingMode: { exact: "environment" } }}
                        videoConstraints={{ deviceId, height: 2000, width: 2000}}
                        screenshotFormat="image/jpeg"
                        style={{
                            position: "fixed",
                            width: "100%",
                            height: "100%",
                            left: "0%",
                            objectFit: "cover",
                            objectPosition: "center"
                          }}
                        //className="webcamCapture"
                        /*
                        style={{
                            position: "absolute",
                            marginLeft: "auto",
                            marginRight: "auto",
                            left: 0,
                            right: 0,
                            //width: 640,
                            //height: 800,
                        }} */
                    />

                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "fixed",
                            left: "0%",
                            objectFit: "cover",
                            objectPosition: "center",
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </>
            </div>
        </>
    );
}

export default App;