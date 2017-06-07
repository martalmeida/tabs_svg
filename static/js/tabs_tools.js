function reset_config(){
  localStorage.removeItem('tabsConf');
  location.reload();
}

function update_local_config(){
  if (config.clientConfig){
    // update client config:
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem('tabsConf',JSON.stringify(config));
    }
  }
}

function get_zoom(){
  return map.getZoom()
//  var Zmin=7;
//  var Zmax=9;
//  var zoom=map.getZoom();
//  zoom = zoom<=Zmin ? Zmin:zoom;
//  zoom = zoom>=Zmax ? Zmax:zoom;
//  return zoom
}

function svg_scale(){
  var o=$('svg')[0]
  var w=$(o).attr('width');
  var h=$(o).attr('height');
  var W=$(o).attr('viewBox').split(' ')[2];
  var H=$(o).attr('viewBox').split(' ')[3];
  //var H=o.getBoundingClientRect()['height'];
  //var W=o.getBoundingClientRect()['width'];
  return r=(h/H+w/W)/2;
}

function show_dialog(name,forceValue,funcComplete){
  var ob=$('#'+name);

  if (forceValue===undefined)
    var disp=ob.css('display');
  else if (forceValue) var disp='none';


  if (disp=='none'){
    ob.slideDown(complete=funcComplete);
  }else{
    ob.slideUp(complete=funcComplete);
  }
  return (disp!='block')
}


function Panel(trigger,id,html,style,closeOnClick,allowedClass){

  $('#mapsWrapper0').append('<div '+style+' id="'+id+'">'+html+'</div>');

  this.closeOnClick=closeOnClick;
  var self=this;


  $('#'+trigger).click(function(e){
    self.toggle(e);
  });


  this.show=function(e){
     show_dialog(id,1,function(){$(document).bind( "click",self.hide)});
     self.visible=true;
  }

  this.hide=function(e){
      // check if clicked inside :
      //cond=$(e.target).parents('#'+id).length>0 || e.target.id==id;
      //or simply:

      var cond=$(e.target).closest('#'+id).length;

      // now check if clicked in some other object with class matching allowedClass:
      if (allowedClass && e.target &&  e.target.className && e.target.className.match){
        var re = new RegExp(allowedClass, 'g'); // same as /allowedClass/g
        if (e.target.className.match(re))
        cond=cond | e.target.className.match(re).length;
      }

      if (self.closeOnClick){
        cond=false; // will close even if clicked inside
      }
      if (!cond){
        show_dialog(id,0,function(){$(document).unbind( "click",self.hide)});
        self.visible=false;
      }
  }

  this.toggle=function(e){
    if (this.visible) this.hide(e)
    else this.show(e)
  }

}

function VarsPanel(){
  this.enabled=true;
  this.visible=false;

  var vars_field=config.vars_field;
  var vars_field_names=config.vars_field_names;

  // panel at right:
  var s0='\
  <style> \
    #vars_btn {position:absolute; top: 10px; left: 760px; cursor:pointer}\
    #vars_panel{position: absolute; padding: 5px; top: 40px; left: 648px; width:130px; display:none;}\
  </style>';

  var s1='\
  <div id="vars_btn" class="menu"><i class="fa fa-list-alt fa-lg"></i></div> \
  <div id="vars_panel" class="menu"> \
    <div style="background-color:#dce7f7;border-radius: 4px;"> \
      <strong>fields:</strong><br>';
      s1+='      <form>';
      for (var i=0;i<vars_field.length;i++){
        s1+='      <input id="radio_'+vars_field[i]+'_model" name="field" type="radio" value="'+vars_field[i]+':model"  style="cursor: pointer" \
           onclick="m.choose(this)"><label style="cursor: pointer"  for="radio_'+vars_field[i]+'_model">'+vars_field_names[i]+'</label><br>';
      }
      s1+='      </form>';

      s1+='\
      <hr> \
      <strong>overlay:</strong><br> \
      <input id="checkbox_currents_model" type="checkbox" value="currents:model" style="cursor: pointer" onclick="m.choose(this)"><label style="cursor: pointer"  for=checkbox_currents_model>currents</label><br>\
      <input id="checkbox_wind_model"     type="checkbox" value="wind:model" style="cursor: pointer" onclick="m.choose(this)"><label style="cursor: pointer"  for=checkbox_wind_model>wind</label><br> \
    </div> \
    \
    <strong>external:</strong><br> \
    <input id="checkbox_currents_radar"    type="checkbox" value="currents:radar" style="cursor: pointer" onclick="m.choose(this)"><label style="cursor: pointer"  for=checkbox_currents_radar>Radar</label><br>\
    <div style="width: 100%"> \
      <div style="width: 40px; float: left;">Buoys</div> \
      <div style="margin-left: 42px;"> \
         <input id="checkbox_field_buoys"   type="checkbox" value="field:buoys"   style="cursor: pointer" onclick="m.choose(this)">field <br>\
         <input id="checkbox_currents_buoys" type="checkbox" value="currents:buoys" style="cursor: pointer" onclick="m.choose(this)">currents <br>\
         <input id="checkbox_wind_buoys"     type="checkbox" value="wind:buoys"     style="cursor: pointer" onclick="m.choose(this)">wind <br>\
         <input id="checkbox_markers_buoys"  type="checkbox" value="markers:buoys"   style="cursor: pointer" onclick="m.choose(this)">markers \
         <i id="buoy_markers_panel_help_btn" class="fa fa-question-circle fa"></i>\
      </div> \
    </div> \
    <hr> \
    <strong>aux:</strong><br> \
    <input id="checkbox_isobaths_model" type="checkbox"  value="isobaths:model" style="cursor: pointer" onclick="m.choose(this)"><label style="cursor: pointer"  for=checkbox_isobaths_model>isobaths</label><br>\
    <!--<input id="checkbox_river"    type="checkbox"  style="cursor: pointer" onclick="M.river.show()"><label style="cursor: pointer"  for=checkbox_river>river</label><br>--> \
  </div>\
  ';


  $('head').append(s0);
  $('#mapsWrapper0').append(s1);

  //-----------------------------------
  // Buoy Markers help:
  //var style='style="font-size: 12px;display: none; position: absolute; top:200px;left:195px;width:200px" class="menu"';
  // panel at right:
  var style='style="font-size: 12px;display: none; position: absolute; top:135px;left:430px;width:200px" class="menu"';
  var html='<p>Buoy\'s Markers Help</p>\
            There are two types of buoys:\
            <div>TABS <img src="'+tabs_icons_dir+'/buoy.png" width=16.5 height=26.25> and \
            NDBC <img src="'+tabs_icons_dir+'/buoy2.png" width=26.25 height=23.25> \
            </div>\
            The color indicates the buoy/data status at selected date:\
            <ul>\
              <li>pink - buoy is discontinued and has no data</li>\
              <li>white - buoy has no data</li>\
              <li>blue - buoy has data</li>\
            </ul>\
            <div>By clicking in the markers you will be redirected to the buoys data query site</div>\
            <br>';
  this.help=new Panel('buoy_markers_panel_help_btn','buoy_markers_help',html,style,true);
  $('#buoy_markers_panel_help_btn').css({'color':'#98bccf','cursor':'pointer'});
  //-----------------------------------

  var self=this;
  $('#vars_btn').click(function(){
    self.toggle();
  });

  this.toggle=function(){
    this.visible=show_dialog('vars_panel')
  }

  this.enable=function(val){
    if (val==this.enabled) return

    if (!val){
      $('#vars_panel :input').prop('disabled',true)
                             .css({'cursor':'auto'})
                             .find('label').css({'cursor':'auto'});
    }else{
      $('#vars_panel :input').prop('disabled',false)
                           .css({'cursor':'pointer'})
                           .find('label').css({'cursor':'pointer'});
    }
    this.enabled=val;
  }

}


function Colorbar(){
  this.visible=false;
  this.field='';
  this.layer=null;

  var s0=' \
  <style> \
    #cbarDiv0 { \
      position: absolute; width:368px; height: 55px; top: 400px; left: 420px; border: 0px solid green; \
      background-color: '+config.color_out+'; border-radius: 7px; box-shadow: 0px 0px 7px #888888; \
      display:none; opacity:'+config.alpha_out+'; \
      z-index:1000\
    } \
    #cbarDiv { \
      position: absolute; width:350px; height: 55px; top: 400px; left: 420px; border: 0px solid red; \
      display:none; \
      z-index:1000\
    } \
    #fieldLayer_up { \
      cursor:pointer;position: absolute; top:5px;right: 5px; display:none \
    } \
    #fieldLayer_down { \
      cursor:pointer;position: absolute; bottom:5px;right: 5px; display:none \
    } \
    #fieldLayer_num { \
      position: absolute; top:21px; right: 5px; font-size: 10px; color:#002266 \
      display:none; \
    } \
  </style>';

  var s1='\
  <div   id="cbarDiv0"> \
    <i   id="fieldLayer_up"    class="fa fa-arrow-circle-up fa-1"></i> \
    <div id="fieldLayer_num"></div> \
    <i   id="fieldLayer_down"  class="fa fa-arrow-circle-down fa-1"></i> \
  </div> \
  <div id="cbarDiv"></div> \
  ';

  $('head').append(s0);
  $('#mapsWrapper0').append(s1);


  // simulate menu:hover class:
  $('#cbarDiv')
    .mouseover(function(){
      $('#cbarDiv0').css({opacity:config.alpha_over,'background-color': config.color_over});
    })
    .mouseout(function(){
      $('#cbarDiv0').css({opacity:config.alpha_out,'background-color': config.color_out});
    });

  var self=this;
  $('#fieldLayer_up').click(function(){
    self.change_layer(1);
//    //M.frames[M.iactual].field.show(self.field,self.layer);
//    M.frames[M.iactual].show_field(self.field,self.layer);

    config[config.field+'_layer']=self.layer;
    m.field.load(m.date,config.field,config[config.field+'_layer']);
    m.buoys_field.load(m.date,1,config.field,config[config.field+'_layer']);

    // update client config
    update_local_config()
  })

  $('#fieldLayer_down').click(function(){
    self.change_layer(-1);
//    //M.frames[M.iactual].field.show(self.field,self.layer); // use next line just to
//    M.frames[M.iactual].show_field(self.field,self.layer);   // store vname and layer in config

    config[config.field+'_layer']=self.layer;
    m.field.load(m.date,config.field,config[config.field+'_layer']);
    m.buoys_field.load(m.date,1,config.field,config[config.field+'_layer']);

    // update client config
    update_local_config()
  })

  this.load=function(date){
    $.get(tabs_dir+'/data/svg/colorbar/'+date,function(d){
      if (false){
        // problem with image (continuous salt colorbar)
        $('#cbarDiv').html(d.data);
      }else{
        var SVG=$($.parseXML(d.data)).children('svg');
        $('#cbarDiv svg').detach()
        $('#cbarDiv').append(SVG);
      }
      $('#cbarDiv svg').css({'width':350,'height':55});
    });
  }

  this.show=function(){
    $('#cbarDiv0').show();
    $('#cbarDiv').show();
    this.visible=true;
  }

  this.hide=function(){
    $('[id^=cbarDiv]').hide();
    this.visible=false;
  }

  this.n_layers=function(vname){
    return $('[id^='+vname+'_cbar]').length;
  }

  this.change_layer=function(j){
    this.show_var(this.field,this.layer+j);
  }

  this.show_var=function(vname,layer){
   if (this.visible && (this.field==vname) && (this.layer==layer)) return

    var nLayers=this.n_layers(vname);
    if (!nLayers) return

    this.field=vname;

    if (!this.visible) this.show();

    // 1st show vname colorbar:
    $("[id*=_cbar_]").hide()
    $("[id^="+vname+"_cbar]").show()

    // then show selected layer:
    layer = layer<0 ? 0:layer;
    layer = layer>nLayers-1 ? nLayers-1:layer;
    this.layer=layer;

    $('[id^='+vname+'_cbar_'+layer+']').show();
    // hide other layers:
    for (var i = 0; i < nLayers; i++) {
      if (i!=layer){
        $('[id^='+vname+'_cbar_'+i+']').hide();
        }
      }

    if (nLayers>1){
      $('[id^=fieldLayer]').show();
      $('#cbarDiv0').css({'width':368});

      // update layer num label:
      $('#fieldLayer_num').html((layer+1)+'/'+nLayers);

      // update up/down icons:
      if (layer==nLayers-1) $('#fieldLayer_up').css({'color':'#9e9e9e','cursor':'auto'});
      else      $('#fieldLayer_up').css({'color':'black','cursor':'pointer'});

      if (layer==0) $('#fieldLayer_down').css({'color':'#9e9e9e','cursor':'auto'});
      else      $('#fieldLayer_down').css({'color':'black','cursor':'pointer'});

    }else{
      $('[id^=fieldLayer]').hide();
      $('#cbarDiv0').css({'width':350});
    }

  }

}


function VFieldScale(vname){
  this.visible=false;
  this.actual=null;

  if (vname=='currents'){
     var left=320;
     var label='0.5 m s';
     var ytext=30;
  }else if (vname=='wind'){
    var left=230;
    var label='5 m s';
     var ytext=32;
  }

  var s0=' \
  <style> \
    #'+vname+'SvgScale0 { \
      position: absolute; left: '+left+'px; top: 410px; width:80px; height: 35px;\
      background-color: '+config.color_out+'; border-radius: 7px; box-shadow: 0px 0px 7px #888888; \
      display:none; opacity:'+config.alpha_out+'; \
      z-index:1000\
    } \
    #'+vname+'SvgScale { \
      position: absolute; left: '+left+'px; top: 410px; width:80px; height: 35px;\
      display:none; \
      z-index:1000\
    } \
    #'+vname+'ScaleLabel { \
      fill:black; font-family:Helvetica; font-size:11px; text-anchor:middle; \
    } \
  </style>';

  var s1='\
  <div id="'+vname+'SvgScale0"></div> \
  <div id="'+vname+'SvgScale"> \
    <svg width="80" height="35" Sstyle="width:100%;height:100%"> \
      <polygon id="'+vname+'Scale" points="00,00 00,00" \
        style="stroke:black;stroke-width:1;fill:none" \
        transform="scale(1) translate(5,0)"/> \
      <text id="'+vname+'ScaleLabel" x="40" y="'+ytext+'"> \
        '+label+' <tspan dy="-5" style="font-size:70%">-1</tspan> \
      </text> \
    </svg> \
  </div> \
  ';

  $('head').append(s0);
  $('#mapsWrapper0').append(s1);

  // simulate menu:hover class:
  $('#'+vname+'SvgScale')
    .mouseover(function(){
      $('#'+vname+'SvgScale0').css({opacity:config.alpha_over,'background-color': config.color_over});
    })
    .mouseout(function(){
      $('#'+vname+'SvgScale0').css({opacity:config.alpha_out,'background-color': config.color_out});
    });

  this.show=function(){
    // svg input needed for update only!
    if (!this.visible){
      $('#'+vname+'SvgScale0').show();
      $('#'+vname+'SvgScale').show();
      this.visible=true;
    }
    this.update();
  }

  this.hide=function(){
    $('#'+vname+'SvgScale0').hide();
    $('#'+vname+'SvgScale').hide();
    this.visible=false;
  }

  this.update=function(){
    // update length and lw (on zoom):

    s=get_zoom();
    if (this.actual==s){
      return
      console.log('no update for surrents scale !!');
    }else console.log('WILL update currents scale !!!');
    this.actual=s;

    var ob=$('#'+vname+'_scale');

    var L=ob[0].getBoundingClientRect()['width'];
    if (vname=='currents')  var p=seta(0,10,L,0);
    else if (vname=='wind') var p=seta2d(0,12,L,0);
    var pts='';
    for (var i=0; i<p.length; i++){
      pts+=p[i][0]+','+p[i][1]+' ';
    }

    $('#'+vname+'Scale').attr('points',pts);
    // center arrow:
    var arrowStart=40-L/2;
    $('#'+vname+'Scale').attr('transform','scale(1) translate('+arrowStart+',0)');

    // update lw:
//    if (false)
    this.set_lw();
  }

  this.set_lw=function(lw){
    if (lw===undefined){
      var ob=$('#'+vname+'_scale');
      var lw=parseFloat($(ob).css('stroke-width').replace('px',''));
//      alert('finding lw '+lw+' -- '+svg_scale()+'-->'+(lw*svg_scale()));
      lw=lw*svg_scale();
    };
    $('#'+vname+'Scale').css({'stroke-width':lw});
  }

  this.set_color=function(color){
    if (!color.startsWith('rgb') && color[0]!='#') color='#'+color;
    $('#'+vname+'Scale').css({'stroke':color});

    // fill wind arrows with stroke color and transparency?
    if (vname=='wind'){
      $('#'+vname+'Scale').css({'fill':color,'fill-opacity':0.2});
    }

  }

}

