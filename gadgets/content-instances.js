define(function (require, exports, module) {
    var $ = require("jquery");
    var Ratchet = require("ratchet/web");
    var OneTeam = require("oneteam");

    var ContentInstancesGadget = require("app/gadgets/project/content/content-instances");

    return Ratchet.GadgetRegistry.register("custom-content-instances", ContentInstancesGadget.extend({

        doGitanaQuery: function (context, model, searchTerm, query, pagination, callback) {
            query._fields = {
                title: 1,
                description: 1,
                _system: 1,
                _type: 1,
                "image.id": 1
            };

            this.base(context, model, searchTerm, query, pagination, function (resultMap) {

                var array = resultMap.asArray();

                model.size = resultMap.size();
                model.totalRows = resultMap.totalRows();

                // copy into map so that we can reference by ID
                // this may help with drag/drop                
                model.rowsById = {};
                for (var i = 0; i < array.length; i++) {
                    var row = array[i];
                    model.rowsById[row._doc] = row;
                }

                callback(resultMap);
            });
        },

        iconUri: function (row, model, context) {
            var imageNodeId;

            if (row.image && row.image.id) {
                imageNodeId = row.image.id;
            } else if (row.thumbnail && row.thumbnail.id) {
                imageNodeId = row.thumbnail.id;
            } else if (row.mainImage && row.mainImage.id) {
                imageNodeId = row.mainImage.id;
            } else {
                return OneTeam.iconUriForNode(row);
            }

            return _iconUri = OneTeam.iconUri(this.observable("repository").get()._doc, this.observable("branch").get()._doc, imageNodeId, false, null, { size: 120 }, "image/png");
        }
    }));
});