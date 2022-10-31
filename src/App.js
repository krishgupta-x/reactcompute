// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as qs from 'qs';
import axios from "axios";
import "./App.css";
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

function App() {
    const params = useLocation();
    let navigate = useNavigate();

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const [state, setState] = useState({
        current: "",
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
        //runIndex: "",
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
        if(params.state === null) navigate("/");

        state.url = "https://" + params.state.url;
        state.apikey = params.state.apikey
        state.apisecret = params.state.apisecret;
        state.current = params.state.current;

        var token = await getToken();
        if(token == "error") state.current = "Error";
        else {
            state.token = token.trim();
            if(state.current == "Projects") projectData();
            else {
                state.current = params.state.current;
                state.token = params.state.token;
                state.clickIndex = params.state.clickIndex;
                state.project = params.state.project;
                state.projectItems = params.state.projectItems;
                state.scene = params.state.scene;
                state.sceneItems = params.state.sceneItems;
                state.experiment = params.state.experiment;
                state.experimentItems = params.state.experimentItems;
                state.run = params.state.run;
                state.runItems = params.state.runItems;
                state.url = params.state.url;
                state.apikey = params.state.apikey;
                state.apisecret = params.state.apisecret;
                runData()
            }
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

    async function runData(index){
        state.current = "Runs";
        state.experiment = items[index].id;
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
        var current = state.current;
        var token = state.token;
        var clickIndex = state.clickIndex;
        var project = state.project;
        var projectItems = state.projectItems;
        var scene = state.scene;
        var sceneItems = state.sceneItems;
        var experiment = state.experiment;
        var experimentItems = state.experimentItems;
        var run = state.run;
        var runItems = state.runItems;
        var url = state.url;
        var apikey = state.apikey;
        var apisecret = state.apisecret;
        navigate("/detect/run", {
            state: {
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
        else if(state.current == "Experiments") runData(index);
        else if(state.current == "Runs") predictData(index);
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
                            {state.current !== "Projects" &&
                                <button disabled={state.current === "Projects"} onClick={() => handleBack()}>
                                    <FontAwesomeIcon icon={faChevronLeft}/>
                                </button>
                            }
                            {state.current === "Projects" &&
                                <button disabled={state.current === "Projects"} onClick={() => handleBack()}>
                                </button>
                            }

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

