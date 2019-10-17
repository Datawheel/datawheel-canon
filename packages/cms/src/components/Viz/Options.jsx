import React, {Component} from "react";
import {hot} from "react-hot-loader/root";
import {withNamespaces} from "react-i18next";
import {connect} from "react-redux";
import {animateScroll} from "react-scroll";
import ReactTable from "react-table";
import PropTypes from "prop-types";
import "./Table.css";
import "./Options.css";

import {Checkbox, Dialog, Icon, Label, NonIdealState, Spinner, Tab, Tabs} from "@blueprintjs/core";

import {max, sum} from "d3-array";
import {event, select} from "d3-selection";
import {uuid} from "d3plus-common";
import {saveAs} from "file-saver";
import JSZip from "jszip";
import axios from "axios";
import {saveElement} from "d3plus-export";
import {strip} from "d3plus-text";

import Button from "../fields/Button";
import ButtonGroup from "../fields/ButtonGroup";

import ShareDirectLink from "./ShareDirectLink";
import ShareFacebookLink from "./ShareFacebookLink";
import ShareTwitterLink from "./ShareTwitterLink";

const measureText = str => sum(`${str}`.split("")
  .map(c => ["I", "i", "l", "."].includes(c) ? 4 : 9));

const filename = str => strip(str.replace(/<[^>]+>/g, ""))
  .replace(/^\-/g, "")
  .replace(/\-$/g, "");

const getBackground = elem => {

  // Is current element's background color set?
  const color = select(elem).style("background-color");
  if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") return color;

  // if not: are you at the body element?
  if (elem === document.body) return "white";
  else return getBackground(elem.parentNode);

};

class Options extends Component {

  constructor(props) {
    super(props);
    this.state = {
      backgroundColor: true,
      id: uuid(),
      imageContext: "viz",
      imageFormat: "png",
      imageProcessing: false,
      includeSlug: true,
      loading: false,
      dialogOpen: false,
      focusOptions: false, // make button group focusable, but only when closing the dialog
      results: props.data instanceof Array ? props.data : false
    };
    this.toggleButton = React.createRef();
    this.dialog = React.createRef();
  }

  componentDidUpdate(prevProps) {
    const {data} = this.props;
    if (prevProps.data !== data) {
      this.setState({results: data instanceof Array ? data : false});
    }
  }

  listenForBlur() {
    select(document).on("keydown", () =>
      setTimeout(() => {
        if (this.state.dialogOpen) {
          if (document.activeElement.matches(".cp-section-heading") || document.activeElement.matches(".options-button")) {
            this.setState({dialogOpen: false});
          }
        }
      }, 20)
    );
  }

  onCSV() {
    const {title} = this.props;
    const {results} = this.state;

    const colDelim = ",";
    const rowDelim = "\r\n";

    const columns = Object.keys(results[0]);
    let csv = columns.map(val => `\"${val}\"`).join(colDelim);

    for (let i = 0; i < results.length; i++) {
      const data = results[i];

      csv += rowDelim;
      csv += columns.map(key => {

        const val = data[key];

        return typeof val === "number" ? val
          : val ? `\"${val}\"` : "";

      }).join(colDelim);
    }

    const zip = new JSZip();
    zip.file(`${filename(title)}.csv`, csv);
    zip.generateAsync({type: "blob"})
      .then(content => saveAs(content, `${filename(title)}.zip`));
  }

  onSave() {
    const {title} = this.props;
    const {imageFormat} = this.state;
    this.setState({imageProcessing: true});

    let node = this.getNode();
    if (node) {
      const {backgroundColor} = this.state;
      if (imageFormat === "svg") node = select(node).select(".d3plus-viz").node();
      let background;
      if (backgroundColor) background = getBackground(node);
      saveElement(node,
        {filename: filename(title), imageFormat},
        {background, callback: () => this.setState({imageProcessing: false})}
      );
    }
    else {
      this.setState({imageProcessing: false});
    }
  }

  getNode() {
    const {component} = this.props;
    const {imageContext} = this.state;
    if (component[imageContext][imageContext]) {
      const elem = component[imageContext][imageContext];
      return elem.nodeType ? elem : elem.container || elem._reactInternalInstance._renderedComponent._hostNode;
    }
    else return false;
  }

  toggleDialog(slug) {
    const {dialogOpen} = this.state;
    const {transitionDuration} = this.props;

    if (slug && !dialogOpen) {

      setTimeout(() => {
        // IE is the wurst with CSSTransitionGroup
        document.getElementsByClassName("options-dialog")[0].style.opacity = 1;
        // give focus to the correct tab
        document.getElementById(`bp3-tab-title_undefined_${slug}`).focus();
      }, transitionDuration + 200);
    }

    // give focus back to the original button
    else if (!slug) {
      this.setState({focusOptions: true});
      setTimeout(() => {
        this.toggleButton.current.focus();
      }, transitionDuration + 10);
    }

    const node = this.getNode.bind(this)();

    if (node && !dialogOpen) {
      const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
      if (node.offsetTop < scrollTop) animateScroll.scrollTo(node.offsetTop);
    }

    this.setState({dialogOpen: slug});
    this.listenForBlur();
    const {results, loading} = this.state;

    if (slug === "view-table" && !results && !loading) {
      const {data, dataFormat} = this.props;
      this.setState({loading: true});
      axios.get(data)
        .then(resp => {
          const results = dataFormat(resp.data);
          this.setState({loading: false, results});
        });
    }
  }

  toggleBackground() {
    this.setState({backgroundColor: !this.state.backgroundColor});
  }

  toggleContext() {
    const {imageContext} = this.state;
    this.setState({imageContext: imageContext === "section" ? "viz" : "section"});
  }

  // add the slug, or not
  handleSectionCheck() {
    this.setState({includeSlug: !this.state.includeSlug});
  }

  columnWidths(key) {
    const {results} = this.state;
    const data = Array.from(new Set(results.map(d => d[key])))
      .filter(Boolean)
      .map(measureText);
    return max([measureText(key)].concat(data)) + 25;
  }

  renderColumn = col => Object.assign({}, {
    Header: <button className="cp-table-header-button">
      {col} <span className="u-visually-hidden">, sort by column</span>
      <Icon className="cp-table-header-icon" icon="caret-down" />
    </button>,
    id: col,
    accessor: d => d[col],
    Cell: cell => <span className="cp-table-cell-inner" dangerouslySetInnerHTML={{__html: cell.value}} />,
    minWidth: this.columnWidths.bind(this)(col)
  });

  render() {
    const {backgroundColor, imageContext, imageFormat, imageProcessing, includeSlug, dialogOpen, results, focusOptions} = this.state;
    const {data, iconOnly, slug, t, transitionDuration} = this.props;

    // construct URL from a combination of redux & context (#537)
    const domain = this.props.location.origin;
    const path = this.context.router.location.pathname;
    const shareURL = `${domain}/${path}`;

    const node = this.getNode();
    const svgAvailable = node && select(node).select(".d3plus-viz").size() > 0;

    const columns = results ? Object.keys(results[0]).filter(d => d.indexOf("ID ") === -1 && d.indexOf("Slug ") === -1) : [];

    const dataUrl = typeof data === "string"
      ? data.indexOf("http") === 0 ? data : `${ domain }${ data }`
      : false;

    const DataPanel = () => results
      ? <div className="bp3-dialog-body view-table">

        <div className="horizontal download">
          <Button key="data-download" icon="download" fontSize="xxs" onClick={this.onCSV.bind(this)}>
            {t("CMS.Options.Download as CSV")}
          </Button>

          { dataUrl && 
            <input key="data-url" type="text" ref={input => this.dataLink = input} readOnly="readonly" value={dataUrl} />
          }
        </div>

        <div className="table">
          <ReactTable
            data={results}
            defaultPageSize={results.length}
            columns={columns.map(col => this.renderColumn(col))}
            minRows="0"
            minWidth="300"
            showPagination={false}
            resizable={false}
          />
        </div>
      </div>
      : <div className="bp3-dialog-body view-table">
        <NonIdealState title={t("CMS.Options.Loading Data")} visual={<Spinner />} />
      </div>;

    const shareLink = `${ shareURL }${ includeSlug && slug ? `#${slug}` : "" }`;

    const SharePanel = () =>
      <div className="bp3-dialog-body share-dialog">

        {/* direct link */}
        <ShareDirectLink link={shareLink} />

        {/* to slug or not to slug */}
        <Checkbox
          className="u-font-xs"
          checked={this.state.includeSlug}
          label={t("CMS.Options.Scroll to section")}
          onChange={this.handleSectionCheck.bind(this)}
        />

        {/* direct link */}
        <Label>
          <span className="u-font-xs options-label-text">{t("CMS.Options.Social")}</span>
          <ButtonGroup fill={true}>
            <ShareFacebookLink link={shareLink} />
            <ShareTwitterLink link={shareLink} />
          </ButtonGroup>
        </Label>
      </div>;

    return <div
      className="Options"
      tabIndex={focusOptions ? 0 : null}
      aria-label="visualization options"
      ref={this.toggleButton}
    >
      <ButtonGroup className="options-button-group">
        <Button className="options-button" icon="th" key="view-table-button" iconOnly={iconOnly} fontSize="xxxs" iconPosition="left" id={`options-button-${slug}-view-table`} onClick={this.toggleDialog.bind(this, "view-table")}>
          {t("CMS.Options.View Data")}
        </Button>

        <Button className="options-button" icon="media" key="save-image-button" iconOnly={iconOnly} fontSize="xxxs" iconPosition="left" id={`options-button-${slug}-save-image`} onClick={this.toggleDialog.bind(this, "save-image")}>
          {t("CMS.Options.Save Image")}
        </Button>

        <Button className="options-button" icon="share" key="share-button" iconOnly={iconOnly} fontSize="xxxs" iconPosition="left" id={`options-button-${slug}-share`} onClick={this.toggleDialog.bind(this, "share")}>
          {t("CMS.Options.Share")}
        </Button>
      </ButtonGroup>

      <Dialog className="options-dialog"
        autoFocus={false}
        enforceFocus={false}
        usePortal={true}
        isOpen={dialogOpen}
        onClose={this.toggleDialog.bind(this, false)}
        transitionDuration={transitionDuration}
        ref={this.dialog}
      >
        <h2 className="u-visually-hidden">Visualization options</h2>
        <Tabs onChange={this.toggleDialog.bind(this)} selectedTabId={dialogOpen}>
          <Tab id="view-table" title={t("CMS.Options.View Data")} panel={<DataPanel />} />
          <Tab id="save-image" title={t("CMS.Options.Save Image")} panel={
            <div className="bp3-dialog-body save-image">

              <div className="save-image-button-group-wrapper">
                <h3 className="save-image-button-group-label label u-font-xs">Image format</h3>
                <ButtonGroup className="save-image-button-group">
                  <Button
                    className="save-image-format-button"
                    fontSize="xs"
                    icon="media"
                    iconPosition="left"
                    onClick={() => this.setState({imageFormat: "png"})}
                    active={imageFormat === "png"}
                  >
                    <span className="u-visually-hidden">Save visualization as </span>PNG
                  </Button>
                  {svgAvailable &&
                    <Button
                      className="save-image-format-button"
                      fontSize="xs"
                      icon="code-block"
                      iconPosition="left"
                      onClick={() => this.setState({imageFormat: "svg"})}
                      active={imageFormat === "svg"}
                    >
                      <span className="u-visually-hidden">Save visualization as </span>SVG
                    </Button>
                  }
                </ButtonGroup>
              </div>

              <div className="save-image-button-group-wrapper">
                <h3 className="save-image-button-group-label label u-font-xs">Image area</h3>
                <ButtonGroup className="save-image-button-group">
                  <Button
                    className="save-image-format-button"
                    fontSize="xs"
                    icon="timeline-line-chart"
                    iconPosition="left"
                    onClick={() => this.setState({imageContext: "viz"})}
                    active={imageContext === "viz"}
                  >
                    visualization only
                  </Button>
                  <Button
                    className="save-image-format-button"
                    fontSize="xs"
                    icon="vertical-distribution"
                    iconPosition="left"
                    onClick={() => this.setState({imageContext: "section"})}
                    active={imageContext === "section"}
                  >
                    entire section
                  </Button>
                </ButtonGroup>
              </div>

              <Checkbox checked={!backgroundColor} label={t("CMS.Options.Transparent Background")} onChange={this.toggleBackground.bind(this)} className="u-font-xs" />

              <Button
                className="save-image-download-button"
                onClick={() => this.onSave()}
                rebuilding={imageProcessing}
                disabled={imageProcessing}
                icon={imageProcessing ? "cog" : "download"}
                fontSize="md"
                fill
              >
                {imageProcessing ? "Processing image" : "Download image"}
              </Button>
            </div>
          } />
          <Tab id="share" title={t("CMS.Options.Share")} panel={<SharePanel />} />
          <Button icon="small-cross" iconOnly className="close-button bp3-dialog-close-button bp3-minimal" onClick={this.toggleDialog.bind(this, false)}>
            Close
          </Button>
        </Tabs>
      </Dialog>
    </div>;
  }
}

Options.defaultProps = {
  transitionDuration: 100,
  iconOnly: false
};
Options.contextTypes = {
  router: PropTypes.object
};

export default withNamespaces()(connect(state => ({
  location: state.location
}))(hot(Options)));
