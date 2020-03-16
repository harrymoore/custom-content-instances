define(function (require, exports, module) {
    var $ = require("jquery");
    var Ratchet = require("ratchet/web");
    var OneTeam = require("oneteam");
    var TemplateHelperFactory = require("template-helper");

    var ContentInstancesGadget = require("app/gadgets/project/content/content-instances");

    return Ratchet.GadgetRegistry.register("custom-content-instances", ContentInstancesGadget.extend({

        doGitanaQuery: function (context, model, searchTerm, query, pagination, callback) {
            if (!query) {
                query = {};
            }

            query._fields = {
                title: 1,
                description: 1,
                _system: 1,
                _type: 1,
                "image.id": 1,
                "thumbnail.id": 1,
                "mainImage.id": 1,
                date: 1,
                "_features.f:locale.locale": 1,
                "_features.f:translation.locale": 1
            };

            var selectedContentTypeDescriptor = model.selectedContentTypeDescriptor;
            var type = selectedContentTypeDescriptor.definition.getQName();
            if (type === "mmcx:press-release") {
                var year = (new Date()).getFullYear();
                var year1 = year - 1;

                var _or = [];

                _or.push({
                    "date": {
                        "$regex": '\\/' + year + '$'
                    }
                });
                
                _or.push({
                    "date": {
                        "$regex": '\\/' + (year - 1) + '$'
                    }
                });

                _or.push({
                    "date": {
                        "$regex": '\\/' + (year - 2) + '$'
                    }
                });

                if (searchTerm) {
                    query.$and = [OneTeam.searchQuery(searchTerm, ["title", "description"])];
                    query.$and.push({$or: _or});
                } else {
                    query.$or = _or;
                }
            } else {
                if (searchTerm) {
                    Object.assign(query, OneTeam.searchQuery(searchTerm, ["title", "description"]));
                }
            }

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
            } else if (row.mainImage && row.mainImage.id) {
                imageNodeId = row.mainImage.id;
            } else if (row.thumbnail && row.thumbnail.id) {
                imageNodeId = row.thumbnail.id;
            } else {
                return OneTeam.iconUriForNode(row);
            }

            return _iconUri = OneTeam.iconUri(this.observable("repository").get()._doc, this.observable("branch").get()._doc, imageNodeId, false, null, { size: 120 }, "image/png");
        },

        prepareModel: function(el, model, callback)
        {
            var self = this;

            this.base(el, model, function() {

                TemplateHelperFactory.create(self, "content-instances", function(err, renderTemplate) {

                    model.renderTemplate = renderTemplate;

                    var project = self.observable("project").get();

                    model.projectId = project.getId();
                    model.types = [];

                    OneTeam.project2ContentTypes(self, true, function(contentTypeEntries) {

                        var selectedContentTypeDescriptor = null;

                        // select based on incoming qname, otherwise select first
                        var qname = model.tokens["qname"];
                        if (qname)
                        {
                            for (var i = 0; i < contentTypeEntries.length; i++)
                            {
                                if (contentTypeEntries[i].qname === qname)
                                {
                                    selectedContentTypeDescriptor = contentTypeEntries[i];
                                    break;
                                }
                            }
                        }

                        if (!selectedContentTypeDescriptor)
                        {
                            if (contentTypeEntries && contentTypeEntries.length > 0)
                            {
                                selectedContentTypeDescriptor = contentTypeEntries[0];
                            }
                        }

                        model.selectedContentTypeDescriptor = selectedContentTypeDescriptor;

                        // we set this here in case any dependent code needs this observable
                        // (such as the create content wizard which links from this page)
                        if (selectedContentTypeDescriptor)
                        {
                            self.observable("selected-content-type").set(selectedContentTypeDescriptor);
                        }

                        callback();

                    });
                });
            });
        }
    }));
});