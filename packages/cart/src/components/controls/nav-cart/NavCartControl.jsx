import React from "react";
import PropTypes from "prop-types";
import {connect} from "react-redux";
import {Popover, PopoverInteractionKind, Classes, Button, Tooltip, Position} from "@blueprintjs/core";

import {clearCartAction, initCartAction} from "../../../actions";

import DatasetList from "../../partials/DatasetList";

import "./NavCartControl.css";

class NavCartControl extends React.Component {
  constructor(props, ctx) {
    super(props);

    this.state = {
    };

    this.onClickClearCart = this.onClickClearCart.bind(this);
  }

  initialize(props) {

  }

  componentDidMount() {
    this.props.dispatch(initCartAction());
  }

  componentDidUpdate(prevProps) {

  }

  componentWillUnmount() {

  }

  onClickClearCart() {
    this.props.dispatch(clearCartAction());
  }

  getChildContext() {
    const {datasets, dispatch} = this.props;
    return {
      datasets, dispatch
    };
  }

  render() {
    const {cartRoute, popover, datasets, ready, full} = this.props;

    const buttonText = "Cart";
    const datasetsIds = Object.keys(datasets);
    const qty = datasetsIds.length;
    let stateClass = qty === 0 ? "empty-state" : "non-empty-state";
    stateClass = full ? "full-state non-empty-state" : "non-empty-state";
    const readyClass = ready ? "ready" : "no-ready";

    const popoverContent =
      <div className={"canon-cart-nav-control-content"}>
        <DatasetList showOptions={false} />
        <hr/>
        <div className={"canon-cart-nav-control-button-container"}>
          <Tooltip
            className={"canon-dataset-list-tooltip bp3-fill"}
            autoFocus={false}
            inline={false}
            openOnTargetFocus={false}
            position={Position.LEFT}
            content={"Navigate to Data Cart"}
          >
            <a className={"bp3-button bp3-fill bp3-minimal canon-cart-nav-control-button"} href={cartRoute}>View Data</a>
          </Tooltip>
          <Tooltip
            className={"canon-dataset-list-tooltip"}
            autoFocus={false}
            inline={false}
            openOnTargetFocus={false}
            position={Position.LEFT}
            content={"Remove all datasets from Cart"}
          >
            <Button onClick={this.onClickClearCart} fill={true} minimal={true} disabled={qty === 0}>Clear Data</Button>
          </Tooltip>
        </div>
      </div>
    ;

    return (
      <Popover content={popoverContent} disabled={!popover && ready} popoverClassName={`canon-cart-nav-control-popover ${Classes.POPOVER_CONTENT_SIZING} ${Classes.POPOVER_DISMISS}`} interactionKind={PopoverInteractionKind.HOVER}>
        <a href={cartRoute} className={`canon-cart-nav-control-container ${readyClass} ${stateClass}`}>
          {qty > 0 && <span className={"canon-cart-nav-control-qty"}>({qty})</span>}
          <span className={"canon-cart-nav-control-text"}>{buttonText}</span>
        </a>
      </Popover>
    );
  }
}

NavCartControl.childContextTypes = {
  datasets: PropTypes.object,
  dispatch: PropTypes.func
};

NavCartControl.propTypes = {
  cartRoute: PropTypes.string,
  popover: PropTypes.bool
};

NavCartControl.defaultProps = {
  cartRoute: "/cart",
  popover: true
};

export const defaultProps = NavCartControl.defaultProps;
export default connect(state => {
  const ct = state.cart;
  return {
    datasets: ct.list,
    ready: ct.internal.ready,
    full: ct.internal.full
  };
})(NavCartControl);