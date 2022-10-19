// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import * as qs from 'qs';
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import { drawRect, drawRect3 } from "./utilities";
import "onsenui/css/onsen-css-components.css";
import { Toolbar, BackButton, List } from "react-onsenui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faCircle,
  faCheckCircle,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { irfft } from "@tensorflow/tfjs";

function App() {
    const params = useLocation();
    let navigate = useNavigate();

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const [state, setState] = useState({
        current: "Projects",
        token: "",
        clickIndex: -1,
        project: "",
        projectItems: "",
        scene: "",
        sceneItems: "",
        experiment: "",
        experimentItems: "",
        run: "",
        runItems: "",
        url: "",
        apikey: "",
        apisecret: "",
    });

    const handleDevices = React.useCallback(
        (mediaDevices) =>
            setDevices(
                mediaDevices.filter(({ kind }) => kind === "videoinput")
            ),
        [setDevices]
    );

    React.useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);
    //multi camera end ---

    const [items, setItems] = useState([

    ]);

   async function readyCloud(){
        if (params.state === null) navigate("/");
        state.url = "https://" + params.state.url;
        state.apikey = params.state.apikey
        state.apisecret = params.state.apisecret;

        var token = await getToken();
        if(token == "error") state.current = "Error";
        else {
            state.token = token.trim();
            if(state.current == "Projects") projectData();
        }
    }

    async function projectData(){
        state.current = "Projects";
        var data = await getProjects(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                newItems.push(data[i]);
            }
            update(newItems);
        }
        state.projectItems = items;
    }

    async function sceneData(index, back){
        state.current = "Scenes";
        if(back == false) state.project = items[index].id;
        var data = await getScenes(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                newItems.push(data[i]);
            }
            update(newItems);
        }
        state.sceneItems = items;
    }

    async function experisData(index, back){
        state.current = "Experiments";
        if(back == false) state.scene = items[index].id;
        var data = await getExperiments(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                if(data[i].name == null) data[i].name = data[i].id;
                newItems.push(data[i]);
            }
            update(newItems);
        }
        state.experimentItems = items;
    }

    async function runData(index, back){
        state.current = "Runs";
        if(back == false) state.experiment = items[index].id;
        var data = await getRuns(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                if(data[i].name == null) data[i].name = data[i].id;
                newItems.push(data[i]);
            }
            update(newItems);
        }
        state.runItems = items;
    }

    async function predictData(index){
        state.current = "Runs";
        state.run = items[index].id;
        var data = state.token;
        var run = state.run;
        var exper = state.experiment;
        var url = state.url;
        navigate("/detect/run", {
            state: {
                url,
                data,
                run,
                exper,
            },
        });
    }

    const run = async () => {
        readyCloud();
    };

    async function getToken() {
		var data = qs.stringify({
			'client_id': state.apikey,
			'client_secret': state.apisecret
		});
        return axios.post(state.url + "/api/auth", data,
		{
			method: 'post',
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/x-www-form-urlencoded'
			},
        }).then(response => response.data.access_token).catch(error => "error");
    }

    async function getProjects(token) {
		return axios.get(state.url + "/api/ar/data/projects/", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then((response) => response.data).catch(error => "error");
    }

    async function getScenes(token) {
        return axios.get(state.url + "/api/ar/data/projects/" + state.project + "/scenes", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getExperiments(token, scene) {
		return axios.get(state.url + "/api/ar/data/scenes/" + state.scene + "/experiments", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getRuns(token, experiment) {
		return axios.get(state.url + "/api/ar/data/experiments/" + state.experiment + "/run", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    const update = (newItems) => {
        setItems(newItems);
    }

    const handleClick = (index) => {
        if(state.current == "Projects") sceneData(index, false);
        else if(state.current == "Scenes") experisData(index, false);
        else if(state.current == "Experiments") runData(index, false);
        else if(state.current == "Runs") predictData(index, false);
    };

    const handleBack = () => {
        if(state.current == "Scenes") projectData(state.prevIndex, true);
        else if(state.current == "Experiments") sceneData(state.prevIndex, true);
        else if(state.current == "Runs") experisData(state.prevIndex, true);
    }

    useEffect(() => {
        run();
    }, []);

    return (
        <>
            <div style={{ display: "block", width: 500 }}>
                <Toolbar modifier="material">
                    <div className="left">
                        <BackButton onClick={() => navigate("/")}>Back</BackButton>
                    </div>
                </Toolbar>
            </div>

            <div className="app-background">
                <div className="main-container">
                    <div className="title-border">
                        <div className="title-container">
                            <button onClick={() => handleBack()}>
                                <FontAwesomeIcon icon={faChevronLeft}/>
                            </button>
                            <div className="title">{state.current}</div>
                        </div>
                    </div>
                    <div className="item-list">
                        {items.map((item, index) => (
                            <div className="item-container" onClick={() => handleClick(index)}>
                                <div className="item-name">{item.name}</div>
                                <div className="quantity">
                                    <button>
                                        <FontAwesomeIcon icon={faChevronRight}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;

