module.exports = function(sequelize, db) {

  const search = sequelize.define("search",
    {
      id: {
        primaryKey: true,
        type: db.TEXT
      },
      zvalue: db.DOUBLE,
      dimension: {
        primaryKey: true,
        type: db.TEXT
      },
      hierarchy: {
        primaryKey: true,
        type: db.TEXT
      },
      stem: db.INTEGER,
      slug: db.TEXT,
      imageId: db.INTEGER,
      contentId: db.INTEGER
    },
    {
      tableName: "canon_cms_search",
      freezeTableName: true,
      timestamps: false
    }
  );

  search.associate = models => {
    search.belongsTo(models.images);
    search.hasMany(models.search_content, {foreignKey: "contentId", sourceKey: "id", as: "content"});
  };

  return search;

};
