module.exports = function(schema, doc) {

    var results;

    if (schema.type == 'object') {

        results = {};

        Object.keys(schema.properties).forEach(function(key) {
            if (doc[key] !== undefined) {
                var sp = schema.properties[key];
                if (sp.type == 'object') {
                    if (sp.hasOwnProperty('properties')) {
                        results[key] = this(sp, doc[key]);
                    } else {
                        if (Object.keys(doc[key]).length > 0) {
                            results[key] = doc[key];
                        }
                    }
                } else if (sp.type == 'array') {
                    if (doc[key]) {
                        results[key] = this(sp, doc[key]);
                    }
                } else if (sp.type == 'boolean' || sp.type == 'number' || sp.type == 'integer') {
                    if (doc[key] != null && typeof doc[key] != 'undefined') {
                        results[key] = doc[key];
                    }
                } else {
                    results[key] = doc[key];
                }
            }
        });
    } else if (schema.type == 'array') {
        if (schema.items.type == 'object') {
            results = [];
            doc.forEach(function(item) {
                results.push(this(schema.items, item));
            });
        } else {
            results = doc;
        }
    }

    return results;

}
