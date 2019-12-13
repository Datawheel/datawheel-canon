import React, {Component} from "react";
import {connect} from "react-redux";
import {nest} from "d3-collection";

import stripHTML from "../../utils/formatters/stripHTML";

import Viz from "../Viz/Viz";
import SourceGroup from "../Viz/SourceGroup";
import StatGroup from "../Viz/StatGroup";

import Button from "../fields/Button";

import Parse from "./components/Parse";

import "./Section.css";
import "./Hero.css";

/** the profile hero, AKA header, AKA splash */
class Hero extends Component {

  constructor(props) {
    super(props);
    this.state = {
      contents: props.contents,
      loading: false,
      selectors: {},
      sources: [],
      images: [],
      creditsVisible: false
    };
  }

  componentDidMount() {
    const {profile} = this.props;
    const {dims} = profile;

    /** Image Metadata
      * A profile is a set of one more slug/id pairs. In multi-variate profiles, these pairs are strictly
      * ordered, for example, /geo/mass/export/coal/import/cars. Each of these slug/id pairs may or may not
      * have image data associated with it, which makes up the backdrop of the Hero Section. If it does have
      * an image, then it also will have metadata. The `images` array that I create is a strictly ordered
      * array of image links and their data. This means, in the example above, if /export/coal is the only
      * one of the three that have an image, then this image array will be [null, {imageData}, null].
      */

    const images = [];
    if (dims) {
      for (let i = 0; i < dims.length; i++) {
        if (profile.images[i]) {
          images.push({
            src: `/api/image?slug=${dims[i].slug}&id=${dims[i].id}&type=splash`,
            author: profile.images[i].author,
            meta: profile.images[i].meta,
            permalink: profile.images[i].url
          });
        }
      }
    }

    this.setState({images});
  }

  render() {
    const {contents, loading, sources, profile} = this.props;
    const {images, creditsVisible} = this.state;

    let title = profile.title;
    let paragraphs, sourceContent, statContent, subtitleContent;

    if (contents) {
      title = contents.title;
      // subtitles
      if (contents.subtitles.length) {
        subtitleContent = contents.subtitles.map((subhead, i) =>
          <Parse className="cp-section-subhead display cp-hero-subhead" key={`${subhead.subtitle}-subhead-${i}`}>
            {subhead.subtitle}
          </Parse>
        );
      }

      // stats
      if (contents.stats.length > 0) {
        const statGroups = nest().key(d => d.title).entries(contents.stats);

        statContent = <div className={`cp-stat-group-wrapper cp-hero-stat-group-wrapper${statGroups.length === 1 ? " single-stat" : ""}`}>
          {statGroups.map(({key, values}) => <StatGroup className="cp-hero-stat" key={key} title={key} stats={values} />)}
        </div>;
      }

      // descriptions
      if (contents.descriptions.length) {
        paragraphs = loading
          ? <p>Loading...</p>
          : contents.descriptions.map((content, i) =>
            <Parse className="cp-section-paragraph cp-hero-paragraph" key={`hero-paragraph-${i}`}>
              {content.description}
            </Parse>
          );
      }

      // sources
      sourceContent = <SourceGroup sources={sources} />;
    }


    // heading & subhead(s)
    const heading = <React.Fragment>
      <Parse El="h1" id={contents ? contents.slug : `${stripHTML(profile.title)}-hero`} className="cp-section-heading cp-hero-heading u-font-xxl">
        {title}
      </Parse>
      {subtitleContent}
    </React.Fragment>;


    return (
      <header className="cp-section cp-hero">
        <div className="cp-section-inner cp-hero-inner">
          {/* caption */}
          <div className="cp-section-content cp-hero-caption">
            {heading}
            {statContent}
            {paragraphs}
            {sourceContent}
          </div>

          {/* print the first visualization */}
          {contents && contents.visualizations && contents.visualizations.length
            ? <div className="cp-hero-figure">
              {contents.visualizations.map((visualization, ii) => ii === 0
                ? <Viz section={this} config={visualization} showTitle={false} sectionTitle={title} options={false} slug={contents.slug} key={ii} />
                : ""
              )}
            </div> : ""
          }
        </div>

        {/* display image credits, and images */}
        {images && images.length
          ? <React.Fragment>
            {/* credits */}
            <div className={`cp-hero-credits ${creditsVisible ? "is-open" : "is-closed"}`}>
              <Button
                className="cp-hero-credits-button"
                onClick={() => this.setState({creditsVisible: !creditsVisible})}
                icon={creditsVisible ? "eye-off" : "eye-open"}
                iconPosition="left"
                fontSize="xxs"
                active={creditsVisible}
              >
                <span className="u-visually-hidden">
                  {creditsVisible ? "view " : "hide "}
                </span>
                image credits
              </Button>

              {creditsVisible
                ? <ul className="cp-hero-credits-list">
                  {images.map((img, i) =>
                    <li className="cp-hero-credits-item" key={img.permalink}>
                      {images.length > 1
                        ? <h2 className="cp-hero-credits-item-heading u-font-md">
                          Image {i + 1}
                        </h2> : ""
                      }

                      {/* author */}
                      {img.author
                        ? <p className="cp-hero-credits-text">
                          Photograph by <span className="cp-hero-credits-name heading">
                            {img.author}
                          </span>
                        </p> : ""
                      }
                      {/* description */}
                      {img.meta ? <p className="cp-hero-credits-text">
                        {img.meta}
                      </p> : ""}
                      {/* flickr link */}
                      {img.permalink ? <p className="cp-hero-credits-text u-font-xs">
                        <span className="u-visually-hidden">Direct link: </span>
                        <a className="cp-hero-credits-link" href={img.permalink}>
                          {img.permalink.replace("https://", "")}
                        </a>
                      </p> : ""}
                    </li>
                  )}
                </ul> : ""
              }
            </div>

            {/* images */}
            <div className="cp-hero-img-outer">
              <div className="cp-hero-img-overlay" />
              <div className="cp-hero-img-grid">
                {images.map(img => img.src &&
                  <div className="cp-hero-img-wrapper" key={img.src}>
                    <img className="cp-hero-img" src={img.src} alt="" draggable="false" />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment> : ""
        }
      </header>
    );
  }
}

export default connect(state => ({
  locale: state.i18n.locale
}))(Hero);
