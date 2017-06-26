import axios from "axios";
import {dataFold} from "d3plus-viz";

function fetchData(key, url, format = dataFold, config = {}) {

  const returnFunction = (params, store) => {

    let u = url.indexOf("http") === 0 ? url : `${store.API}${url}`;

    (url.match(/<[^\&\=\/>]+>/g) || []).forEach(variable => {
      let x = variable.slice(1, -1);
      if (params[x]) x = params[x];
      else if (store.data && store.data[x]) x = store.data[x];
      else if (store[x]) x = store[x];
      else x = false;
      if (x) u = u.replace(variable, x);
    });

    return {
      type: "GET_DATA",
      promise: axios.get(u, config).then(res => ({key, data: format(res.data)}))
    };

  };
  returnFunction.key = key;

  return returnFunction;

}

export {fetchData};
