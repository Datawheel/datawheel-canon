import React from "react";
import PropTypes from "prop-types";
import {NonIdealState} from "@blueprintjs/core";
import {formatAbbreviate} from "d3plus-format";

import createChartConfig, {charts} from "../../helpers/chartconfig";
import ChartCard from "./ChartCard";

import "./style.css";

const EMPTY_DATASETS = (
  <div className="area-chart empty">
    <NonIdealState visual="error" title="Empty dataset" />
  </div>
);

class ChartArea extends React.Component {
  constructor(props) {
    super(props);

    this.resizeCall = undefined;
    this.scrollCall = undefined;

    this.selectChart = this.selectChart.bind(this);
    this.scrollEnsure = this.scrollEnsure.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.activeChart !== nextProps.activeChart ||
      this.props.triggerUpdate !== nextProps.triggerUpdate
    );
  }

  dispatchScroll() {
    // TODO: Discuss how could we implement IntersectionObserver
    window.dispatchEvent(new CustomEvent("scroll"));
  }

  dispatchResize() {
    window.dispatchEvent(new CustomEvent("resize"));
  }

  scrollEnsure() {
    clearTimeout(this.scrollCall);
    this.scrollCall = setTimeout(this.dispatchScroll, 400);
  }

  selectChart(type) {
    const query = {activeChart: this.props.activeChart ? null : type};
    this.context.stateUpdate({query}).then(() => {
      requestAnimationFrame(this.dispatchResize);
      requestAnimationFrame(this.dispatchScroll);
    });
  }

  render() {
    const {
      activeChart,
      defaultConfig,
      measureConfig,
      datasets,
      members,
      queries,
      topojson,
      visualizations
    } = this.props;

    if (!datasets.length) {
      return EMPTY_DATASETS;
    }

    const generalConfig = {
      defaultConfig,
      formatting: this.context.formatting,
      measureConfig,
      topojson,
      visualizations
    };

    const chartElements = [];

    let n = queries.length;

    while (n--) {
      const chartConfigs = createChartConfig(
        queries[n],
        datasets[n],
        members[n],
        activeChart,
        generalConfig
      );
      const configs = chartConfigs.map(chartConfig => (
        <ChartCard
          active={chartConfig.key === activeChart}
          key={chartConfig.key}
          name={chartConfig.key}
          onSelect={this.selectChart}
        >
          <chartConfig.component config={chartConfig.config} />
        </ChartCard>
      ));
      chartElements.unshift(...configs);
    }

    if (!chartElements.length) {
      return EMPTY_DATASETS;
    }

    return (
      <div className="area-chart" onScroll={this.scrollEnsure}>
        <div className="wrapper">
          <div className={`chart-wrapper ${activeChart || "multi"}`}>
            {chartElements}
          </div>
        </div>
      </div>
    );
  }
}

ChartArea.contextTypes = {
  formatting: PropTypes.objectOf(PropTypes.func),
  stateUpdate: PropTypes.func
};

ChartArea.propTypes = {
  activeChart: PropTypes.string,
  defaultConfig: PropTypes.object,
  formatting: PropTypes.objectOf(PropTypes.func),
  measureConfig: PropTypes.object,
  datasets: PropTypes.arrayOf(PropTypes.array),
  members: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.array)),
  queries: PropTypes.arrayOf(PropTypes.object),
  topojson: PropTypes.objectOf(
    PropTypes.shape({
      topojson: PropTypes.string.isRequired,
      topojsonId: PropTypes.string,
      topojsonKey: PropTypes.string
    })
  ),
  triggerUpdate: PropTypes.number,
  visualizations: PropTypes.arrayOf(PropTypes.string)
};

ChartArea.defaultProps = {
  activeChart: null,
  dataset: []
};

export default ChartArea;
