const sequelize = require("sequelize");
const yn = require("yn");

const verbose = yn(process.env.CANON_CMS_LOGGING);
const Flickr = require("flickr-sdk");
const flickr = new Flickr(process.env.FLICKR_API_KEY);
const {Storage} = require("@google-cloud/storage");
const storage = new Storage();
const sharp = require("sharp");
const fs = require("fs");
const tmp = require("tmp");
const axios = require("axios");

const validLicenses = ["4", "5", "7", "8", "9", "10"];
const bucket = "datawheel-cms-images";


const catcher = e => {
  if (verbose) {
    console.error("Error in searchRoute: ", e);
  }
  return [];
};

module.exports = function(app) {

  const {db, cache} = app.settings;

  app.get("/api/haha", async(req, res) => {
    
    
  });

  app.post("/api/image/update", async(req, res) => {
    const {url, contentId} = req.body;
    const id = url.replace("https://flic.kr/p/", "");
    const info = await flickr.photos.getInfo({photo_id: id}).then(resp => resp.body).catch(catcher);
    if (info) {
      if (validLicenses.includes(info.photo.license)) {
        const searchRow = await db.search.findOne({where: {contentId}}).catch(catcher);
        const imageRow = await db.images.findOne({where: {url}}).catch(catcher);
        if (searchRow) {
          if (imageRow) {
            await db.search.update({imageId: imageRow.id}, {where: {contentId}}).catch(catcher);
          }
          else {
            // To add a new image, first create a row in the table with the metadata from flickr.
            const payload = {
              url,
              author: info.photo.owner.realname || info.photo.owner.username,
              license: info.photo.license
            };
            const newImage = await db.images.create(payload).catch(catcher);
            await db.search.update({imageId: newImage.id}, {where: {contentId}}).catch(catcher);
            
            // Then fetch the available sizes from flickr
            const sizeObj = await flickr.photos.getSizes({photo_id: id}).then(resp => resp.body).catch(catcher);
            let image = sizeObj.sizes.size.find(d => parseInt(d.width, 10) >= 1600);
            if (!image) image = sizeObj.sizes.size.find(d => parseInt(d.width, 10) >= 1000);
            if (!image) image = sizeObj.sizes.size.find(d => parseInt(d.width, 10) >= 500);
            const imageData = await axios.get(image.source, {responseType: "arraybuffer"}).then(d => d.data).catch(catcher);
            
            // For both splash and thumb sizes, write the buffer to disk, upload to cloud, then delete.
            const splashHandle = tmp.fileSync();
            const splashPath = splashHandle.name;
            await sharp(imageData).resize(1600).toFile(splashPath).catch(catcher);
            const splashFile = `${newImage.id}.jpg`;
            const splashOptions = {destination: splashFile};
            const splashUpload = await storage.bucket(bucket).upload(splashPath, splashOptions).catch(catcher);
            await storage.bucket(bucket).file(splashFile).makePublic().catch(catcher);
            const link = splashUpload[1].selfLink;
            fs.unlinkSync(splashPath);
            
            const thumbHandle = tmp.fileSync();
            const thumbPath = thumbHandle.name;
            await sharp(imageData).resize(425).toFile(thumbPath).catch(catcher);
            const thumbFile = `${newImage.id}_thumb.jpg`;
            const thumbOptions = {destination: thumbFile};
            await storage.bucket(bucket).upload(thumbPath, thumbOptions).catch(catcher);
            await storage.bucket(bucket).file(thumbFile).makePublic().catch(catcher);
            fs.unlinkSync(thumbPath);  

            // Then update the image row to store the cloud link
            await db.images.update({link}, {where: {id: newImage.id}}).catch(catcher);
          }
          const newRow = await db.search.findOne({
            where: {contentId},
            include: [
              {model: db.images}, {association: "content"}
            ]
          }).catch(catcher);
          res.json(newRow);
        }
        else {
          res.json("Error updating Search");
        }
      }
      else {
        res.json({error: "Bad License"});
      }
    }
    else {
      res.json({error: "Malformed URL"});
    }
  });

  app.get("/api/cubeData", (req, res) => {
    res.json(cache.cubeData).end();
  });

  app.get("/api/search/all", async(req, res) => {
    let rows = await db.search.findAll({include: [
      {model: db.images}, {association: "content"}
    ]}).catch(catcher);
    rows = rows.map(r => r.toJSON());
    res.json(rows);
  });

  app.post("/api/search/update", async(req, res) => {
    const {contentId, url} = req.body;
    
  });

  app.get("/api/search", async(req, res) => {

    const where = {};

    let {limit = "10"} = req.query;
    limit = parseInt(limit, 10);

    const locale = req.query.locale || process.env.CANON_LANGUAGE_DEFAULT || "en";

    const {id, q, dimension, levels} = req.query;

    let rows = [];

    if (id) {
      where.id = id.includes(",") ? id.split(",") : id;
      rows = await db.search.findAll({
        where,
        include: [{model: db.images}, {association: "content"}]
      });
    } 
    else if (q) {
      where[sequelize.Op.or] = [
        {name: {[sequelize.Op.iLike]: `%${q}%`}},
        {keywords: {[sequelize.Op.overlap]: [q]}}
      ];
      where.lang = locale;
      rows = await db.search_content.findAll({where}).catch(catcher);
      const searchWhere = {
        contentId: Array.from(new Set(rows.map(r => r.id)))
      };
      if (dimension) searchWhere.dimension = dimension;
      // In sequelize, the IN statement is implicit (hierarchy: ['Division', 'State'])
      if (levels) searchWhere.hierarchy = levels.split(",");
      rows = await db.search.findAll({
        include: [{model: db.images}, {association: "content"}],
        limit,
        order: [["zvalue", "DESC"]],
        where: searchWhere
      });
    }

    /**
     * Note: The purpose of this slugs lookup object is so that in traditional, 1:1 cms sites,
     * We can translate a Dimension found in search results (like "Geography") into a slug 
     * (like "geo"). This is then passed along in the search result under the key "profile"
     * so that the search bar (in DataUSA, for example) can create a link out of it like
     * /profile/geo/Massachusetts. However, This will be insufficient for bivariate profiles, where
     * there will no longer be ONE single profile to which a search result pertains - a search
     * for "mass" could apply to both a geo and a geo_jobs (or wherever a geo Dimension is invoked)
     * Longer term, the "results" row below may need some new keys to more accurately depict the 
     * profiles to which each particular result may apply.
     */
    let meta = await db.profile_meta.findAll();
    meta = meta.map(m => m.toJSON());
    const slugs = {};
    meta.forEach(m => {
      if (!slugs[m.dimension]) slugs[m.dimension] = m.slug;
    });

    const results = rows.map(d => {
      d = d.toJSON();
      const result = {
        dimension: d.dimension,
        hierarchy: d.hierarchy,
        id: d.id,
        image: d.image,
        profile: slugs[d.dimension],
        slug: d.slug,
        stem: d.stem === 1
      };
      const defCon = d.content.find(c => c.lang === locale);
      if (defCon) {
        result.name = defCon.name;
        result.keywords = defCon.keywords;
      }
      return result;
    });

    res.json({
      results,
      query: {dimension, id, limit, q}
    });

  });

};
