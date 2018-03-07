import "babel-polyfill";

import React from "react";
import Helmet from "react-helmet";
import {renderToString} from "react-dom/server";
import {createMemoryHistory, match, RouterContext} from "react-router";
import createRoutes from "routes";
import configureStore from "./storeConfig";
import preRenderMiddleware from "./middlewares/preRenderMiddleware";
import pretty from "pretty";

import CanonProvider from "./CanonProvider";

import serialize from "serialize-javascript";

const analtyicsScript = process.env.CANON_GOOGLE_ANALYTICS === undefined ? ""
  : `<script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', '${process.env.CANON_GOOGLE_ANALYTICS}', 'auto');
      ga('send', 'pageview');
    </script>`;

export default function(defaultStore = {}, i18n, headerConfig) {

  return function(req, res) {

    function fetchResource(lng) {
      if (!lng) return undefined;
      if (lng.indexOf("-") === 2 || lng.indexOf("_") === 2) lng = lng.slice(0, 2);
      return [lng, i18n.getResourceBundle(lng, i18n.options.defaultNS)];
    }

    // Set the current language of the app using 7 different strategies
    let locale, resources;

    // 1st strategy: check the subdomain:
    // i.e. de.myapp.com would set the language to German
    if (req.headers.host.indexOf(".") > 0) {
      const ret = fetchResource(req.headers.host.split(".")[0]);
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    // 2nd strategy: check the URL query str for a 'lang' key:
    // i.e. myapp.com?lang=de would set the language to German
    if (resources === undefined) {
      const ret = fetchResource(req.query.lang);
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    // 3rd strategy: check the URL query str for a 'language' key:
    // i.e. myapp.com?language=de would set the language to German
    if (resources === undefined) {
      const ret = fetchResource(req.query.language);
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    // 4th strategy: check the URL query str for a 'locale' key:
    // i.e. myapp.com?locale=de would set the language to German
    if (resources === undefined) {
      const ret = fetchResource(req.query.locale);
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    // 5th strategy: check the first element of the URL path and see if it matches
    // anything in the CANON_LANGUAGES env var
    if (resources === undefined) {
      const splitPath = req.path.split("/");
      if (splitPath.length > 1) {
        const firstPathElem = splitPath[1];
        if (process.env.CANON_LANGUAGES.includes(firstPathElem)) {
          const ret = fetchResource(firstPathElem);
          if (ret) {
            locale = ret[0];
            resources = ret[1];
          }
        }
      }
    }

    // 6th strategy: check the request headers for a language:
    // many browsers by default will send a language
    if (resources === undefined) {
      const ret = fetchResource(req.language);
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    // 7th strategy: fallback to whatever the CANON_LANGUAGE_DEFAULT environment
    // var is set to, if it's not set use english
    if (resources === undefined) {
      const ret = fetchResource(process.env.CANON_LANGUAGE_DEFAULT || "en");
      if (ret) {
        locale = ret[0];
        resources = ret[1];
      }
    }

    const location = {
      host: req.headers.host,
      hostname: req.headers.host.split(":")[0],
      href: `http${ req.connection.encrypted ? "s" : "" }://${ req.headers.host }${ req.url }`,
      origin: `http${ req.connection.encrypted ? "s" : "" }://${ req.headers.host }`,
      pathname: req.url.split("?")[0],
      port: req.headers.host.includes(":") ? req.headers.host.split(":")[1] : "80",
      protocol: `http${ req.connection.encrypted ? "s" : "" }:`,
      query: req.query,
      search: req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""
    };

    const history = createMemoryHistory();
    const store = configureStore({i18n: {locale, resources}, location, ...defaultStore}, history);
    const routes = createRoutes(store);
    i18n.changeLanguage(locale);
    const rtl = ["ar", "he"].includes(locale);

    match({routes, location: req.url}, (err, redirect, props) => {

      if (err) res.status(500).json(err);
      else if (redirect) res.redirect(302, redirect.pathname + redirect.search);
      else if (props) {
        // This method waits for all render component
        // promises to resolve before returning to browser
        preRenderMiddleware(store, props)
          .then(() => {
            const initialState = store.getState();
            const componentHTML = renderToString(
              <CanonProvider helmet={headerConfig} i18n={i18n} locale={locale} store={store}>
                <RouterContext {...props} />
              </CanonProvider>
            );

            const header = Helmet.rewind();

            res.status(200).send(`<!doctype html>
<html dir="${ rtl ? "rtl" : "ltr" }" ${header.htmlAttributes.toString()}>
  <head>
    ${ pretty(header.title.toString()).replace(/\n/g, "\n    ") }

    ${ pretty(header.meta.toString()).replace(/\n/g, "\n    ") }

    ${ pretty(header.link.toString()).replace(/\n/g, "\n    ") }

    <link rel='stylesheet' type='text/css' href='/assets/normalize.css'>
    <link rel='stylesheet' type='text/css' href='/assets/blueprint/dist/blueprint.css'>
    <link rel='stylesheet' type='text/css' href='/assets/styles.css'>
  </head>
  <body>
    <div id="React-Container">${ componentHTML }</div>

    <script>
      window.__SSR__ = true;
      window.__APP_NAME__ = "${ i18n.options.defaultNS }";
      window.__HELMET_DEFAULT__ = ${ serialize(headerConfig, {isJSON: true, space: 2}).replace(/\n/g, "\n      ") };
      window.__INITIAL_STATE__ = ${ serialize(initialState, {isJSON: true, space: 2}).replace(/\n/g, "\n      ") };
    </script>

    ${analtyicsScript}

    <script type="text/javascript" charset="utf-8" src="/assets/app.js"></script>
  </body>
</html>`);
          })
          .catch(err => {
            res.status(500).send({error: err.toString(), stackTrace: err.stack.toString()});
          });
      }
      else res.sendStatus(404);

    });
  };

}
