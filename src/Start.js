import React, { useState } from "react";
import "./Start.css";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "./components/FormInput";

function Start() {
	const [state, setState] = useState({
		apikey: "63d6501b-73f6-4407-a962-8bc71069e365",
		apisecret: "ff5c2713-37d9-42fa-8590-fd5cea8c2038",
		url: "alto",
		error: "",
		source: "prodservers"
	});

	let navigate = useNavigate();

	function handleContinue() {
		var apikey = state.apikey, apisecret = state.apisecret, url = state.url, current = "Projects";
		if(state.source === "qaservers") url = qatext[url];
		else url = productiontext[url];
		if (state.apikey !== "" && state.apisecret !== "") {
			navigate("/detect", {
				state: {
					url,
					apikey,
					apisecret,
					current
				},
			});
		}
		else {
			var error = "Field(s) are blank.";
			setState({
				...state,
				"error": error
			});
		}
	}

	const inputs = [
		{
			id: 1,
			name: "apikey",
			type: "text",
			placeholder: "API key",
			label: "API key",
			required: true,
			errorMessage: "Please enter a valid API key."
		},
		{
			id: 2,
			name: "apisecret",
			type: "text",
			placeholder: "API secret",
			label: "API secret",
			required: true,
			errorMessage: "Please enter a valid API secret."
		},
	];

	const handleURL = (e) => {
		const value = e.target.value;
		setState({
			...state,
			[e.target.name]: value,
		});
	}

	const handleSource = (e) => {
		const value = e.target.value;
		state.url = "alto";
		setState({
			...state,
			[e.target.name]: value,
		});
	}

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	const onChange = (e) => {
		setState({...state, [e.target.name]: e.target.value });
	};

	const qatext = {
		"demo": "gateway-demo.qa.alto-platform.ai",
		"qa1": "gateway-qa-1.qa.alto-platform.ai",
		"qa2": "gateway-qa-2.qa.alto-platform.ai",
		"qa3": "gateway-qa-3.qa.alto-platform.ai",
		"e2e": "gateway-e2e.qa.alto-platform.ai",
		"democa": "gateway-demo.ca.qa.alto-platform.ai",
		"demoeu": "gateway-demo.eu.qa.alto-platform.ai",
	};

	const productiontext = {
		"alto": "app.ai.carear.app",
		"ca": "app.ca.alto-platform.ai",
		"eu": "app.eu.alto-platform.ai",
	};

	return (
		<div className="App">
			<form onSubmit={handleSubmit}>
				<h1>CareAR Demo</h1>
				<label>
					Choose URL Source
					<br></br>
					<select
						name="source"
						value={state.source}
						onChange={handleSource}
					>
						<option value="qaservers">QA servers</option>
						<option value="prodservers">Production servers</option>
					</select>
				</label>

				<label>
					<br></br>
					URL
					<br></br>
					<select
						name="url"
						value={state.url}
						onChange={handleURL}
					>
						{state.source === "qaservers" ? (
							Object.keys(qatext).map((typeId, index) => (
								<option key={index} value={typeId}>{qatext[typeId]}</option>
							)))
							:
							(Object.keys(productiontext).map((typeId, index) => (
								<option key={index} value={typeId}>{productiontext[typeId]}</option>
							)))
						}
					</select>
				</label>

				{inputs.map((input) => (
					<FormInput
						key={input.id}
						{...input}
						value={state[input.name]}
						onChange={onChange}
					/>
				))}
				<p style= {{
					color: "red",
				}}>{state.error}</p>
				<button className="button" type="button" onClick={handleContinue}>Continue</button>
			</form>
		</div>

	);
}

export default Start;