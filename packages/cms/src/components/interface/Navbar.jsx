import React, {Component, Fragment} from "react";
import {connect} from "react-redux";
import {Icon} from "@blueprintjs/core";
import {hot} from "react-hot-loader/root";
import PropTypes from "prop-types";
import varSwapRecursive from "../../utils/varSwapRecursive";

import Dropdown from "./Dropdown";
import Select from "../fields/Select";
import Button from "../fields/Button";

import sectionIconLookup from "../../utils/sectionIconLookup";
import stripHTML from "../../utils/formatters/stripHTML";

import {setStatus} from "../../actions/status";
import {resetPreviews} from "../../actions/profiles";

import "./Navbar.css";
import "./Outline.css";

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navOpen: false,
      outlineOpen: true,
      settingsOpen: false,
      currEntity: null
    };
  }

  handleLocaleSelect(e) {
    const val = e.target.value;
    this.props.setStatus({
      localeSecondary: val === "none" ? null : val
    });
  }

  // manage settings menu visibility
  closeSettings() {
    this.setState({settingsOpen: false});
  }
  toggleSettings() {
    this.setState({settingsOpen: !this.state.settingsOpen});
  }

  // manage nav visibility (used on small screens only)
  toggleNav() {
    this.setState({navOpen: !this.state.navOpen});
  }

  // manage outline visibility
  toggleOutline() {
    this.setState({outlineOpen: !this.state.outlineOpen});
  }

  // find an entity by id in a given tree
  getEntityId(id, tree) {
    const match = tree.find(t => t.id === id);
    return match;
  }

  // create a title by joining dimensions together
  makeTitleFromDimensions(entity) {
    return entity.meta.length
      ? entity.meta.map(m => m.slug).join(" / ")
      : "Unnamed";
  }

  // get the title of the current node, in the correct language
  getNodeTitle(node) {
    const {localeDefault} = this.props.status;
    const localeContent = node.content.find(c => c.locale === localeDefault);

    let title = node.slug || "no title";
    if (localeContent) title = this.formatLabel.bind(this)(localeContent.title);
    return title;
  }

  handleClick(pathObj) {
    const {currentPid, previews} = this.props.status;
    console.log("clickedPid:", pathObj.profile);
    const newPathObj = {...pathObj};
    // If the pids match, don't reset any previews or variables
    if (currentPid === pathObj.profile) {
      console.log("same pids, not changing");
      newPathObj.previews = previews;
      this.props.setStatus({pathObj: newPathObj});
    }
    // If they don't match, update the currentPid and reset the preview
    else {
      // If previews is a string, we are coming in from the URL permalink. Pass it down to the pathobj.
      // todo fix permalinks
      // if (typeof pathObj.previews === "string") newPathObj.previews = pathObj.previews;
      console.log("different pid! setting", pathObj.profile);
      this.props.setStatus({currentPid: pathObj.profile, pathObj: newPathObj});
      this.props.resetPreviews();
    }
  }

  formatLabel(str) {
    const {selectors} = this.props;
    const {query, localeDefault} = this.props.status;
    const variables = this.props.status.variables[localeDefault] || {};
    const formatters = this.context.formatters[localeDefault];
    const {stripHTML} = formatters;
    str = stripHTML(str);
    str = varSwapRecursive({str, selectors}, formatters, variables, query).str;
    return str;
  }

  // TODO: add functionality
  toggleEntitySettings() {
    console.log("TODO: edit entity settings"); // edit profile title & metadata when clicking the profile gear button
  }
  createProfile() {
    console.log("TODO: create profile"); // create a new profile when clicking the button in the profile dropdown
  }
  createSection(id) {
    const {currentTab} = this.props;
    console.log(`TODO: add new ${currentTab} section after section ${id}`); // add a new section by clicking button adjacent to section node
  }
  swapSectionsPosition(id) {
    const {currentTab} = this.props;
    console.log(`TODO: move ${currentTab} section ${id} postion down/right by one`); // reorder two adjacent sections by clicking button adjacent to first section node
  }

  render() {
    const {auth, currentTab, onTabChange, profiles, stories} = this.props;
    const {currentPid, locales, localeDefault, localeSecondary, pathObj} = this.props.status;
    const {outlineOpen, navOpen, settingsOpen} = this.state;

    let currEntity, currTree;
    if (currentTab === "metadata") currEntity = "metadata"; // done

    // get entity title and sections
    if (currentTab === "profiles") {
      currEntity = "profile";
      let currProfile;
      if (currentPid) currProfile = this.getEntityId(currentPid, profiles);
      if (typeof currProfile === "object") {
        // profile title
        currEntity = this.makeTitleFromDimensions(currProfile);
        // sections
        currTree = currProfile.sections;
      }
    }

    // TODO: get entity title and sections for stories
    if (currentTab === "stories") {
      currEntity = "story";
    }

    // genrate list of items to render in nav dropdowns
    const profileNavItems = [], storyNavItems = [];
    if (profiles.length) {
      profiles.map((profile, i) => {
        profileNavItems[i] = {
          // get the profile title, or generate it from dimensions
          title: this.getNodeTitle(profile).toString() !== "New Profile"
            ? this.getNodeTitle(profile)
            : this.makeTitleFromDimensions(profile),
          onClick: this.handleClick.bind(this, {profile: profile.id}),
          selected: currentTab === "profiles" && currentPid === profile.id
        };
      });
    }
    if (!profileNavItems.find(p => p.title === "Create new profile")) {
      profileNavItems.push({
        title: "Create new profile",
        icon: "plus",
        onClick: () => this.createProfile()
      });
    }

    // TODO: generate list of nav items for stories
    // if (stories.length) {
    //  stories.map((story, i)) => etc
    // }

    // generate dropdowns for switching entities
    const navLinks = [
      {
        title: "Profiles",
        items: profileNavItems,
        selected: currentTab === "profiles" ? true : false,
        dropdown: true
      },
      {
        title: "Stories",
        items: storyNavItems, // TODO
        selected: currentTab === "stories" ? true : false,
        dropdown: true
      },
      {title: "Metadata"}
    ];

    const showLocales = locales;
    const showAccount = auth.user;
    const settingsAvailable = showLocales || showAccount;

    const hasClicked = pathObj.profile || pathObj.story;

    return (
      <nav className={`cms-navbar${settingsOpen ? " settings-visible" : ""}`}>
        {/* main (top) top navbar */}
        <div className="cms-navbar-inner">
          {/* title */}
          <div className={`cms-navbar-title ${hasClicked ? "with-node" : "without-node" }${!outlineOpen ? " outline-open" : ""}`}>
            {currEntity === "metadata" || !hasClicked
              // metadata; render as h1 with no controls
              ? <h1 className="cms-navbar-title-heading u-font-lg">
                {currEntity === "metadata" ? "Metadata editor" : `Choose a ${currEntity}`}
              </h1>
              // profile/story; render as button to collapse outline
              : <Fragment>
                <button
                  className="cms-navbar-title-button heading u-font-lg"
                  onClick={() => this.toggleOutline()}
                  aria-pressed={outlineOpen}
                >
                  <Icon className="cms-navbar-title-button-icon" icon="caret-down" />
                  <span className="cms-navbar-title-button-text">
                    {currEntity}{currentTab === "profiles" ? " profile" : ""}
                  </span>
                </button>
                <button className="cms-navbar-entity-settings-button" onClick={() => this.toggleEntitySettings(currEntity)}>
                  <span className="u-visually-hidden">edit {currEntity} metadata</span>
                  <Icon className="cms-navbar-entity-settings-button-icon" icon="cog" />
                </button>
              </Fragment>
            }
          </div>

          {/* button for toggling visibility of the list of links on small screens */}
          <Button
            className="cms-navbar-list-toggle-button u-hide-above-sm"
            onClick={() => this.toggleNav()}
            namespace="cms"
            icon={navOpen ? "cross" : "menu"}
            fontSize="xs"
          >
            menu
          </Button>
          {/* list of links */}
          <ul className={`cms-navbar-list ${navOpen ? "is-open" : "is-closed"}`}>
            {navLinks.map((navLink, i) =>
              navLink.dropdown && Array.isArray(navLink.items) && navLink.items.length
                // render a dropdown
                ? <Dropdown
                  title={navLink.title}
                  items={navLink.items}
                  selected={navLink.selected}
                />
                // render a single link
                : <li className="cms-navbar-item" key={navLink.title}>
                  <button
                    className={`cms-navbar-link${navLink.title.toLowerCase() === currentTab ? " is-selected" : ""}`}
                    onClick={() => onTabChange(navLink.title.toLowerCase())}
                    onFocus={() => settingsAvailable && settingsOpen && i === navLinks.length - 1 ? this.closeSettings() : null}
                  >
                    {navLink.title}
                  </button>
                </li>
            )}
          </ul>

          {/* settings menu & overlay */}
          {settingsAvailable
            ? <div className="cms-navbar-settings-wrapper">
              <div className="cms-navbar-settings-button-container">
                <Button
                  className="cms-navbar-settings-button"
                  id="cms-navbar-settings-button"
                  namespace="cms"
                  icon="cog"
                  fontSize="xs"
                  active={settingsOpen}
                  onClick={() => this.toggleSettings()}
                  aria-label={settingsOpen ? "View settings menu" : "Hide settings menu"}
                >
                  settings
                </Button>
              </div>

              <div className={`cms-navbar-settings ${settingsOpen ? "is-visible" : "is-hidden"}`}>
                {/* locale select */}
                {showLocales && <Fragment>
                  <h2 className="cms-navbar-settings-heading u-font-sm">
                    Languages
                  </h2>
                  {/* primary locale */}
                  {/* NOTE: currently just shows the primary locale in a dropdown */}
                  <Select
                    label="Primary"
                    fontSize="xs"
                    namespace="cms"
                    inline
                    options={[localeDefault]}
                    tabIndex={settingsOpen ? null : "-1"}
                  />
                  {/* secondary locale */}
                  <Select
                    label="Secondary"
                    fontSize="xs"
                    namespace="cms"
                    inline
                    value={localeSecondary ? localeSecondary : "none"}
                    onChange={e => this.handleLocaleSelect(e)}
                    tabIndex={settingsOpen ? null : "-1"}
                  >
                    <option value="none">none</option>
                    {locales.map(locale =>
                      <option value={locale} key={locale}>{locale}</option>
                    )}
                  </Select>
                </Fragment>}

                {showAccount && <Fragment>
                  <h2 className="cms-navbar-settings-heading u-font-sm u-margin-top-md">
                    Account
                  </h2>
                  <a className="cms-button cms-fill-button u-margin-bottom-xs" href="/auth/logout">
                    <Icon className="cms-button-icon" icon="log-out" />
                    <span className="cms-button-text">Log Out</span>
                  </a>
                </Fragment>}
              </div>
              <button
                className={`cms-navbar-settings-overlay ${settingsOpen ? "is-visible" : "is-hidden"}`}
                onClick={() => this.toggleSettings()}
                onFocus={() => this.closeSettings()}
                aria-labelledby="cms-navbar-settings-button"
                tabIndex={settingsOpen ? null : "-1"}
              />
            </div> : ""
          }
        </div>

        {/* outline */}
        {currTree &&
          <ul className={`cms-outline ${outlineOpen ? "is-open" : "is-closed"}`}>
            {currTree.map(node =>
              <li className="cms-outline-item" key={node.id}>
                <a
                  className={`cms-outline-link${
                    pathObj.section && pathObj.section === node.id
                      ? " is-selected" // current node
                      : ""
                  }`}
                  onClick={() => this.handleClick.bind(this)({profile: node.profile_id, section: node.id})}
                >
                  <Icon className="cms-outline-link-icon" icon={sectionIconLookup(node.type, node.position)} />
                  {this.getNodeTitle(node)}
                </a>

                {/* add section / swap section position buttons */}
                <div className="cms-outline-item-actions cms-button">
                  {/* add section */}
                  <Button
                    onClick={() => this.createSection(node.id)}
                    className="cms-outline-item-actions-button"
                    namespace="cms"
                    fontSize="xxs"
                    icon="plus"
                    iconOnly
                    key={`${node.id}-add-button`}
                  >
                    Add new section
                  </Button>
                  {/* swap section positions */}
                  <Button
                    onClick={() => this.swapSections(node.id)}
                    className="cms-outline-item-actions-button"
                    namespace="cms"
                    fontSize="xxs"
                    icon="swap-horizontal"
                    iconOnly
                    key={`${node.id}-swap-button`}
                  >
                    Swap positioning of current and next sections
                  </Button>
                </div>
              </li>
            )}
          </ul>
        }
      </nav>
    );
  }
}

Navbar.contextTypes = {
  formatters: PropTypes.object
};

const mapStateToProps = state => ({
  auth: state.auth,
  status: state.cms.status,
  profiles: state.cms.profiles,
  selectors: state.cms.status.currentPid ? state.cms.profiles.find(p => p.id === state.cms.status.currentPid).selectors : [],
  stories: state.cms.stories
});

const mapDispatchToProps = dispatch => ({
  setStatus: status => dispatch(setStatus(status)),
  resetPreviews: () => dispatch(resetPreviews())
});

export default connect(mapStateToProps, mapDispatchToProps)(hot(Navbar));