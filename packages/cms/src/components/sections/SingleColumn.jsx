import React, {Component} from "react";
import Viz from "../Viz/Viz";

export default class SingleColumn extends Component {

  render() {
    const {slug, title, heading, paragraphs, loading, filters, stats, sources, visualizations} = this.props;

    return (
      <div
        className={`cp-section-inner cp-single-column-section-inner cp-${slug}-section-inner ${loading ? "is-loading" : ""}`}
        ref={comp => this.section = comp}
      >
        {/* heading */}
        {heading}

        {/* tube of content */}
        <div className="cp-section-content cp-single-column-section-caption">
          {filters}
          {stats}
          {paragraphs}
          {sources}
          {visualizations.map((visualization, i) =>
            <Viz section={this} config={visualization} title={title} slug={`${slug}-${i}`}  key={`${slug}-${i}`} />
          )}
        </div>
      </div>
    );
  }
}
