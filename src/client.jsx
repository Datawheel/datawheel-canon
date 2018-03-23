/* eslint react/display-name:0 */
import "babel-polyfill";

import React from "react";
import {render} from "react-dom";
import {applyRouterMiddleware, browserHistory, Router, RouterContext} from "react-router";
import {syncHistoryWithStore} from "react-router-redux";
import {animateScroll} from "react-scroll";
import createRoutes from "routes";
import configureStore from "./storeConfig";
import {LOADING_END, LOADING_START} from "./consts";
import preRenderMiddleware from "./middlewares/preRenderMiddleware";

const store = configureStore(window.__INITIAL_STATE__, browserHistory);
const history = syncHistoryWithStore(browserHistory, store);
const routes = createRoutes(store);

import i18n from "i18next";
import yn from "yn";

import defaultTranslations from "./locale";
import CanonProvider from "./CanonProvider";

const {locale, resources} = window.__INITIAL_STATE__.i18n;
const {CANON_LOGLOCALE, NODE_ENV} = window.__INITIAL_STATE__.env;
const name = window.__APP_NAME__;

i18n
  .init({
    fallbackLng: "canon",
    lng: locale,
    debug: NODE_ENV !== "production" ? yn(CANON_LOGLOCALE) : false,
    ns: [name],
    defaultNS: name,
    interpolation: {
      escapeValue: false // not needed for react!!
    },
    react: {
      wait: true
    },
    resources: {
      [locale]: {[name]: resources},
      canon: {[name]: defaultTranslations}
    }
  });


function scrollToHash(hash) {
  const elem = hash && hash.indexOf("#") === 0 ? document.getElementById(hash.slice(1)) : false;
  if (elem) {
    const offset = elem.getBoundingClientRect().top;
    if (offset) animateScroll.scrollMore(offset);
  }
}

function renderMiddleware() {

  return {
    renderRouterContext: (child, props) => {

      if (window.__SSR__) {
        window.__SSR__ = false;
        scrollToHash(props.location.hash);
      }
      else if (!props.location.key && props.location.hash) {
        scrollToHash(props.location.hash);
      }
      else {
        store.dispatch({type: LOADING_START});
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        preRenderMiddleware(store, props)
          .then(() => {
            store.dispatch({type: LOADING_END});
            scrollToHash(props.location.hash);
          });
      }

      return <RouterContext {...props}/>;

    }

  };

}

const helmet = window.__HELMET_DEFAULT__;

render(
  <CanonProvider helmet={helmet} i18n={i18n} locale={locale} store={store}>
    <Router history={history} render={applyRouterMiddleware(renderMiddleware())}>
      {routes}
    </Router>
  </CanonProvider>, document.getElementById("React-Container"));
