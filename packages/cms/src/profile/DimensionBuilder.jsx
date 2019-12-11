import React, {Component, Fragment} from "react";
import {connect} from "react-redux";

import DimensionCard from "../components/cards/DimensionCard";
import DimensionEditor from "../components/editors/DimensionEditor";
import Deck from "../components/interface/Deck";
import Dialog from "../components/interface/Dialog";

import "./DimensionBuilder.css";

class DimensionBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  render() {
    const {previews} = this.props.status;
    const {meta} = this.props;
    const {isOpen} = this.state;

    return (
      <Fragment>
        <Deck
          title="Dimensions"
          entity="dimension"
          addItem={() => this.setState({isOpen: !this.state.isOpen})}
          cards={meta.map((m, i) =>
            <DimensionCard
              key={`dc-${m.id}`}
              meta={meta[i]}
              preview={previews[i]}
            />
          )}
        />

        <Dialog
          className="cms-dimension-editor-dialog"
          title="Dimension editor"
          isOpen={isOpen}
          onClose={() => this.setState({isOpen: false})}
          usePortal={false}
          icon={false}
        >
          <DimensionEditor
            onComplete={() => this.setState({isOpen: false})}
          />
        </Dialog>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  status: state.cms.status,
  meta: state.cms.profiles.find(p => p.id === state.cms.status.currentPid).meta
});

export default connect(mapStateToProps)(DimensionBuilder);
