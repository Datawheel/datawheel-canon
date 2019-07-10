import React, {Component} from "react";
// import {AnchorLink} from "@datawheel/canon-core";
import {nest} from "d3-collection";
import stripP from "../../utils/formatters/stripP";

import StatGroup from "../Viz/StatGroup";
import Viz from "../Viz/index";
import Selector from "./components/Selector";
import "./Section.css";

export default class InfoCard extends Component {

  render() {

    const {contents, loading} = this.props;
    const {descriptions, slug, stats, subtitles, title, visualizations} = contents;
    const selectors = contents.selectors || [];

    const statGroups = nest().key(d => d.title).entries(stats);

    return <div className={ `cp-section-inner cp-${slug}-section-inner bp3-card bp3-elevation-0` } ref={ comp => this.section = comp }>
      <div className="cp-section-content">
        <div className="title-wrapper">
          { title &&
            <h2 id={ slug } className="cp-section-title" dangerouslySetInnerHTML={{__html: stripP(title)}} />
          }
          { stats.length > 0
            ? <div className="cp-section-stats">
              <StatGroup key={statGroups[0].key} title={statGroups[0].key} stats={statGroups[0].values} />
            </div> : null }
        </div>
        { subtitles.map((content, i) => <div key={i} className="cp-section-subtitle" dangerouslySetInnerHTML={{__html: content.subtitle}} />) }
        { stats.length > 1
          ? <div className="cp-section-stats">
            { statGroups.slice(1).map(({key, values}) => <StatGroup key={key} title={key} stats={values} />) }
          </div> : null }
        { selectors.length > 0 && <div className="cp-section-selectors">
          { selectors.map(selector => <Selector key={selector.id} {...selector} loading={loading} />) }
        </div> }
        { descriptions.map((content, i) => <div key={i} className="cp-section-description" dangerouslySetInnerHTML={{__html: content.description}} />) }
      </div>
      <div className="cp-section-flex">
        { visualizations.map((visualization, ii) => <Viz section={this} config={visualization} key={ii} className="cp-section-visualization" title={ title } slug={ `${slug}_${ii}` } />) }
      </div>
    </div>;

  }

}