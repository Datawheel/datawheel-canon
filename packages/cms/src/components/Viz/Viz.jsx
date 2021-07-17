import React, {Component} from "react";
import PropTypes from "prop-types";
import * as d3plus from "d3plus-react";
import {SizeMe} from "react-sizeme";

import Graphic from "./Graphic";
import HTML from "./HTML";
import Table from "./Table";
import Options from "./Options";
import toKebabCase from "../../utils/formatters/toKebabCase";
import propify from "../../utils/d3plusPropify";
import Parse from "../sections/components/Parse";
import "./Viz.css";
import defaultConfig from "./defaultConfig";

// User must define custom sections in app/cms/sections, and export them from an index.js in that folder.
import * as CustomVizzes from "CustomVizzes";

const vizTypes = {Table, Graphic, HTML, ...d3plus, ...CustomVizzes};

class Viz extends Component {
  constructor() {
    super();
    this.state = {
      isFullscreen: false
    };
  }

  getChildContext() {
    const context = {...this.context};
    context.d3plus = {...defaultConfig, ...context.d3plus};
    return context;
  }

  analyzeData(resp) {
    const {updateSource} = this.context;
    if (updateSource) {
      if (resp.source) {
        updateSource(resp.source);
      }
      else if (Array.isArray(resp)) {
        updateSource(resp.reduce((acc, d) => d.source && Array.isArray(d.source) ? acc.concat(d.source) : acc, []));
      }
    }
  }

  render() {
    const {
      config,
      configOverride,
      className,
      debug,
      headingLevel,
      hideOptions,
      namespace,
      slug,
      section,
      sectionTitle,
      showTitle
    } = this.props;
    const {isFullscreen} = this.state;

    // Variables come from props in the CMS, and Context in the Front-end.
    const variables = this.props.variables || this.context.variables;
    // onSetVariables will either come from ProfileBuilder (CMS) or Profile (Front-end)
    // But either way, it is delivered via context. Have a backup no-op just in case.
    const onSetVariables = this.context.onSetVariables ? this.context.onSetVariables : d => d;
    // Window opening is only supported on front-end profiles. If they didn't
    // come through context, then this Viz is in the CMS, so just replace it with a no-op.
    const onOpenModal = this.context.onOpenModal ? this.context.onOpenModal : d => d;
    const locale = this.props.locale || this.context.locale;

    // This Viz component may be embedded in two ways - as a VisualizationCard in the
    // CMS, or as an actual Viz on a front-end site. In the former case, formatters
    // is a lookup object of languages, so we must fetch the appropriate formatter set.
    // In the latter, the locale is passed in based on params and then used in propify.
    // Thus, we use a flat formatter list, passed down by Profile.jsx, not needing a
    // locale-nested format.
    const formatters = this.context.formatters[locale] || this.context.formatters;

    const {id} = config;

    // clone config object to allow manipulation
    const actions = {onSetVariables, onOpenModal};
    const vizProps = propify(config.logic, formatters, variables, locale, id, actions);

    // If the result of propify has an "error" property, then the provided javascript was malformed and propify
    // caught an error. Instead of attempting to render the viz, simply show the error to the user.
    // If "debug" is set to true, this viz is being rendered in the CMS, and we can show the stacktrace directly.
    if (vizProps.error && debug) return <div>{`Error in Viz index: ${vizProps.error}`}</div>;
    // Note that if vizProps.error exists but debug is NOT true, we should still keep rendering, because propify
    // gave us a "stub" config with a user-friendly error message built in, so the front-end can see it.
    vizProps.config = Object.assign(vizProps.config, configOverride);

    if (debug) vizProps.config.duration = 0;

    // strip out the "type" from config
    const {type} = vizProps.config;
    delete vizProps.config.type;
    if (!type) return null;
    const Visualization = vizTypes[type];
    if (!Visualization) {
      return <div>{`${type} is not a valid Visualization Type`}</div>;
    }

    const title = vizProps.config.title;
    delete vizProps.config.title;

    const vizConfig = Object.assign({}, {locale}, vizProps.config);

    if (this.context.print) vizConfig.detectVisible = false;

    // whether to show the title and/or visualization options
    const showHeader = (title && showTitle || !hideOptions && !this.context.print) && type !== "Graphic" && type !== "HTML";

    return <SizeMe render={({size}) =>
      <div
        className={`${namespace}-viz-container${
          className ? ` ${className}` : ""
        }${
          type ? ` ${namespace}-${toKebabCase(type)}-viz-container` : ""
        }${
          isFullscreen ? " is-fullscreen" : ""
        }`}
        ref={ comp => this.viz = comp }
      >
        {showHeader &&
          <div className={`${namespace}-viz-header`}>
            {title && showTitle
              ? <Parse El={headingLevel} className={`${namespace}-viz-title u-margin-top-off u-margin-bottom-off u-font-xs`}>
                {title}
              </Parse> : ""
            }
            {!hideOptions && !vizProps.error
              ? <Options
                key="option-key"
                component={{section, viz: this}}
                dataAttachments={vizConfig.dataAttachments}
                data={vizConfig.data}
                dataFormat={vizProps.dataFormat}
                slug={slug }
                title={title || sectionTitle || slug}
                iconOnly={size && size.width < 320 ? true : false}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => this.setState({isFullscreen: !isFullscreen})}
              /> : ""
            }
          </div>
        }
        <div className={`${namespace}-viz-figure${vizConfig.height || type === "Graphic" ? " with-explicit-height" : ""}`}>
          <Visualization
            key="viz-key"
            className={`d3plus ${namespace}-viz ${namespace}-${toKebabCase(type)}-viz`}
            dataFormat={resp => {
              const hasMultiples = vizProps.data && Array.isArray(vizProps.data) && vizProps.data.length > 1 && vizProps.data.some(d => typeof d === "string");
              const sources = hasMultiples ? resp : [resp];
              sources.forEach(r => this.analyzeData.bind(this)(r));
              let data;
              try {
                data = vizProps.dataFormat(resp);
              }
              catch (e) {
                console.log("Error in dataFormat: ", e);
                data = [];
              }
              return data;
            }}
            linksFormat={vizProps.linksFormat}
            nodesFormat={vizProps.nodesFormat}
            topojsonFormat={vizProps.topojsonFormat}
            config={{...vizConfig, variables}}
          />
        </div>
      </div>
    } />;
  }
}

Viz.childContextTypes = {
  d3plus: PropTypes.object,
  formatters: PropTypes.object,
  locale: PropTypes.string,
  // Though onSetVariables, onOpenModal, and print aren't explicitly passed down,
  // they are required to be here because of the object spread in getChildContext.
  onSetVariables: PropTypes.func,
  onOpenModal: PropTypes.func,
  print: PropTypes.bool,
  updateSource: PropTypes.func,
  variables: PropTypes.object
};

Viz.contextTypes = {
  print: PropTypes.bool,
  d3plus: PropTypes.object,
  formatters: PropTypes.object,
  locale: PropTypes.string,
  onSetVariables: PropTypes.func,
  onOpenModal: PropTypes.func,
  updateSource: PropTypes.func,
  variables: PropTypes.object
};

Viz.defaultProps = {
  className: "",
  config: {},
  configOverride: {},
  namespace: "cp",
  showTitle: true,
  headingLevel: "h3"
};

export default Viz;
