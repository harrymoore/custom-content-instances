define(function (require, exports, module) {
    var $ = require("jquery");
    var Ratchet = require("ratchet/web");
    var OneTeam = require("oneteam");

    var ContentInstancesGadget = require("app/gadgets/project/content/content-instances");

    return Ratchet.GadgetRegistry.register("custom-content-instances", ContentInstancesGadget.extend({

        doGitanaQuery: function (context, model, searchTerm, query, pagination, callback) {
            query._fields = {
                title: 1,
                description: 1
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
            var _iconUri = OneTeam.iconUriForNode(row);

            if (row.image && row.image.id) {
                _iconUri = OneTeam.iconUriForNode(row, { size: 160 });
                _iconUri = _iconUri.replace(new RegExp("node=" + row._doc + "&"), "node=" + row.image.id + "&");
            }

            return _iconUri;
        }
    }));
});