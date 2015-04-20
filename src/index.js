// Generated by CoffeeScript 1.3.1
(function () {
  var Icon, Layer;

  Icon = L.Icon.extend({
    options: {
      popupAnchor: new L.Point(0, -25)
    },
    initialize: function (options) {
      return L.Util.setOptions(this, options);
    },
    createIcon: function () {
      var div, span;
      div = document.createElement('div');
      div.className = 'leaflet-marker-icon weather-icon';
      div.style['padding'] = "" + this.options.textOffset + "px 0px 0px 0px";
      div.style['backgroundImage'] = "url(" + this.options.image + ")";
      div.style['backgroundColor'] = this.options.tempColor1;
      span = document.createElement('span');
      span.innerHTML = this.options.text;
      span.style['backgroundColor'] = this.options.tempColor2;
      div.appendChild(span);
      return div;
    },
    createShadow: function () {
      return null;
    }
  });

  Layer = L.Class.extend({
    colorHelpControl: null,
    includes: L.Mixin.Events,
    options: {
      lang: 'en',
      legend: false,
      clusterWidth: 150,
      clusterHeight: 150,
      type: 'city',
      temperatureDigits: 2,
      popup: false,
      popupHTML: null,
      translation: {
        currentTemperature: "Temperature",
        maximumTemperature: "Max. temp",
        minimumTemperature: "Min. temp",
        humidity: "Humidity",
        wind: "Wind",
        show: "Snow",
        snow_possible: "Snow possible",
        rain: "Rain",
        rain_possible: "Rain possible",
        icerain: "Ice rain",
        rime: "Rime",
        rime_possible: "Rime",
        clear: "Clear",
        wind_ms: "m/s"
      }
    },
    initialize: function (options) {
      $.extend(this.options, options);
      this.layer = new L.LayerGroup();
      this.sourceUrl = "http://api.openweathermap.org/data/2.5/box/{type}?APPID=06aac0fd4ba239a20d824ef89602f311&lang={lang}&cnt=300&format=json&units=metric&bbox={minlon},{minlat},{maxlon},{maxlat},10";
      this.sourceRequests = {};
      this.clusterWidth = this.options.clusterWidth;
      this.clusterHeight = this.options.clusterHeight;
      this.type = this.options.type;
      this.i18n = this.options.translation;
      this.temperatureDigits = this.options.temperatureDigits;
      this.popup = (this.options.popup === true);
    },
    onAdd: function (map) {
      this.map = map;
      this.map.addLayer(this.layer);
      this.map.on('moveend', this.update, this);

      if(this.options.legend) {
        this.addColorHelpControl();
      }

      this.update();
      this.fireEvent('added');
    },
    onRemove: function (map) {
      if (this.map !== map) {
        return;
      }
      this.map.off('moveend', this.update, this);
      this.map.removeLayer(this.layer);
      if(this.colorHelpControl) {
        this.map.removeControl(this.colorHelpControl);
      }
      this.fireEvent('removed');
      return this.map = void 0;
    },
    addColorHelpControl: function () {
      var self = this, container;
      var Control = L.Control.extend({
        options: {
          position: 'bottomleft'
        },
        onAdd: function () {
          container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-color-help');
          var div = L.DomUtil.create('div', 'main');

          container.appendChild(div);
          var i = 30;
          while (i > -30) {
            var _div = L.DomUtil.create('div', 'color');
            _div.style['backgroundColor'] = self.weatherColor(i);
            _div.setAttribute('title', i + ' °C');
            div.appendChild(_div);
            i = i - 2;
          }

          return container;
        }
      });
      this.colorHelpControl = new Control();
      this.map.addControl(this.colorHelpControl);
      this.fireEvent('helpColorAdded', {container: container});
    },
    getAttribution: function () {
      return 'Weather data provided by <a href="http://openweathermap.org/">OpenWeatherMap</a>.';
    },
    update: function () {
      var req, url, _ref;
      _ref = this.sourceRequests;
      for (url in _ref) {
        if (_ref.hasOwnProperty(url)) {
          req = _ref[url];
        }
      }
      this.sourceRequests = {};
      this.updateType(this.type);
    },
    updateType: function (type) {
      var bounds, ne, sw, url,
        _this = this;
      bounds = this.map.getBounds();
      sw = bounds.getSouthWest();
      ne = bounds.getNorthEast();
      url = this.sourceUrl
        .replace('{type}', type)
        .replace('{minlat}', sw.lat)
        .replace('{maxlat}', ne.lat)
        .replace('{minlon}', sw.lng)
        .replace('{maxlon}', ne.lng)
        .replace('{lang}', _this.options.lang);
      return this.sourceRequests[type] = Layer.Utils.requestJsonp(url, function (data) {
        var cells, key, ll, p, st, _i, _len, _ref;
        delete _this.sourceRequests[type];
        if(!_this.map) {
          return;
        }
        _this.map.removeLayer(_this.layer);
        _this.layer.clearLayers();
        cells = {};
        _ref = data.list;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          st = _ref[_i];
          if (st.coord && st.coord.lat && st.coord.lon) {
            ll = new L.LatLng(st.coord.lat, st.coord.lon);
            p = _this.map.latLngToLayerPoint(ll);
            key = "" + (Math.round(p.x / _this.clusterWidth)) + "_" + (Math.round(p.y / _this.clusterHeight));
            if (!cells[key] || parseInt(cells[key].rang) < parseInt(st.rang)) {
              cells[key] = st;
            }
          }
        }
        for (key in cells) {
          st = cells[key];
          ll = new L.LatLng(st.coord.lat, st.coord.lon);
          _this.addMarker(st, ll);
        }
        _this.map.addLayer(_this.layer);
      });
    },
    addMarker: function (st, ll) {
      this.layer.addLayer(this.buildMarker(st, ll));
    },
    buildMarker: function (st, ll) {
      var marker, markerIcon, typeIcon, weatherIcon, weatherText;
      weatherText = this.weatherText(st);
      //weatherIcon = this.weatherIcon(st);
      weatherIcon = 'http://openweathermap.org/img/w/{icon}.png'.replace('{icon}', st.weather[0].icon);
      typeIcon = this.typeIcon(st);
      var temp = st.main.temp.toFixed(1);
      markerIcon = typeIcon ? new Icon({
        image: typeIcon,
        text: "" + temp + "&nbsp;°C",
        textOffset: 30
      }) : new Icon({
        image: weatherIcon,
        text: "" + temp + "&nbsp;°C",
        textOffset: 35
      });
      markerIcon.options.tempColor1 = this.weatherColor(temp, 0.5);
      markerIcon.options.tempColor2 = this.weatherColor(temp);

      marker = new L.Marker(ll, {
        icon: markerIcon
      });

      this.setPopup(marker, weatherText, weatherIcon, st);

      return marker;
    },
    setPopup: function (marker, weatherText, weatherIcon, st) {
      if (!this.popup) {
        return;
      }

      var popupContent;

      if (this.options.popupHTML instanceof Function) {
        popupContent = this.options.popupHTML.call(null, st);
      } else if (this.options.popupHTML instanceof String) {
        popupContent = this.options.popupHTML;
      } else {
        popupContent = "<div class=\"weather-place\">";
        popupContent += "<img height=\"38\" width=\"45\" style=\"border: none; float: right;\" alt=\"{weatherText}\" src=\"{weatherIcon}\" />";
        popupContent += "<h3>{name}</h3>";
        popupContent += "<p>{weatherText}</p>";
        popupContent += "<p>";
        popupContent += "{currentTemperature}:&nbsp;{temp}&nbsp;°C<br />";
        if (st.main.temp_max) {
          popupContent += "{maximumTemperature}:&nbsp;{temp_max}&nbsp;°C<br />";
        }
        if (st.main.temp_min) {
          popupContent += "{minimumTemperature}:&nbsp;{temp_min}&nbsp;°C<br />";
        }
        popupContent += "{humidity}:&nbsp;{humidity_val}%<br />";
        popupContent += "{wind}:&nbsp;{wind_val}&nbsp;{m_s}<br />";
        popupContent += "</p>";
        popupContent += "</div>";
      }

      popupContent = popupContent.replace('{name}', st.name)
        .replace('{weatherIcon}', weatherIcon)
        .replace(/{weatherText}/g, weatherText)
        .replace('{currentTemperature}', this.i18n.currentTemperature)
        .replace('{temp}', st.main.temp.toFixed(1))
        .replace('{maximumTemperature}', this.i18n.maximumTemperature)
        .replace('{temp_max}', st.main.temp_max.toFixed(1))
        .replace('{minimumTemperature}', this.i18n.minimumTemperature)
        .replace('{temp_min}', st.main.temp_min.toFixed(1))
        .replace('{humidity}', this.i18n.humidity)
        .replace('{humidity_val}', st.main.humidity)
        .replace('{wind}', this.i18n.wind)
        .replace('{wind_val}', st.wind.speed)
        .replace('{m_s}', this.i18n.wind_ms);
      marker.bindPopup(popupContent);
    },
    weatherColor: function (t, opacity) {
      t = (t < -30) ? -30 : t;
      t = (t > 30) ? 30 : t;
      var hue = 30 + 240 * (30 - t) / 60;
      if (opacity) {
        return 'hsla(' + [hue, '70%', '50%', opacity] + ')';
      } else {
        return 'hsl(' + [hue, '70%', '50%'] + ')';
      }
    },
    weatherIcon: function (st) {
      var cl, day, i, img, _i, _len, _ref;
      day = this.dayTime(st);
      cl = st.cloud;
      img = 'transparent';
      if (cl < 25 && cl >= 0) {
        img = '01' + day;
      }
      if (cl < 50 && cl >= 25) {
        img = '02' + day;
      }
      if (cl < 75 && cl >= 50) {
        img = '03' + day;
      }
      if (cl >= 75) {
        img = '04';
      }
      if (st.prsp_type === '1' && st.prcp > 0) {
        img = '13';
      }
      if (st.prsp_type === '4' && st.prcp > 0) {
        img = '09';
      }
      _ref = ['23', '24', '26', '27', '28', '29', '33', '38', '42'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (st.prsp_type === i) {
          img = '09';
        }
      }
      return "http://openweathermap.org/images/icons60/" + img + ".png";
    },
    typeIcon: function (st) {
      if (st.datatype === 'station') {
        if (st.type === '1') {
          return "http://openweathermap.org/images/list-icon-3.png";
        } else if (st.type === '2') {
          return "http://openweathermap.org/images/list-icon-2.png";
        }
      }
    },
    weatherText: function (st) {
      var i18n = this.i18n;
      if (st.weather[0]) {
        var rslt = i18n['c' + st.weather[0].id];
        if (!rslt) {
          rslt = i18n.clear;
        }
        return rslt;
      } else {
        return i18n.clear;
      }
    },
    dayTime: function (st) {
      var dt, times;
      if (typeof SunCalc === "undefined" || SunCalc === null) {
        return 'd';
      }
      dt = new Date();
      times = SunCalc.getTimes(dt, st.lat, st.lng);
      if (dt > times.sunrise && dt < times.sunset) {
        return 'd';
      } else {
        return 'n';
      }
    },
    toCelc: function (t) {
      var p;
      p = Math.pow(10, this.temperatureDigits);
      return Math.round((t - 273.15) * p) / p;
    }
  });

  Layer.Utils = {
    callbacks: {},
    callbackCounter: 0,
    requestJsonp: function (url, cb) {
      var abort, callback, counter, delim,
        _this = this;

      counter = (this.callbackCounter += 1);
      callback = "L.Weather.Layer.Utils.callbacks[" + counter + "]";
      this.callbacks[counter] = function (data) {
        delete _this.callbacks[counter];
        return cb(data);
      };
      delim = url.indexOf('?') >= 0 ? '&' : '?';
      $.getScript(url + delim + "callback=" + callback).fail(function () {
        console.error('leaflet-weather-layer: check jsonp format');
      });
    }
  };


  if (!L.Weather) {
    L.Weather = {};
  }

  L.Weather.Layer = Layer;

}).call(this);