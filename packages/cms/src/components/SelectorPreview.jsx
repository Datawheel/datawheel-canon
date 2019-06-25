import axios from "axios";
import React, {Component} from "react";
import Select from "./Select";

class SelectorPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      minData: null,
      currentValues: {}
    };
  }

  componentDidMount() {
    this.setState({minData: this.props.minData});
  }

  removeItem(id) {
    const {minData} = this.state;
    axios.delete("/api/cms/topic_selector/delete", {params: {id}}).then(resp => {
      if (resp.status === 200) {
        minData.selectors = resp.data;
        this.setState({minData});
      }
    });
  }

  addItem(id) {
    const {minData} = this.state;
    const {selectors} = minData;
    const payload = {
      topic_id: minData.id,
      selector_id: id,
      ordering: selectors.length
    };
    axios.post("/api/cms/topic_selector/new", payload).then(resp => {
      const toMove = minData.allSelectors.find(d => d.id === id);
      if (toMove) {
        toMove.topic_selector = resp.data;
        minData.selectors.push(toMove);
        this.setState({minData});
      }
    });
  }

  onChange(name, e) {
    const {currentValues} = this.state;
    currentValues[name] = e.target.value;
    this.setState({currentValues});
    const selectionObj = {[name]: e.target.value};
    if (this.props.onSelect) this.props.onSelect(selectionObj);
  }

  render() {

    const {minData, currentValues} = this.state;
    const {variables} = this.props;

    if (!minData) return null;

    const {selectors, allSelectors} = minData;

    const remainingSelectors = allSelectors
      .filter(d => !selectors.map(s => s.topic_selector.selector_id).includes(d.id));

    return (
      <div className="cms-card">

        <h3>Inactive Selectors</h3>
        <ul>
          {remainingSelectors.map(s =>
            <li key={s.id}>
              <label>{s.name}</label>
              <button onClick={this.addItem.bind(this, s.id)}>Add</button>
            </li>
          )}
        </ul>

        <h3>Active Selectors</h3>
        <ol>
          {selectors.map(s =>
            <li key={s.id}>
              <label>{s.name}</label>
              {s.options.length > 0 &&
                <Select
                  label={s.title}
                  fontSize="xs"
                  value={currentValues[s.name]}
                  onChange={this.onChange.bind(this, s.name)}
                  options={s.options && s.options.map(o =>
                    o.isDefault
                      ? `${o.option && variables[o.option].toString()} (default)` : o.option && variables[o.option].toString()
                  )}
                />
              }
              <button onClick={this.removeItem.bind(this, s.topic_selector.id)}>Remove</button>
            </li>
          )}
        </ol>
      </div>
    );
  }
}

export default SelectorPreview;
