module.exports = function(sequelize, db) {

  const g = sequelize.define("generator",
    {
      id: {
        type: db.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: db.TEXT,
        defaultValue: "New Generator"
      },
      api: {
        type: db.TEXT,
        defaultValue: "http://api-goes-here"
      },
      description: {
        type: db.TEXT,
        defaultValue: "New Description"
      },
      logic: {
        type: db.TEXT,
        defaultValue: "return {}"
      },
      ez: {
        type: db.JSON,
        defaultValue: null
      },
      profile_id: {
        type: db.INTEGER,
        onDelete: "cascade",
        references: {
          model: "profile",
          key: "id"
        }
      }
    },
    {
      freezeTableName: true,
      timestamps: false
    }
  );

  return g;

};
