'use strict';

module.exports = function(app) {
	// Root routing
	var explorer = require('../../server/controllers/explorer');
	//app.route('/').get(explorer.index);
    app.route('/explorer').get(explorer.index);
    app.route('/explorer/Root').get(explorer.root);
    app.route('/explorer/Folder').post(explorer.folder);
    app.route('/explorer/NewFolder').post(explorer.newFolder);
    app.route('/explorer/Delete').post(explorer.delete);
    app.route('/explorer/Download').get(explorer.download);
    app.route('/explorer/InitBlob').post(explorer.initBlob);
    app.route('/explorer/AddBlobChunk').post(explorer.addBlobChunk);
    app.route('/explorer/ReleaseBlob').post(explorer.releaseBlob);
};