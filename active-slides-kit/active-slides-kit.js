/*!
 * active-slides-kit.js
 * https://github.com/martinruenz/active-content-tools
 * Version: 1.0.0
 *
 * This file is part of https://github.com/martinruenz/active-content-tools
 * Copyright (c) 2017 Martin Rünz.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

 /* TODO This file was written quickly and needs a clean-up! */

jQuery.fn.cleanWhitespace = function() {
  textNodes = this.contents().filter(function() {
    return (this.nodeType == 3 && !/\S/.test(this.nodeValue));
  }).remove();
  return this;
}

let ActiveSlidesKit = {};

// Generate unique ids
ActiveSlidesKit.id_cnt = 0;
ActiveSlidesKit.getUniqueId = function() {
  ActiveSlidesKit.id_cnt += 1;
  return ActiveSlidesKit.id_cnt;
}

// Wasnt robust
// ActiveSlidesKit.getAbsolutePosition = function(e, subtract_margins = false) {
//   // Here, the commented code is not needed, due to 'viewDistance: 999'.
//   // if this is not viable, make this function work in more general cases (TODO)
//   // let toggleList;
//   // if(!e.is(":visible")) {
//   //   toggleList = e.parents().filter((i,el) => $(el).css('display') == 'none');
//   // };
//   // console.log(toggleList);
//   // if(toggleList) toggleList.each((i,el) => el.show()); untested
//   let oe = e.offset();
//   if(!e.parent()) return null;
//   let op = e.parent().offset();
//   if(subtract_margins){
//     oe.left -= parseFloat(e.css("marginLeft"));
//     oe.top -= parseFloat(e.css("marginTop"));
//   }
//   //console.log(oe);
//   //console.log(op);
//   //if(toggleList) toggleList.each((i,el) => el.hide());
//   return {
//     left: oe.left - op.left,
//     top: oe.top - op.top
//   };
// }

ActiveSlidesKit.backupDimensions = function(e) {
  if (e.data("initial-width") && e.data("initial-height")) return;
  console.log(e.prop("tagName"),e.width(),e.height());
  e.data("initial-width", e.width());
  e.data("initial-height", e.height());
  // let abs = ActiveSlidesKit.getAbsolutePosition(e);
  // if(abs){
  //   e.data("initial-absolute-top", abs.top);
  //   e.data("initial-absolute-left", abs.left);
  // }
  //console.log('Set:',e.data("initial-absolute-left"),e.data("initial-absolute-top"),e.data("initial-width"),e.data("initial-height"));
  // Make sure SVGs setup a viewbox (could cause problems? TODO)
  if (e.attr("type") == "image/svg+xml") {
    //let svg = e.get(0).contentDocument.getElementsByTagName("svg")[0];
    ActiveSlidesKit.setSVGViewbox(e.get(0), e.data("initial-width"), e.data("initial-height"), false);
  }
}

ActiveSlidesKit.preprocessTags = function(){

  // ///////////////////////// ask-pherow-box
  /*
  // 2x2 Example input:
  <ask-pherow-box>
    <video class="appear-full" loop nocontrols><source src="v1.mp4" type="video/mp4"/></video>
    <video class="appear-full" loop nocontrols><source src="v2.mp4" type="video/mp4"/></video>
    <video class="appear-full" loop nocontrols><source src="v3.mp4" type="video/mp4"/></video>
    <video class="appear-full" loop nocontrols><source src="v4.mp4" type="video/mp4"/></video>
  </ask-pherow-box>
  // 2x2 Example output HTML:
  <div class="cells pherow-box">
      <div class="cell d-100-50" style="display:flex;align-items: flex-end;">
        <div class="pherow">
          <video class="appear-full" loop nocontrols><source src="v1.mp4" type="video/mp4"/></video>
          <video class="appear-full" loop nocontrols><source src="v2.mp4" type="video/mp4"/></video>
        </div>
      </div>
      <div class="cell d-100-50">
        <div class="pherow">
          <video class="appear-full" loop nocontrols><source src="v3.mp4" type="video/mp4"/></video>
          <video class="appear-full" loop nocontrols><source src="v4.mp4" type="video/mp4"/></video>
        </div>
      </div>
  </div>
  */
  $("ask-pherow-box").each((i,el) => {
    let e = $(el);
    let items = e.children();
    let n = items.length;
    let n_cols = Math.ceil(Math.sqrt(n));
    let n_rows = Math.ceil(n / n_cols);

    if(n_cols == 0) {
      e.remove();
      console.warn("Empty ask-pherow-box was removed.");
      return;
    }

    // Build container
    let container = $(`<div class="cells pherow-box"></div>`);

    // Build rows
    // TODO Is there a smarter way to deduct the row height? Assuming equal sizes is not optimal.
    for (i = 0; i < n_rows; i++)
      container.append($(`<div class="cell" style="width:100%;height:${100/n_rows}%"><div class="pherow"></div></div>`));
    rows = container.children();
    rows.first().css({display:"flex",alignItems:"flex-end"});

    // Insert items
    items.each((i,elem) => {
      //console.log(i,Math.floor(i / n_cols),rows.eq(Math.floor(i / n_cols)));
      rows.eq(Math.floor(i / n_cols)).children().first().append($(elem));
    });

    e.replaceWith(container);
  });
  // ///////////////////////// /////////////////////////

  // ///////////////////////// ask-video-box4
  /*
  <ask-caption-box>
    <video caption="mytest1" class="appear-full" loop nocontrols><source src="v1.mp4" type="video/mp4"/></video>
    <video caption="mytest2" class="appear-full" loop nocontrols><source src="v2.mp4" type="video/mp4"/></video>
    <video caption="mytest3" class="appear-full" loop nocontrols><source src="v3.mp4" type="video/mp4"/></video>
    <video caption="mytest4" class="appear-full" loop nocontrols><source src="v4.mp4" type="video/mp4"/></video>
  </ask-caption-box>
  // 2x2 Example output HTML:
  <div class="cells">
  <div class="cell d-50-50" style="position:relative">
    <div style="height:100%;width:100%;display:flex;flex-flow:column;justify-content:flex-end;">
      <video style="align-self:flex-end;" class="appear-full fragment" loop nocontrols><source src="v1.mp4" type="video/mp4"/></video>
      <div class="fragment">TEXT</div>
    </div>
  </div>
  <div class="cell d-50-50">
    <div style="height:100%;width:100%;display:flex;flex-flow:column;justify-content:flex-end;">
      <video style="align-self:flex-start;" class="appear-full fragment" loop nocontrols><source src="v2.mp4" type="video/mp4"/></video>
      <div class="fragment">TEXT</div>
    </div>
  </div>
  <div class="cell d-50-50">
    <div style="height:100%;width:100%;display:flex;flex-flow:column;">
      <video style="align-self:flex-end;" class="appear-full fragment" loop nocontrols><source src="v3.mp4" type="video/mp4"/></video>
      <div class="fragment">TEXT</div>
    </div>
  </div>
  <div class="cell d-50-50">
    <div style="height:100%;width:100%;display:flex;flex-flow:column;">
      <video class="appear-full fragment" loop nocontrols><source src="v4.mp4" type="video/mp4"/></video>
      <div class="fragment">TEXT</div>
    </div>
  </div>
  </div>
  */
  $("ask-caption-box").each((i,el) => {
    let e = $(el);
    let items = e.children();
    let n = items.length;
    let n_cols = Math.ceil(Math.sqrt(n));
    let n_rows = Math.ceil(n / n_cols);
    let do_fragments = e.attr("nofragments") === undefined;

    if(n_cols == 0) {
      e.remove();
      console.warn("Empty ask-caption-box was removed.");
      return;
    }
    let i_width = 100 / n_cols;
    let i_height = 100 / n_rows;

    // Build container
    let container = $(`<div class="cells ask-caption-box"></div>`);

    // Build rows
    // TODO Is there a smarter way to deduct the row height? Assuming equal sizes is not optimal.
    // for (i = 0; i < n_rows; i++)
    //   container.append($(`<div class="cell" style="width:100%;height:${100/n_rows}%"><div class="pherow"></div></div>`));
    // rows = container.children();
    // rows.first().css({display:"flex",alignItems:"flex-end"});

    // Insert items
    items.each((i,elem) => {
      let ele = $(elem)
      let r = Math.floor(i / n_cols);
      let c = i % n_cols;
      let w1 = $(`<div class="cell" style="height:${i_height}%;width:${i_width}%"></div>`)
      let w2 = $(`<div class="flex-wrapper ${do_fragments ? ' fragment' : ''}" style="
                  ${r==0 ? 'justify-content:flex-end;' : ''}
                  ${c==0 ? 'object-position:100% 100%;' : 'object-position:0 0;'}
                  "></div>`)
      ele.css({alignSelf: c == 0 ? "flex-end" : "flex-start"});
      w2.append(ele)
      if (ele.attr("caption")) w2.append($(`<div class="ask-caption">${ele.attr("caption")}</div>`))
      w1.append(w2);
      container.append(w1);
    });

    e.replaceWith(container);
  });
  // ///////////////////////// /////////////////////////
}

// HACK, css-based solution would be much nicer
ActiveSlidesKit.repositionLabels = function() {
  $(".ask-caption").each((i, elem) => {
    let e = $(elem);
    let target = $(e.parent().children()[0]);
    let ot = target.offset();
    let oe = e.offset();
    //console.log("target", target, "ot", ot, "oe", oe);
    e.css({
      transform: `translate(${ot.left - oe.left + 10}px,0px)`
    })
  });
}

ActiveSlidesKit.initialise = function() {

  ActiveSlidesKit.preprocessTags();

  // ///////////////////////// Cells Initialisation Subtract headings from 100% via padding
  $(".cell").has("h2").addClass('cell-h2-padding');

  // .max-prop-size class elements and children of .pherow are dynamically sized -- backup original dimensions

  // ///////////////////////// Cell interaction Activate / deactivate a cell (hover):
  // Show / hide 'gHover' elements in SVGs
  $(".hover-cells > .cell").each((i, c) => {
    $(c).find("object").each((i, o) => {
      ActiveSlidesKit.setSVGStyle(o, "gHover", "opacity:0;");
    });
  });
  // * Start / stop videos automatically
  // * Show / hide gHover IDs in svgs
  $(".hover-cells > .cell").hover((e) => {
    $(e.currentTarget).find("video").each((i, v) => {
      v.play();
    });
    $(e.currentTarget).find("object").each((i, o) => {
      ActiveSlidesKit.setSVGStyle(o, "gHover", "transition: opacity 0.2s linear;opacity:1;");
    });
  }, (e) => {
    $(e.currentTarget).find("video").each((i, v) => {
      v.pause();
      /*console.log("stop: ", i, v);*/
    });
    $(e.currentTarget).find("object").each((i, o) => {
      ActiveSlidesKit.setSVGStyle(o, "gHover", "transition: opacity 0.2s linear;opacity:0;");
      // console.log(c.contentDocument);
    });
  });

  Reveal.addEventListener('slidechanged', function(event) {
    //event.previousSlide, event.currentSlide
    //console.log(event.currentSlide.hasAttribute("playvideos"));
    if(event.currentSlide.hasAttribute("playvideos")){
      $(event.currentSlide).find("video").each((i, v) => { v.play(); });
    }
  });

  // ///////////////////////// Layout enable proportionally height-equalised row (pherow)
  // Do this before updateMaxProp(), as these could be part of a max-prop
  $(".pherow").each((i, row) => {
    $(row).children().each((i, el) => ActiveSlidesKit.backupDimensions($(el)));
  });
  function updatePherow() {
    // console.log(" --- updatePherow ---");
    $(".pherow").each((i, row) => {
      let r = $(row);
      let r_w = r.width();
      //console.log("r_w", r_w);
      let c = r.children();
      let s = {};
      let w = 0; // sum width at height==100
      let w_f = 0; // sum fixed-width elements (margins, arrows, ...)
      let num_arrows = 0;
      c.each((i, el) => {
        let e = $(el);
        console.log(e.css("position"))
        if(e.css("position") == "absolute") { console.log("ignore"); return; }; // TODO more elegant
        //console.log("tag",e.prop("tagName"));
        // Set display mode to 'inline-block', so that margins do not collapse
        e.css({display: "inline-block"});
        if (e.hasClass("arrow")) { // TODO Be more general "pherowFixed='5'" attribute
          let fw = 0.05 * r_w;
          e.width(fw);
          w_f += fw;
          return;
        }
        w_f += parseFloat(e.css("marginLeft")) + parseFloat(e.css("marginRight"));
        // pretend to scale each element to the height 100
        let s100 = 100 / e.data("initial-height");
        s[i] = s100;
        w += s100 * e.data("initial-width");
      });
      let f = 0.98 * (r_w-w_f) / w; // Scaling factor, considering non-fixed width
      // Avoid height-overflow:
      if (f * 100 > r.parent().height()){
        f = r.parent().height() / 100;
        // console.log("row limited");
      }
      // let TEST = 0;
      // let TEST_M = 0;
      c.each((i, el) => {
        let e = $(el);
        if (e.hasClass("arrow")) return;
        if(e.css("position") == "absolute") { console.log("ignore"); return; } // TODO more elegant
        e.width(e.data("initial-width") * f * s[i]);
        e.height(e.data("initial-height") * f * s[i]);
        // e.css("width", (100 * e.data("initial-width") * f * s[i] / r_w + "%"));
        // e.css("height", (100 * e.data("initial-height") * f * s[i] / r.height() + "%"));

        // TEST += e.width();
        // TEST_M += e.width() + parseFloat(e.css("marginLeft")) + parseFloat(e.css("marginRight"));
      });
      //console.log("ADDED", TEST,"ADDED_M", TEST_M);
      r.cleanWhitespace();
    });
  }
  updatePherow();

  function getMaxProportionalFit(maxw, maxh, w, h) {
    let r = maxw / w;
    if (h * r > maxh)
      r = maxh / h;
    return {
      width: w * r,
      height: h * r
    };
  }

  // Enable elements that proportionally take max space
  $(".max-prop-size").each((i, el) => ActiveSlidesKit.backupDimensions($(el)));
  function updateMaxProp() {
    $(".max-prop-size").each((i, elem) => {
      let e = $(elem);
      let p = e.parent();
      //console.log("iw",e.data("initial-width"));
      //console.log("p-display",p.css("display"));

      fit = getMaxProportionalFit(
        p.width()-(parseFloat(e.css("marginLeft"))+parseFloat(e.css("marginRight")))-(parseFloat(p.css("paddingLeft"))+parseFloat(p.css("paddingRight"))),
        p.height()-(parseFloat(e.css("marginTop"))+parseFloat(e.css("marginBottom")))-(parseFloat(p.css("paddingTop"))+parseFloat(p.css("paddingBottom"))),
        e.data("initial-width"),
        e.data("initial-height"));

      //console.log("fit",fit);
      //console.log(e.attr("type"));
      //if(e.attr("type") == "image/svg+xml") ActiveSlidesKit.setSVGViewbox(elem,fit.width,fit.height);
      e.width(fit.width);
      e.height(fit.height);
      //console.log("p-marg",
      //  p.width()-(parseFloat(e.css("marginLeft"))+parseFloat(e.css("marginRight")))-(parseFloat(p.css("paddingLeft"))+parseFloat(p.css("paddingRight"))),
      //  p.height()-(parseFloat(e.css("marginTop"))+parseFloat(e.css("marginBottom")))-(parseFloat(p.css("paddingTop"))+parseFloat(p.css("paddingBottom"))));
      //console.log("parent:",p.width(),p.height());
      //console.log("max:",e.width(),e.height());
    });
  }
  updateMaxProp();

  $(window).resize(function() {
    updatePherow();
    updateMaxProp();
  });

  // Enable special effects
  function setupEffectClasses() {

    Reveal.addEventListener('fragmentshown', function(event) {
      //console.log(event.fragment);
      let e = $(event.fragment);
      // Appear full (either direct, or children that are not part of another fragment)
      if (e.hasClass("appear-full")) showAppearFullElement(event.fragment);
      e.children(".appear-full").each((i, elem) => {
        let el = $(elem);
        let f = el.closest(".fragment");
        if (f != e) showAppearFullElement(elem);
      });
      // .. all appear children ..
      // .. closest fragment == this -> yes / no
      // Show SVG animations
      e.find("object").addBack("object").each((i, elem) => {
        if ($(elem).attr("type") == "image/svg+xml")
          ActiveSlidesKit.startSVGAnimations(elem);
      });
      // Play videos
      e.find("video").addBack("video").each((i, elem) => {
        elem.play();
      });
    });
  }
  setupEffectClasses();

  function showAppearFullElement(elem, start = 4000, duration = 1) {

    let e = $(elem);
    let sec = e.closest("section");
    let sw = sec.width();
    let sh = sec.height();
    let ew = e.width()
    let eh = e.height()
    let hw = e.width();
    let hh = e.height();

    if (e.is("img")) {
      hw = e.prop('naturalWidth');
      hh = e.prop('naturalHeight');
    } else if (e.is("video")) {
      hw = e.prop('videoWidth');
      hh = e.prop('videoHeight');
      e.get(0).play();
    }

    //if (hw > sw || hh > sh) {
      fit = getMaxProportionalFit(sw, 0.8*sh, hw, hh);
      hw = fit.width;
      hh = fit.height;
    //}

    let scalex = hw / ew;
    let scaley = hh / eh;

    if (scalex > 1.005*scaley || scaley > 1.005*scalex){
      console.warn("Tried unequal scaling: ", scalex,scaley);
      scalex = scaley;
    }
    let oe = e.offset();
    let os = sec.offset();

    e.css({
      transform: `translate(${os.left + 0.5*sw - (oe.left + 0.5*ew)}px,${os.top + 0.5*sh - (oe.top + 0.5*eh)}px) scale(${scalex},${scaley})`
    })

    setTimeout(function() {
      e.css({ transform: `scale(1,1)` });
    }, start);
  }

  ActiveSlidesKit.repositionLabels();
}

ActiveSlidesKit.getSVGContent = function(obj) {
  let e = $(obj);
  if (e.attr("type") != "image/svg+xml")
    return null;
  if (!obj.contentDocument)
    return null;
  if (!(obj.contentDocument.getElementsByTagName("svg")[0]))
    return null;
  return obj.contentDocument;
}

ActiveSlidesKit.startSVGAnimations = function(obj) {
  console.log("Start Animation");

  // Method 1: Reload svg
  var cloneElement = obj.cloneNode(true);
  obj.parentNode.replaceChild(cloneElement, obj);
  e = $(cloneElement);
  setTimeout(function() {
    ActiveSlidesKit.backupDimensions(e);
  }, 30); // TODO SOOoo hacky

  // Method 2: Invoke animations manually, (not finished, TODO remove?)
  // console.log("YOYOYO");
  // doc = obj.contentDocument;
  // if (doc == null) return;
  // console.log("YOYOYO2");
  // console.log(doc);
  // doc.setCurrentTime(0);

  // var str = 'For more information, see Chapter 3.4.5.1';
  // var re = /(\d+(\.\d)*)s/i;
  // var found = str.match(re);

  // //let elements = ;
  // //elements.forEach(console.log("--"));
  // for(a of doc.getElementsByTagName("svg")) a.beginElement();
  // //for(a of doc.getElementsByTagName("animateTransform")) a.beginElement();
  // // animateTransform
  // // animate
  // //console.log(elements);
}

// Enable dynamic SVG content
ActiveSlidesKit.setSVGStyle = function(obj, id, style) {
  svg_content = ActiveSlidesKit.getSVGContent(obj);
  if (!svg_content)
    return;
  let group = obj.contentDocument.getElementById(id);
  if (group == null)
    return;
  group.style = style;
}

// This function insures that the 'viewBox' attribute is set.
// If viewBox or width and height are already set these values are used, exept if 'overwrite=true'
ActiveSlidesKit.setSVGViewbox = function(obj, width, height, overwrite = true) {
  svg_content = ActiveSlidesKit.getSVGContent(obj);
  if (!svg_content)
    return;

  let svg = svg_content.getElementsByTagName("svg")[0];
  if (overwrite || !svg.getAttribute("viewBox")) {
    let w = svg.getAttribute("width");
    let h = svg.getAttribute("height");
    if (!overwrite && w && h) {
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      console.log("setting", `0 0 ${w} ${h}`, svg.getAttribute("id"));
    } else {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    // svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    // svg.removeAttribute('width');
    // svg.removeAttribute('height');
  }
}

ActiveSlidesKit.parseTransformMatrix = function(str){
  const match_float = "[+\\-]?(?:0|[1-9]\\d*)(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?"
  const match_sep = "\\s*,?\\s*"
  m = str.match(RegExp(`matrix\\((${match_float}(?:${match_sep}${match_float})*)\\)`))
  if(!m || !m.length || m.length < 2) return null
  return m[1].match(RegExp(match_float, 'g')).map(x => parseFloat(x))
}

ActiveSlidesKit.getElementTranslate = function(e){
  console.log("getElementTranslate");
  let t = e.css("transform")
  let r = { left: 0, top: 0 }
  if(!t) return r
  mat = ActiveSlidesKit.parseTransformMatrix(t)
  if(!mat || !mat.length || mat.length != 6) return r
  r.left = mat[4]
  r.top = mat[5]
  return r
}

ActiveSlidesKit.transformTo = function(e, target){
  let offset = e.offset()
  let t = ActiveSlidesKit.getElementTranslate(e)
  let w = target.width || e.width()
  let h = target.height || e.height()
  if (!e.data("bt-width")) e.data("bt-width", e.width());
  if (!e.data("bt-height")) e.data("bt-height", e.height());
  e.css({
    transform:`translate(${t.left+target.left-offset.left}px,${t.top+target.top-offset.top}px)`,
    width:w,
    height:h
  })
}

ActiveSlidesKit.untransform = function(e){
  // let offset = e.offset()
  // let w = target.width || e.width()
  // let h = target.height || e.height()
  e.css({
    transform: "none",
    width:e.data("bt-width"),
    height:e.data("bt-height")
  })
}

// Returns the position and size of an SVG element relative to the webpage viewport
ActiveSlidesKit.getSVGElementPosition = function(obj, id) {
  console.log("getSVGElementPosition");
  svg_content = ActiveSlidesKit.getSVGContent(obj);
  if (!svg_content)
    return;
  element = svg_content.getElementById(id);
  if (!element)
    return;

  let o = $(obj).offset();

  //console.log(element);
  rect = element.getBoundingClientRect();
  //console.log(rect);

  // Highlight area for debugging
  // $("body").append(`<div style="
  //   position:absolute;
  //   z-index:399;
  //   background-color: rgba(255,0,0,0.5);
  //   width:${rect.width}px;
  //   height:${rect.height}px;
  //   top:${rect.top + o.top}px;
  //   left:${rect.left + o.left}px">Test</div>`);

  return {
    left: rect.left + o.left,
    top: rect.top + o.top,
    height: rect.height,
    width: rect.width
  };

}

// Animate charts when coming back to slide
ActiveSlidesKit.animateCharts = function(charts) {
  Reveal.addEventListener('slidechanged', function(event) {
    charts.forEach(function(chart) {
      if (event.indexh == $(chart.chart.ctx.canvas).closest("section").index()) {
        setTimeout(function() {
          chart.update();
        }, 500); // Wait for slide, than draw
      } else {
        chart.reset();
        chart.update();
        chart.reset();
      }
    });
  });
}
