(function() {
  'use strict';

  var Camera, SceneElement, Slide, SlideGroup, addDocListener, addWinListener, attachPlugin, camera, css, defTransform, fireDocEvent, init, initListeners, initialized, memoize1, mosho, onEnterSlide, onLeaveSlide, perspective, pfx, root, transform3d, transformData, unHash, updateWinHash,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  memoize1 = function(fn) {
    var m;
    m = {};
    return function(a) {
      if (m[a] == null) {
        m[a] = fn(a);
      }
      return m[a];
    };
  };

  updateWinHash = function(tag) {
    var hash;
    hash = "#" + tag;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    window.scrollTo(0, 0);
    setTimeout((function() {
      return window.scrollTo(0, 0);
    }), 0);
  };

  addWinListener = function(evt, cb) {
    window.addEventListener(evt, cb);
  };

  addDocListener = function(evt, cb) {
    document.addEventListener(evt, cb);
  };

  fireDocEvent = function(evtName, detail) {
    var evt;
    if (detail == null) {
      detail = {};
    }
    evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(evtName, true, true, detail);
    document.dispatchEvent(evt);
  };

  unHash = function(str) {
    return str.replace(/^\#/, '');
  };

  pfx = (function() {
    var pres, style;
    style = document.createElement("dummy").style;
    pres = ["Webkit", "Moz", "O", "ms", "Khtml"];
    return memoize1(function(prop) {
      var props, uc, _i, _len;
      uc = prop.charAt(0).toUpperCase() + prop.slice(1);
      props = [prop].concat(pres.map(function(pre) {
        return "" + pre + uc;
      }));
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        if (style[prop] != null) {
          return prop;
        }
      }
    });
  })();

  css = function(el, props) {
    var key, pkey;
    if (props == null) {
      props = [];
    }
    for (key in props) {
      if (!(props.hasOwnProperty(key))) {
        continue;
      }
      pkey = pfx(key);
      el.style[pkey] = props[key];
    }
    return el;
  };

  perspective = function(p) {
    return " perspective(" + p + "px) ";
  };

  defTransform = {
    scale: 1,
    translate: {
      x: 0,
      y: 0,
      z: 0
    },
    rotate: {
      x: 0,
      y: 0,
      z: 0
    }
  };

  transform3d = function(_arg, rev) {
    var r, s, t;
    t = _arg.translate, r = _arg.rotate, s = _arg.scale;
    if (rev == null) {
      rev = false;
    }
    if (rev) {
      return ("scale(" + (1 / s) + ")") + (" rotateZ(" + (-r.z) + "deg) rotateY(" + (-r.y) + "deg) rotateX(" + (-r.x) + "deg)") + (" translate3d(" + (-t.x) + "px," + (-t.y) + "px," + (-t.z) + "px)");
    } else {
      return ("translate3d(" + t.x + "px," + t.y + "px," + t.z + "px)") + (" rotateX(" + r.x + "deg) rotateY(" + r.y + "deg) rotateZ(" + r.z + "deg)") + (" scale(" + s + ")");
    }
  };

  transformData = function(data, def) {
    var transform;
    if (def == null) {
      def = defTransform;
    }
    transform = {
      scale: Number(data.scale || 1) * def.scale,
      translate: {
        x: Number(data.x || 0) + def.translate.x,
        y: Number(data.y || 0) + def.translate.y,
        z: Number(data.z || 0) + def.translate.z
      },
      rotate: {
        x: Number(data.rotx || 0) + def.rotate.x,
        y: Number(data.roty || 0) + def.rotate.y,
        z: Number(data.rotz || 0) + def.rotate.z
      }
    };
    return transform;
  };

  initialized = false;

  root = null;

  camera = null;

  SceneElement = (function() {
    var byId, byOrder, n;

    n = 0;

    byId = {};

    byOrder = [];

    function SceneElement(el, parent) {
      this.el = el;
      this.parent = parent != null ? parent : null;
      this.data = this.el.dataset;
      this.transform = transformData(this.data);
      if (!this.el.id) {
        this.el.id = "mosho-element-" + n;
      }
      this.id = this.el.id;
      css(this.el, {
        position: 'absolute',
        display: 'block',
        transformStyle: 'preserve-3d'
      });
      this.updateCss();
      this.order = n++;
      byId[this.id] = this;
      byOrder.push(this);
      return;
    }

    SceneElement.prototype.show = function(t) {
      var e;
      if (t == null) {
        t = null;
      }
      if (typeof t === 'string' && ((e = this.getById(t)) != null)) {
        return e.show();
      } else {
        return false;
      }
    };

    SceneElement.prototype.getById = function(id) {
      return byId[id];
    };

    SceneElement.prototype.getByOrder = function(n, offset) {
      var max;
      if (offset == null) {
        offset = false;
      }
      max = byOrder.length - 1;
      if (offset) {
        n += this.order;
      }
      while (n > max) {
        n -= byOrder.length;
      }
      while (n < 0) {
        n += byOrder.length;
      }
      return byOrder[n];
    };

    SceneElement.prototype.getTransformList = function() {
      var transforms, _ref;
      transforms = [this.transform].concat(((_ref = this.parent) != null ? _ref.getTransformList() : void 0) || []);
      return transforms;
    };

    SceneElement.prototype.buildTotalTransform = function() {
      var t, transform, transforms;
      transforms = this.getTransformList();
      transform = {
        scale: 1,
        translate: {
          x: 0,
          y: 0,
          z: 0
        },
        rotate: {
          x: 0,
          y: 0,
          z: 0
        }
      };
      while ((t = transforms.shift()) != null) {
        transform.scale *= t.scale;
        transform.translate.x += t.translate.x;
        transform.translate.y += t.translate.y;
        transform.translate.z += t.translate.z;
        transform.rotate.x += t.rotate.x;
        transform.rotate.y += t.rotate.y;
        transform.rotate.z += t.rotate.z;
      }
      return transform;
    };

    SceneElement.prototype.buildCssTransform = function(camera) {
      if (camera == null) {
        camera = false;
      }
      return transform3d(this.buildTotalTransform(), camera);
    };

    SceneElement.prototype.updateCss = function() {
      return css(this.el, {
        transform: this.buildCssTransform()
      });
    };

    SceneElement.prototype.translate = function(x, y, z, abs) {
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (z == null) {
        z = 0;
      }
      if (abs == null) {
        abs = false;
      }
      if (abs) {
        this.transform.translate = {
          x: x,
          y: y,
          z: z
        };
      } else {
        this.transform.translate.x += x;
        this.transform.translate.y += y;
        this.transform.translate.z += z;
      }
      this.updateCss();
    };

    SceneElement.prototype.rotate = function(x, y, z, abs) {
      if (abs == null) {
        abs = false;
      }
      if (abs) {
        this.transform.rotate = {
          x: x,
          y: y,
          z: z
        };
      } else {
        this.transform.rotate.x += x;
        this.transform.rotate.y += y;
        this.transform.rotate.z += z;
      }
      this.updateCss();
    };

    SceneElement.prototype.scale = function(s, abs) {
      if (s == null) {
        s = 1;
      }
      if (abs == null) {
        abs = false;
      }
      if (abs) {
        this.transform.scale = s;
      } else {
        this.transform.scale *= s;
      }
      this.updateCss();
    };

    return SceneElement;

  })();

  SlideGroup = (function(_super) {

    __extends(SlideGroup, _super);

    function SlideGroup(el, parent) {
      var me;
      this.el = el;
      this.parent = parent != null ? parent : null;
      SlideGroup.__super__.constructor.call(this, this.el, this.parent);
      me = this;
      this.children = (function() {
        var _i, _len, _ref, _ref1, _ref2, _results;
        _ref = this.el.childNodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          el = _ref[_i];
          if (el != null ? (_ref1 = el.classList) != null ? _ref1.contains('mosho-slide') : void 0 : void 0) {
            _results.push(new Slide(el, me));
          } else if (el != null ? (_ref2 = el.classList) != null ? _ref2.contains('mosho-group') : void 0 : void 0) {
            _results.push(new SlideGroup(el, me));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }).call(this);
    }

    SlideGroup.prototype.updateCss = function() {};

    SlideGroup.prototype.show = function(t) {
      if (SlideGroup.__super__.show.call(this, t)) {
        return true;
      }
      return this.getByOrder(1, true).show();
    };

    return SlideGroup;

  })(SceneElement);

  Camera = (function(_super) {

    __extends(Camera, _super);

    function Camera(el) {
      this.el = el;
      Camera.__super__.constructor.call(this, this.el, null);
      css(this.el, {
        position: 'absolute',
        transformOrigin: "0% 0%",
        transformStyle: "preserve-3d"
      });
    }

    Camera.prototype.updateCss = function() {};

    return Camera;

  })(SlideGroup);

  Slide = (function(_super) {
    var active, n, slides;

    __extends(Slide, _super);

    active = null;

    slides = [];

    n = 0;

    function Slide(el, parent) {
      this.el = el;
      this.parent = parent != null ? parent : null;
      this.el.classList.add('mosho-inactive');
      this.slidesOrder = n++;
      slides.push(this);
      Slide.__super__.constructor.call(this, this.el, this.parent);
      this.updateCss();
    }

    Slide.prototype.show = function(t) {
      var prevSlide;
      if (Slide.__super__.show.call(this, t)) {
        return true;
      }
      if (this === this.getActiveSlide()) {
        return true;
      }
      prevSlide = this.getActiveSlide();
      fireDocEvent("mosho:enter:" + this.id);
      if (prevSlide != null) {
        fireDocEvent("mosho:leave:" + prevSlide.id);
      }
      fireDocEvent("mosho:pre-show", {
        prevSlide: prevSlide,
        nextSlide: this
      });
      active = this;
      updateWinHash(this.id);
      if (prevSlide != null) {
        prevSlide.el.classList.remove('mosho-active');
      }
      if (prevSlide != null) {
        prevSlide.el.classList.add('mosho-inactive');
      }
      this.el.classList.remove('mosho-inactive');
      this.el.classList.add('mosho-active');
      css(camera.el, {
        transform: this.buildCssTransform(true),
        transition: "all " + (this.data.transition || "1s ease")
      });
      fireDocEvent("mosho:post-show", {
        prevSlide: prevSlide,
        nextSlide: this
      });
      return true;
    };

    Slide.prototype.getActiveSlide = function() {
      return active;
    };

    Slide.prototype.getPrevSlide = function() {
      if (this.data.prev != null) {
        return this.getById(this.data.prev);
      } else {
        return slides[this.slidesOrder === 0 ? slides.length - 1 : this.slidesOrder - 1];
      }
    };

    Slide.prototype.getNextSlide = function() {
      if (this.data.next != null) {
        return this.getById(this.data.next);
      } else {
        return slides[this.slidesOrder === slides.length - 1 ? 0 : this.slidesOrder + 1];
      }
    };

    Slide.prototype.updateCss = function() {
      return css(this.el, {
        transform: 'translate(-50%,-50%) ' + this.buildCssTransform()
      });
    };

    return Slide;

  })(SceneElement);

  init = function() {
    if (initialized) {
      return;
    }
    fireDocEvent("mosho:pre-init");
    root = document.createElement('div');
    root.id = 'mosho-container';
    css(document.body, {
      height: '100%',
      overflow: 'hidden'
    });
    css(root, {
      position: "absolute",
      transformOrigin: "0% 0%",
      transition: "all 0s ease-in-out",
      top: "50%",
      left: "50%",
      transform: perspective(4000),
      transformStyle: "preserve-3d"
    });
    camera = document.getElementById('mosho');
    camera.id = 'mosho-camera';
    camera = new Camera(camera);
    document.body.appendChild(root);
    root.appendChild(camera.el);
    if (!camera.show(unHash(window.location.hash))) {
      camera.getByOrder(0).show();
    }
    initListeners();
    initialized = true;
    fireDocEvent("mosho:post-init");
  };

  initListeners = function() {
    addWinListener('hashchange', function() {
      return Slide.prototype.getById(unHash(window.location.hash)).show();
    });
    addDocListener('keydown', function(e) {
      switch (e.keyCode) {
        case 37:
        case 38:
        case 9:
        case 32:
        case 39:
        case 40:
          e.preventDefault();
      }
    });
    addDocListener('keyup', function(e) {
      switch (e.keyCode) {
        case 37:
        case 38:
          mosho.prev();
          return e.preventDefault();
        case 9:
        case 32:
        case 39:
        case 40:
          mosho.next();
          return e.preventDefault();
      }
    });
  };

  onEnterSlide = function(id, cb) {
    addDocListener("mosho:enter:" + id, cb);
  };

  onLeaveSlide = function(id, cb) {
    addDocListener("mosho:leave:" + id, cb);
  };

  attachPlugin = function(plug) {
    var _ref;
    if ((_ref = plug.name) == null) {
      plug.name = "Anonymous Plugin";
    }
    if (initialized) {
      console.warn("plugin '" + plug.name + "' attached after Mosho.init()");
    }
    if (typeof plug.preJump === 'function') {
      addDocListener("mosho:pre-init", plug.preinit);
    }
    if (typeof plug.postInit === 'function') {
      addDocListener("mosho:post-init", plug.postInit);
    }
    if (typeof plug.preShow === 'function') {
      addDocListener("mosho:pre-show", plug.preShow);
    }
    if (typeof plug.postShow === 'function') {
      addDocListener("mosho:post-show", plug.postShow);
    }
  };

  mosho = window.mosho = {
    init: init,
    prev: function() {
      return Slide.prototype.getActiveSlide().getPrevSlide().show();
    },
    next: function() {
      return Slide.prototype.getActiveSlide().getNextSlide().show();
    },
    show: function(id) {
      return SceneElement.prototype.getById(id).show();
    },
    getElement: function(id) {
      if (id != null) {
        return SceneElement.prototype.getById(id);
      } else {
        return Slide.prototype.getActiveSlide();
      }
    },
    enter: onEnterSlide,
    leave: onLeaveSlide,
    plugin: attachPlugin
  };

}).call(this);
