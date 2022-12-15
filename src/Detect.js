// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import { Popup } from "./Popup";
import { drawRect, drawRect3, drawText } from "./utilities";
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

    var first = true;

    const [flag, setFlag] = useState({
        backbuttonFlag: false,
    });
    const [fps, setFPS] = useState("Loading Predictions");

    const [counter, setCounter] = useState(0);
    const [screenshot, setScreenshot] = useState(null);

    const [open, setOpen] = useState(false);
    var message = "";

    const [state, setState] = useState({
        current: "",
        token: "",
        /*
        clickIndex: "",
        project: "",
        projectItems: "",
        scene: "",
        sceneItems: "",
        experiment: "",
        experimentItems: "",
        run: "",
        runItems: "", */
        url: "",
        apikey: "",
        apisecret: "",
        labels: "",
        modelIndex: "",
        labelIndex: "",
        experi: "",
        run: "",
        image: "",
    });

    var t0 = 0, t1 = 0;

    var img;

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
            t0 = performance.now();
            state.current = params.state.current;
            state.token = params.state.token;
            /*
            state.clickIndex = params.state.clickIndex;
            state.project = params.state.project;
            state.projectItems = params.state.projectItems;
            state.scene = params.state.scene;
            state.sceneItems = params.state.sceneItems;
            state.experiment = params.state.experiment;
            state.experimentItems = params.state.experimentItems;
            state.run = params.state.run;
            state.runItems = params.state.runItems; */
            state.url = params.state.url;
            state.apikey = params.state.apikey;
            state.apisecret = params.state.apisecret;
            state.labels = params.state.label;
            state.modelIndex = params.state.modelIndex;
            state.labelIndex = params.state.labelIndex;
            state.experi = params.state.experi;
            state.run = params.state.run;
            state.image = params.state.response;
            message = "Detected " + params.state.label;
            console.log(state);
            runFunc();
        }
    }

    function handleBack() {
        flag.backbuttonFlag = true;
        var current = state.current;
        var token = state.token;
        /*
        var clickIndex = state.clickIndex;
        var project = state.project;
        var projectItems = state.projectItems;
         var scene = state.scene;
        var sceneItems = state.sceneItems;
        var experiment = state.experiment;
        var experimentItems = state.experimentItems;
        var run = state.run;
        var runItems = state.runItems; */
        var url = state.url.substring(8);
        var apikey = state.apikey;
        var apisecret = state.apisecret;
        navigate("/detect", {
            state: {
                current,
                token,
                /*
                clickIndex,
                project,
                projectItems,
                scene,
                sceneItems,
                experiment,
                experimentItems,
                run,
                runItems, */
                url,
                apikey,
                apisecret,
            },
        });
    }

    const runFunc = async() => {
        if(state.image != ""){
            img = new Image();
            img.src = state.image;
        }
        setInterval(() => {
            if (detectFlag.current === true) {
                detect();
            }
        }, 100);
    };

    /*
    async function getMask() {
        const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);
        console.log(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer");
		return axios.post(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + state.token
            }
		}).then((response) => response.data).catch(error => console.log());
    } */

    useEffect(() => {
        if (counter >= 5) {
            setOpen(true)
        } else {
            setOpen(false)
        }
      }, [counter]);

    const drawBoxes = async() => {
        setInterval(() => {
            /*
            if(Math.floor(Math.random() * 100) == 0){
                setOpen(true);
            } */
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            const ctx = canvasRef.current.getContext("2d");
            //if img mask uploaded, then show
            if(img !== undefined){
                var canvas = ctx.canvas;
                var hRatio = canvas.width / img.width;
                var vRatio = canvas.height / img.height;
                var ratio  = Math.min(hRatio, vRatio);
                var centerShift_x = (canvas.width - img.width * ratio) / 2;
                var centerShift_y = (canvas.height - img.height * ratio) / 2;
                ctx.drawImage(img, 0, 0, img.width, img.height,
                    centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
            }

            if(open){
                console.log("hello")
                var txt = "Detected ";
                for(var i = 0; i < state.labels; i++){
                    txt += state.labels[i] + ", ";
                }
                txt = txt.slice(0, -2) + ".";
                drawText(txt, ctx)
                console.log("preds");
            }

            if(boxes.current && !flag.backbuttonFlag && !open) {
                var newboxes = {
                    image: {
                        width: boxes.current.image.width,
                        height: boxes.current.image.height
                    },
                    predictions: []
                };

                //console.log(boxes.current
                for(var i = 0; i < boxes.current.predictions.length; i++){
                    //console.log("hello")
                    //console.log(boxes.current.predictions[i])
                    if(state.labels.includes(boxes.current.predictions[i].name)){
                        //console.log(boxes.current.predictions[i])
                        newboxes.predictions.push(boxes.current.predictions[i]);
                    }
                }
                if(newboxes.predictions.length > 0){
                    //console.log(newboxes)
                    drawRect(newboxes, ctx);
                    drawRect(ctx);
                }
                /*
                if(state.labels.every(r => boxes.current.predictions.some(e => e.name === r))){
                  //  console.log("hello");
                    drawRect(preds, ctx);
                    drawRect(ctx);
                } */

                {/*
                    for(var i = 0; i < boxes.current.predictions.length; i++){
                        if(vendors.some(e => e.Name === 'Magenic')  state.labels.includes(boxes.current.predictions[i].name)){
                            found = true;
                            console.log(boxes.current.predictions[i].name)
                            //newboxes.push(boxes.current.predictions[i]);
                        }
                        else {
                            found = false;
                            break;
                        }
                    }

                    if(found){
                        setCounter((counter) => counter + 1);
                        drawRect(boxes.current, ctx);
                        drawRect(ctx);
                    }
                    if(!found){
                        setCounter(0);
                        //console.log("hello");
                    }
                */ }
                /*
                console.log(boxes.current.predictions[i].name);
                console.log(state.label);
                console.log(boxes.current.predictions[i].name);
                for(var j = 0; j < state.labels.length; j++){
                    console.log(state.labels[j].label);
                    if(boxes.current.predictions[i].name === state.labels[j].label){
                        found = true;
                        setCounter((counter) => counter + 1);
                        boxes.current.predictions = boxes.current.predictions[i];
                        console.log(boxes.current)
                        drawRect(boxes.current, ctx);
                        drawRect(ctx);
                    }
                }
                if(!found){
                    setCounter(0);
                    console.log("hello");
                } */
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
            setScreenshot(screen);
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            // video height/width
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            // canvas height/width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const api = await predictions(screen);
            //console.log(api);
            if(first){
                t1 = performance.now();
                setFPS("Load Time: " +(t1 - t0).toFixed(3) + " ms");
                first = false;
            }
            if(api != "error") {
                //console.log("not error");
                boxes.current = api;
            }
            if(state.labels.every(r => boxes.current.predictions.some(e => e.name === r))){
                  setCounter((counter) => counter + 1);
            }
            else setCounter(0)
            ///console.log(counter)
        }
        detectFlag.current = true;
    };

    async function predictions(imageSrc) {
        const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);
        //console.log("predicts");
        //console.log(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer");
		return axios.post(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + state.token
            }
		}).then((response) => response.data).catch(error => console.log());
    }

    useEffect(() => { drawBoxes() }, []);
    useEffect(() => { readyCall() }, []);

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
                    <div style={{ paddingRight: 20 }} className="right">Predictions: {counter}</div>
                </Toolbar>
            </div>
            <div className="App">
                <>
                    {(counter < 5) ? (
                        <Webcam
                            ref={webcamRef}
                            muted={true}
                            //video={{ facingMode: "user"}}
                            //video={{ facingMode: { exact: "environment" } }}
                            videoConstraints={{ deviceId, height: 2000, width: 2000, facingMode: { exact: "environment" } }}
                            screenshotFormat="image/jpeg"
                            style={{
                                position: "fixed",
                                width: "100%",
                                height: "100%",
                                left: "0%",
                                objectFit: "cover",
                                objectPosition: "ce-nter"
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
                    ) : (
                        <img src={screenshot} alt="screenshot" style={{
                            position: "fixed",
                            width: "100%",
                            height: "100%",
                            left: "0%",
                            objectFit: "cover",
                            objectPosition: "center"
                        }}/>
                    )}
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
                    {open === true ?
                        <div style={{height: "80px", position: "fixed", justifyContent: "center", textAlign: "center", verticalAlign: "center"}}
                            className="select-container">
                            <div className="title">{"Detected " + state.labels.join(", ")}</div>
                        </div> : null}
                </>
            </div>
        </>
    );
}

export default App;