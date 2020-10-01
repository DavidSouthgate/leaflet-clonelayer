function cloneOptions (options) {
    var ret = {};
    for (var i in options) {
        var item = options[i];
        if (item && item.clone) {
            ret[i] = item.clone();
        } else if (item instanceof L.Layer) {
            ret[i] = cloneLayer(item);
        } else {
            ret[i] = item;
        }
    }
    return ret;
}

function cloneInnerLayers (layer) {
    var layers = [];
    layer.eachLayer(function (inner) {
        layers.push(cloneLayer(inner));
    });
    return layers;
}

function cloneLayer (layer) {
    var options = cloneOptions(layer.options);

    // we need to test for the most specific class first, i.e.
    // Circle before CircleMarker

    // Renderers
    if (layer instanceof L.SVG) {
        return L.svg(options);
    }
    if (layer instanceof L.Canvas) {
        return L.canvas(options);
    }

    // GoogleMutant GridLayer
    if (L.GridLayer.GoogleMutant && layer instanceof L.GridLayer.GoogleMutant) {
        var googleLayer = L.gridLayer.googleMutant(options);

        layer._GAPIPromise.then(function () {
            var subLayers = Object.keys(layer._subLayers);

            for (var i in subLayers) {
                googleLayer.addGoogleLayer(subLayers[i]);
            }
        });

        return googleLayer;
    }

    // Tile layers
    if (layer instanceof L.TileLayer.WMS) {
        return L.tileLayer.wms(layer._url, options);
    }
    if (layer instanceof L.TileLayer) {
        return L.tileLayer(layer._url, options);
    }
    if (layer instanceof L.ImageOverlay) {
        return L.imageOverlay(layer._url, layer._bounds, options);
    }

    // Marker layers
    let newLayer = null;

    if (layer instanceof L.Marker) {
        newLayer = L.marker(layer.getLatLng(), options);
    }
    else if (layer instanceof L.Circle) {
        newLayer = L.circle(layer.getLatLng(), layer.getRadius(), options);
    }
    else if (layer instanceof L.CircleMarker) {
        newLayer = L.circleMarker(layer.getLatLng(), options);
    }
    else if (layer instanceof L.Rectangle) {
        newLayer = L.rectangle(layer.getBounds(), options);
    }
    else if (layer instanceof L.Polygon) {
        newLayer = L.polygon(layer.getLatLngs(), options);
    }
    else if (layer instanceof L.Polyline) {
        newLayer = L.polyline(layer.getLatLngs(), options);
    }
    else if (layer instanceof L.GeoJSON) {
        newLayer = L.geoJson(layer.toGeoJSON(), options);
    }
    else if (layer instanceof L.FeatureGroup) {
        newLayer = L.featureGroup(cloneInnerLayers(layer));
    }
    else if (layer instanceof L.LayerGroup) {
        newLayer = L.layerGroup(cloneInnerLayers(layer));
    }

    if(newLayer !== null) {
        if(layer._popup) {
            newLayer.bindPopup(layer._popup);
        }
        return newLayer;
    }

    throw 'Unknown layer, cannot clone this layer. Leaflet-version: ' + L.version;
}

export default cloneLayer;
