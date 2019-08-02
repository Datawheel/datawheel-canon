import React, {Component} from "react";
import {LoginForm} from "./LoginForm";
import {SignupForm} from "./SignupForm";
import "./AuthForm.css";

export default class AuthForm extends Component {
  constructor() {
    super();
    this.state = {
      mode: "login"
    };
  }

  toggleMode(currentMode) {
    this.setState({
      mode: currentMode === "login" ? "signup" : "login"
    });
  }

  render() {
    const {mode} = this.state;

    let modeTitle = "Log in";
    let modeSwitchPrompt = "Don't have an account yet? ";
    let modeSwitchLink = "Sign up";

    if (mode === "signup") {
      modeTitle = "Sign up";
      modeSwitchPrompt = "Already have an account? ";
      modeSwitchLink = "Log in";
    }

    return (
      <div className="cms cms-auth-page">
        <div className="cms-auth-form">
          <div className="cms-auth-form-inner">
            <h1 className="cms-auth-form-title">{modeTitle}</h1>

            {mode === "login" ? <LoginForm /> : <SignupForm />}

            <p className="cms-auth-form-paragraph u-font-xs u-margin-top-md u-margin-bottom-off">
              {modeSwitchPrompt}
              <button className="cms-auth-form-switcher" onClick={() => this.toggleMode(mode)}>
                {modeSwitchLink}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
}