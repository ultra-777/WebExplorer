"use strict";

function model(sequelize, DataTypes) {

    var Tree =
        sequelize.define(
            "tree",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                repositoryId: { type: DataTypes.BIGINT},
                ownerId: { type: DataTypes.BIGINT},
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Trees'
            }
        );

    return Tree;
};

function configure(getObjectHandler){
    var user = getObjectHandler('user', 'security');
    var tree = getObjectHandler('tree', 'fileSystem');
    var repository = getObjectHandler('repository', 'fileSystem');
    repository.hasOne(tree, {as: 'repository', foreignKey : 'repositoryId'});
    user.hasOne(tree, {as: 'owner', foreignKey : 'ownerId'});
    tree.belongsTo(repository);
    tree.belongsTo(user, {as: 'owner'});
}


module.exports = {
    model: model,
    config: configure
};

