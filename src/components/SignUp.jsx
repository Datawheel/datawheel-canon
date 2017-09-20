import React, {Component} from "react";
import {connect} from "react-redux";
import {signup} from "../actions/auth";
import {translate} from "react-i18next";
import {Intent, Toaster} from "@blueprintjs/core";

import facebookIcon from "../images/facebook-logo.svg";
import twitterIcon from "../images/twitter-logo.svg";
import instagramIcon from "../images/instagram-logo.svg";
import {SIGNUP_EXISTS} from "../consts";

import "./Forms.css";

class SignUp extends Component {

  constructor(props) {
    super(props);
    this.state = {
      agreedToTerms: false,
      error: null,
      password: "",
      passwordAgain: "",
      email: null,
      submitted: false,
      toast: typeof window !== "undefined" ? Toaster.create() : null
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const val = e.target.name === "agreedToTerms" ? e.target.checked : e.target.value;
    this.setState({[e.target.name]: val});
  }

  onSubmit(e) {
    e.preventDefault();
    const {t} = this.props;
    const {agreedToTerms, email, password, passwordAgain, username} = this.state;

    if (password !== passwordAgain) {
      this.setState({error: {iconName: "lock", message: t("SignUp.error.PasswordMatch")}});
    }
    else if (!username || !email || !password) {
      this.setState({error: {iconName: "id-number", message: t("SignUp.error.IncompleteFields")}});
    }
    else if (!agreedToTerms) {
      this.setState({error: {iconName: "saved", message: t("SignUp.error.TermsAgree")}});
    }
    else {
      this.props.signup({username, email, password});
      this.setState({submitted: true});
    }

  }

  componentDidUpdate() {
    const {auth, t} = this.props;
    const {error, submitted} = this.state;

    if (submitted && !auth.loading) {
      if (auth.error === SIGNUP_EXISTS) {
        this.showToast(t("SignUp.error.Exists"), "blocked-person", Intent.WARNING);
        this.setState({submitted: false});
      }
      else if (!auth.error) {
        this.showToast(t("SignUp.success"), "endorsed", Intent.SUCCESS);
      }
    }
    else if (error) {
      this.showToast(error.message, error.iconName, error.intent);
      this.setState({error: false});
    }

  }

  showToast(message, iconName = "lock", intent = Intent.DANGER) {
    const {toast} = this.state;
    toast.show({iconName, intent, message});
  }

  render() {
    const {auth, social, t} = this.props;
    const {agreedToTerms} = this.state;
    const email = this.state.email === null ? auth.error && auth.error.email ? auth.error.email : "" : this.state.email;

    return (
      <div>
        <form id="signup" ref="emailForm" onSubmit={this.onSubmit.bind(this)} className="login-container">
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-envelope"></span>
            <input className="pt-input" placeholder={ t("SignUp.E-mail") } value={email} type="email" name="email" ref="email" onChange={this.onChange} tabIndex="1" />
          </div>
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-user"></span>
            <input className="pt-input" placeholder={ t("SignUp.Username") } value={this.state.username} type="text" name="username" onFocus={this.onChange} onChange={this.onChange} tabIndex="2" />
          </div>
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-lock"></span>
            <input className="pt-input" placeholder={ t("SignUp.Password") } value={this.state.password} type="password" name="password" onFocus={this.onChange} onChange={this.onChange} autoComplete="Off" tabIndex="3" />
          </div>
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-lock"></span>
            <input className="pt-input" placeholder={ t("SignUp.Confirm Password") } value={this.state.passwordAgain} type="password" name="passwordAgain" onFocus={this.onChange} onChange={this.onChange} autoComplete="Off" tabIndex="4" />
          </div>
          <label className="pt-control pt-checkbox" htmlFor="ppcbox" ref="agreedToTerms">
            <input type="checkbox" id="ppcbox" name="agreedToTerms" checked={agreedToTerms} onChange={this.onChange} />
            <span className="pt-control-indicator"></span>
            { t("SignUp.PolicyText") }
          </label>
          <button type="submit" className="pt-button pt-fill" tabIndex="5">{ t("SignUp.Sign Up") }</button>
        </form>
        { social.length
          ? <div id="socials">
            { social.includes("facebook") ? <a href="/auth/facebook" className="pt-button facebook"><img className="icon" src={facebookIcon} /><span>{ t("SignUp.Facebook") }</span></a> : null }
            { social.includes("twitter") ? <a href="/auth/twitter" className="pt-button twitter"><img className="icon" src={twitterIcon} /><span>{ t("SignUp.Twitter") }</span></a> : null }
            { social.includes("instagram") ? <a href="/auth/instagram" className="pt-button instagram"><img className="icon" src={instagramIcon} /><span>{ t("SignUp.Instagram") }</span></a> : null }
          </div>
          : null }
      </div>
    );

  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  social: state.social
});

const mapDispatchToProps = dispatch => ({
  signup: userData => {
    dispatch(signup(userData));
  }
});

SignUp = connect(mapStateToProps, mapDispatchToProps)(SignUp);
SignUp = translate()(SignUp);
export {SignUp};
