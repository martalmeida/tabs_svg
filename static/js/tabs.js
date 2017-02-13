function get_zoom(){
  var Zmin=7;
  var Zmax=9;
  var zoom=map.getZoom();
  zoom = zoom<=Zmin ? Zmin:zoom;
  zoom = zoom>=Zmax ? Zmax:zoom;
  return zoom
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

function show_dialog(name){
  var ob=$('#'+name);
  var disp=ob.css('display');
  if (disp=='none'){
    ob.slideDown();
  }else{
    ob.slideUp();
  }
  return (disp!='block')
}


function MASTER(){
  this.frames=[];
  this.dates=[];
  this.iactual=null;

  this.currents_scale=new VFieldScale('currents');
  this.wind_scale=new VFieldScale('wind');
  this.colorbar=new COLORBAR;
  this.colorbar.load();

  this.vars_panel=new VARS_PANEL();
  this.date_select=new DATE_SELECT();
  this.anim=new ANIM();

  this.conf_panel=new CONF_PANEL();

  this.river=new RIVER();


  var self=this;

  this.times=function(date0,date1,func){
    $.get(tabs_dir+'/data/svg/datetimes/'+date0+'/'+date1,function(data){
      if (func) func(data)
    })
  }

  // load all times (as yyyymmddhh string):
  this.times(0,0,function(t){
    self.allTimes=new Array(t.length);
    for (var i=0;i<t.length;i++){
      self.allTimes[i]=format_date(new Date(t[i]))[0];
    }
    self.all_times=self.allTimes; // change with this.filter_times
    self.set_time_range(); // set datepick time range
    self.advance('evt',0); // set click events for time selector arrows
  })

  // filter times: (set_time_range after filter times!)
  this.filter_times=function(options){
    // options: hours (array), stride, i0 (1st indice for stride)
    var stride=1,
        i0=0,
        hours=[];

    if (options!==undefined){
      var keys=Object.keys(options)
      for (var i=0;i<keys.length;i++){
        if (keys[i]==='hours') hours=options['hours'];
        else if (keys[i]==='stride') stride=options['stride'];
        else if (keys[i]==='i0') i0=options['i0'];
      }
   }

   if (hours.length) this.all_times=timeAtFixedHours(this.allTimes,hours);
   else this.all_times=this.allTimes;
   if (stride>1) this.all_times=astride(this.all_times,stride,i0)
  }

  this.set_time_range=function(){
    // sets time range of datepick
    var date0=this.all_times[0],
        date1=this.all_times.slice(-1)[0],
        ymd0=date0.slice(0,4)+'-'+date0.slice(4,6)+'-'+date0.slice(6,8),
        ymd1=date1.slice(0,4)+'-'+date1.slice(4,6)+'-'+date1.slice(6,8);

    $('#current_date').datepick('option', {'minDate':ymd0,'maxDate':ymd1});
    $('#anim_panel_dates_input').datepick('option', {'minDate':ymd0,'maxDate':ymd1});
  }


  this.load_nearest=function(show){
    // no need to check if already stored...
    $.get(tabs_dir+'/data/svg/datetime/nearest/more/0',function(data){
      var date=format_date(new Date(data.time))[0];
      var svg=$($.parseXML(data.data)).children('svg');
      self.frames.push(new FRAME(date,svg,{onreset_master:self.on_reset}));
      self.dates.push(date);

      if (show){
        self.show_frame(self.frames.length-1);
      }
    });
  }

  this.next_date=function(date,n){//,options){
    // use date as string yyyymmdd[HH]
    // options: hours (array), stride, i0 (1st indice for stride)
     if (n===undefined) n=1;

//     var stride=1,
//         i0=0,
//         hours=[];
//
//     if (options!==undefined){
//       var keys=Object.keys(options)
//       for (var i=0;i<keys.length;i++){
//         if (keys[i]==='hours') hours=options['hours'];
//         else if (keys[i]==='stride') stride=options['stride'];
//         else if (keys[i]==='i0') i0=options['i0'];
//       }
//    }
//
//    if (hours.length) var t=timeAtFixedHours(this.allTimes,hours);
//    else var t=this.allTimes;
//    if (stride>1) t=astride(t,stride,i0)
//
//    console.log(hours+' '+stride+' '+i0)
//
//    var i=t.indexOf(date)
//    if (i<0){
//      var d=t.find(function(e){return e>=date})
//      i=t.indexOf(d)
//    }

    var i=this.all_times.indexOf(date)
    if (i<0){
      if (date<this.all_times[0]) i=0
      else if (date>this.all_times.slice(-1)[0]) i=this.all_times.length-1
    }

//    else
//      if (date<this.all_times[0]){ // lower than smallest
//        var d=this.all_times.find(function(e){return e>date})
//        i=this.all_times.indexOf(d)
//      }else{ // higher than highest
//        var d=this.all_times.find(function(e){return e<date})
//        i=this.all_times.indexOf(d)
//      }
//    }

    return this.all_times[i+n]
  }


  this.load_dates=function(dates,i,atLoad,atEnd){
    if (i===undefined) i=0

    var date=dates[i];
    if (atLoad) atLoad(i);

    if (this.dates.indexOf(date)===-1){
      $.get(tabs_dir+'/data/svg/datetime/'+date+'/more/0').done(function(data){
        var date=format_date(new Date(data.time))[0];
        var svg=$($.parseXML(data.data)).children('svg');
        self.frames.push(new FRAME(date,svg,{onreset_master:self.on_reset}));
        self.dates.push(date);

        i++;
        if (i<dates.length){
          self.load_dates(dates,i,atLoad,atEnd);//,i,ob);
        }else{
          if (atEnd) atEnd();
        }

      })

    }else{
      i++;
      if (i<dates.length)  self.load_dates(dates,i,atLoad,atEnd);
      else if (atEnd) atEnd();
    }
  }

  this.load_date=function(date,show){
    // if not found, use nearest
    if (this.all_times.indexOf(date)===-1)
      date=this.next_date(date,0);

    if (this.dates.indexOf(date)===-1){
      $.get(tabs_dir+'/data/svg/datetime/'+date+'/more/0',function(data){
        var date=format_date(new Date(data.time))[0];
        var svg=$($.parseXML(data.data)).children('svg');
        self.frames.push(new FRAME(date,svg,{onreset_master:self.on_reset}));
        self.dates.push(date);

        if (show){
          self.show_frame(self.frames.length-1);
        }
      });

    }else if (show){
      self.show_frame(self.dates.indexOf(date));
    }
  }

  this.load_next=function(n,show,date0){
     // if no date0, use currentily shown (iactual)
    if (date0===undefined) date0=this.dates[this.iactual]
    if (show===undefined) show=false;

    date=this.next_date(date0,n);//,options)

    this.load_date(date,show)

//    if (this.dates.indexOf(date)===-1){
//      $.get('/data/svg/datetime/'+date+'/more/0',function(data){
//        var date=format_date(new Date(data.time))[0];
//        var svg=$($.parseXML(data.data)).children('svg');
//        self.frames.push(new FRAME(date,svg,{onreset_master:self.on_reset}));
//        self.dates.push(date);
//
//        if (show){
//          self.show_frame(self.frames.length-1);
//        }
//      });
//
//    }else if (show){
//      self.show_frame(self.frames.indexOf(date));
//    }
  }


  this.advance=function(evt,n){

    var date0=this.dates[this.iactual];
    if (date0===undefined) return // date0=this.all_times.slice(-1)[0]
    var date=this.next_date(date0,n);

    if (date<=this.all_times[0]){
      $('#previous i').off('click')
                      .css({color: '#bfc8d6',cursor:'auto'});
    }else{
      $('#previous i').off('click')
                      .on('click', function(evt){self.advance(evt,-1)})
                      .css({color:'black',cursor:'pointer'});
    }

    if (date>=this.all_times.slice(-1)[0]){
      $('#next i').off('click')
                  .css({color: '#bfc8d6',cursor:'auto'});
    }else{
      $('#next i').off('click')
                  .on('click', function(evt){self.advance(evt,1)})
                  .css({color:'black',cursor:'pointer'});
    }

    if (n!==0 && date>=this.all_times[0] && date<=this.all_times.slice(-1)[0]){
      this.load_next(n,true,date0)
    }

  }


  this.show_frame=function(i){
    // also ass prev frame to FRAME.show function cos info
    // from prev may be needed (eg to be removed)
    var prevFrame=this.frames[this.iactual]; // undefined at start

    this.frames[i].show(true,prevFrame); // true for init_reset
    this.iactual=i

    this.on_show_field()
    this.on_show_overlay('model','isobaths')
    this.on_show_overlay('model','wind')
    this.on_show_overlay('buoys','wind')
    this.on_show_overlay('model','currents')
    this.on_show_overlay('buoys','currents')
    this.on_show_overlay('radar','currents')
    this.on_show_overlay('buoys','markers') // note that buoys markers (like isobaths) is not instance of
                                            // class OVERLAY, so this call just sets the checkbox

    M.vars_panel.enable(1);
    this.show_time(this.dates[this.iactual]);

    this.advance('evt',0); // set click events for time selector arrows
  }


  this.on_show_field=function(){
    if (!this.frames[this.iactual]) return
    var frame=this.frames[this.iactual]

    var vname=frame.field_model.actual
    if (vname==='none'){
      M.colorbar.hide();
    }else{
      // show colorbar
      M.colorbar.show_var(frame.field_model.actual,frame.field_model.layer[frame.field_model.actual]);
    }

    // update colors for scale arrows.
    // set currents scale color according to which model field is shown
    // and according to which current vector field is being shown/hidden:
    fieldVname=vname//frame.field_model.actual
    // currents:
    if (frame.currents_model.visible)      this.currents_scale.set_color(config['currents_color'][fieldVname]);
    else if (frame.currents_buoys.visible) this.currents_scale.set_color(config['buoys_color'][fieldVname]);
    else if (frame.currents_radar.visible) this.currents_scale.set_color(config['radar_color'][fieldVname]);
    // wind:
    if (frame.wind_model.visible)      this.wind_scale.set_color(config['wind_color'][fieldVname]);
    else if (frame.wind_buoys.visible) this.wind_scale.set_color(config['buoys_color'][fieldVname]);

    // check radio button (needed at 1st load only!)
    $('#radio_'+vname+'_model').prop('checked',1); // must be always model!

    // also check buoys field checkbox here:
    if (frame.field_buoys.actual=='none')
      $('#checkbox_fields_buoys').prop('checked',0);
    else $('#checkbox_fields_buoys').prop('checked',1);
  }

  this.on_show_overlay=function(type,vname){
    if (!this.frames[this.iactual]) return
    var frame=this.frames[this.iactual]

    var vis=frame[vname+'_'+type].visible===true;

    // show/hide scale:
    if (['currents','wind'].indexOf(vname) !== -1){ // isobaths is also an overlay !
      if (vis)
        M[vname+'_scale'].show();
      else{
        // hide if not needed for other overlay!
        var cond1= ((vname=='currents')&!(frame.currents_model.visible | frame.currents_buoys.visible | frame.currents_radar.visible));
        var cond2= ((vname=='wind')&!(frame.wind_model.visible | frame.wind_buoys.visible));
        if (cond1|cond2)
        M[vname+'_scale'].hide();
      }

      // update colors for scale arrows.
      // set currents scale color according to which model field is shown
      // and according to which current vector field is being shown/hidden:
      fieldVname=frame.field_model.actual
      if (vname=='currents'){
        if (frame.currents_model.visible)      this.currents_scale.set_color(config['currents_color'][fieldVname]);
        else if (frame.currents_buoys.visible) this.currents_scale.set_color(config['buoys_color'][fieldVname]);
        else if (frame.currents_radar.visible) this.currents_scale.set_color(config['radar_color'][fieldVname]);
      }else if (vname=='wind'){
        if (frame.wind_model.visible)      this.wind_scale.set_color(config['wind_color'][fieldVname]);
        else if (frame.wind_buoys.visible) this.wind_scale.set_color(config['buoys_color'][fieldVname]);
      }

    }

    // update checkbox (needed at 1st load only!)
    $('#checkbox_'+vname+'_'+type).prop('checked',vis);

  }

  this.on_reset=function(){
    // update scale size:
    if (self.currents_scale.visible) self.currents_scale.update()
    if (self.wind_scale.visible) self.wind_scale.update()
  }

  this.show_time=function(date){
    var ymd=date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8);
    var hh=date.slice(8,10)
    $('#current_date').val(ymd);
    $('#current_hour').val(hh+'h');
  }

//  this.choose=function(vname,ob){
  this.choose=function(ob){
    if (!this.frames[this.iactual]) return

    var frame=this.frames[this.iactual],
        vname = ob.value.split(':')[0],
        type  = ob.value.split(':')[1],
        vis=$(ob).prop('checked');

    // radio buttons:
    if (['temp','salt','speed','none'].indexOf(vname)>-1){
      frame.show_field(vname)
      this.on_show_field()

    // check boxes:
    }else if (['currents','wind','isobaths','markers'].indexOf(vname)>-1){
      frame.show_overlay(type,vname,vis)
      this.on_show_overlay(type,vname)
    }else if (type=='buoys'){
      if (vname=='fields'){
        // could show the model field without bouys, but there is no need. So just set the config.show_field_buoys here!
        // note that there is no need to play with the this.on_show_field unless we want colorbar for buoys fields (and show them
        // alone, without model fields. Not the case!
        // note that usually config is only set inside FRAME class. This is an exception cos both model and buoys are
        // shown in FRAME.show_field (and thus both configs are set there too). There are both done is the same methos cos
        // in no case buoys fields are shown without model fields (only moedl fields can be selected!).
        if (vis){
          frame.field_buoys.show(frame.field_model.actual,frame.field_model.layer[frame.field_model.actual]);
          config['show_field_buoys']=true;
        }else{
          frame.field_buoys.show(null);
          config['show_field_buoys']=false;
        }

      }
    }

  }

  this.change_color=function(what,field,color){
    // change color for currents, wind and isobaths
    if (!this.frames[this.iactual]) return
    var frame=this.frames[this.iactual]
    config[what+'_color'][field]=color;

    if (frame.field_model.actual==field){
      frame[what].set_color(color);
      if (['currents','wind'].indexOf(what)>-1)
      this[what+'_scale'].set_color(color);
    }
  }

}

function FRAME(date,svg,svg_data){
  this.svg=svg;
  this.date=date;

  this.svg.attr('id','svg_'+date)
  this.svg.attr('class','leaflet-zoom-hide'); // to hide during zoom !
  $('#frame_border',this.svg).hide();

  if (svg_data){
    var keys=Object.keys(svg_data);
    for (var i=0;i<keys.length; i++){
      this.svg.data(keys[i],svg_data[keys[i]]);
    }
  }

  var self=this

  this.field_model    = new FIELD(svg,'model')
  this.field_buoys    = new FIELD(svg,'buoys')
  this.markers_buoys  = new BUOYMarkers(this,svg)

//  this.currents = new OVERLAY(svg,'currents')
//  this.radar    = new OVERLAY(svg,'radar')
//  this.wind     = new OVERLAY(svg,'wind')
  this.isobaths_model = new ISOBATHS(svg)
//  this.buoys_curr    = new OVERLAY(svg,'buoys_curr')
//  this.buoys_wind    = new OVERLAY(svg,'buoys_wind')

  this.currents_model=new OVERLAY(svg,'model','currents')
  this.currents_radar=new OVERLAY(svg,'radar','currents')
  this.currents_buoys=new OVERLAY(svg,'buoys','currents')

  this.wind_model=new OVERLAY(svg,'model','wind')
  this.wind_buoys=new OVERLAY(svg,'buoys','wind')


  this.show=function(init_reset,prevFrame){
    if (init_reset){
      this.update_on_init()
      Reset(this.svg) //this.reset()
    }

    // replace svg:
    $('.leaflet-overlay-pane svg').detach()
    $('.leaflet-overlay-pane').append(this.svg)

    // remove other stuff that may have been added.
    // Only buoys markers for now:
    if (prevFrame!==undefined)
    prevFrame.markers_buoys.hide();
  }

//  this.reset=function(){
//    Reset(this.svg);
//  }

  this.update_on_init=function(){
    // do at start only
    this.show_field(); // includes model and buoys fields

    this.currents_model.set_lw();
    this.currents_radar.set_lw();
    this.currents_buoys.set_lw();
    this.wind_model.set_lw();
    this.wind_buoys.set_lw();
    this.isobaths_model.set_lw_fs_r();

    this.show_overlay('buoys','markers'); // show/hide buoys markers. Needed at start only
                                          // note that buoys markers is not and instance of
                                          // OVERLAY, but shares the show/hide methods and config

    this.markers_buoys.field_marker_init();
  }

  this.update_on_reset=function(){
    // do at start and at each zoom
    self.show_overlay('model','currents')
    self.show_overlay('radar','currents')
    self.show_overlay('buoys','currents')
    self.show_overlay('model','wind')
    self.show_overlay('buoys','wind')
    self.show_overlay('model','isobaths')
    self.markers_buoys.field_marker_set_lw()
  }

  this.svg.data('onreset',this.update_on_reset);


  this.show_field=function(vname,layer,withBuoys){
    // show model field, with or without buoy data also plotted

    // use vname none to hide all fields!
    if (vname===undefined)     vname     = config['default_field'];
    if (layer===undefined)     layer     = config[vname+'_layer'];
    if (withBuoys===undefined) withBuoys = config['show_field_buoys'];

    this['field_model'].show(vname,layer);
    if (withBuoys) this['field_buoys'].show(vname,layer);
    else this['field_buoys'].show(null);


    // store current vname, layer and show_buoys in config:
    vname=this.field_model.actual; // field.show may change vname to none if not valid name...
    config['default_field']=vname
    config[vname+'_layer']=this.field_model.layer[vname];
    config['show_field_buoys']=withBuoys;

    // change options that depend on field shown:
    // model:
    this.currents_model.set_color(config['currents_color'][vname]);
    this.wind_model.set_color(config['wind_color'][vname]);
    // radar:
    this.currents_radar.set_color(config['radar_color'][vname]);
    // buoys:
    this.currents_buoys.set_color(config['buoys_color'][vname]);
    this.wind_buoys.set_color(config['buoys_color'][vname]);
    // isobaths:
    this.isobaths_model.set_color(config['isobaths_color'][vname]);
  }


  this.show_overlay=function(type,vname,vis){
    // show any overlay!

    if (vis===undefined) vis=config['show_'+vname+'_'+type];

    if (vis){
      this[vname+'_'+type].show();
      config['show_'+vname+'_'+type]=true;
    }else{
      this[vname+'_'+type].hide();
      config['show_'+vname+'_'+type]=false;
    }
    // store current vis setting in config:
    config['show_'+vname+'_'+type]=vis;
  }

//  this.show_buoys_markers(vis){
//    if (vis===undefined) vis=config['show_buoys_markers'];
//    if (vis) this.markers_buoys
//
//    }
//   
//    config['show_buoys_markers']=0;
}


function FIELD(svg,type){
  this.svg=svg;
  this.type=type; // model or buoys
  this.actual='unk';
  this.layer={};
  this.names=['temp','salt','speed'];

  this.n_layers=function(what){
    var ob=$('[id^='+this.type+'_'+what+'_frame_0\\:]',this.svg);
    if (ob.length) return parseInt(ob[0].id.split(':')[1].split('_')[0]);
    else return null
  }

  this.hide=function(what){
    if (what===undefined){
      // hide all
      for (var i = 0; i < this.names.length; i++) {
        $('[id^='+this.type+'_'+this.names[i]+'_frame]',this.svg).hide();
      }
      this.actual='';
    }else{
      $('[id^='+this.type+'_'+what+'_frame]',this.svg).hide();
      this.actual='unk';
    }
  }

  this.show=function(vname,layer){
    var nLayers=this.n_layers(vname);
    if (!nLayers){ // vname not present
      this.hide();
      this.actual='none';
      return
    }

    // hide previous field/layer!
    if (this.actual==='unk') this.hide()
    else if (this.actual) this.hide(this.actual)

    layer = layer<0 ? 0:layer;
    layer = layer>nLayers-1 ? nLayers-1:layer;

    this.layer[vname]=layer;
    this.actual=vname;

    $('[id^='+this.type+'_'+vname+'_frame_'+layer+']',this.svg).show();
  }
}

function OVERLAY(svg,type,vname){
  this.svg=svg;
  this.type=type; // model, radar, buoys
  this.visible='unk';
  this.actualZoom=0;
  this.vname=vname

  this.hide=function(zoom){
    if (zoom===undefined){
      $("[id^="+this.type+"_"+this.vname+"_frame]",this.svg).hide();
      this.visible=false;
    }else{
      $("#"+this.type+"_"+this.vname+"_frame_"+zoom).hide()
      this.visible='unk';
    }
  }

  this.show=function(zoom){
    if (!zoom) zoom=get_zoom();

    // hide previous:
    // better hide all instead! When zoom changes while playing this may be a problem!!
    if(false){
      if (this.actualZoom) this.hide(this.actualZoom)
      else this.hide()
    }else this.hide();

    $("#"+this.type+"_"+this.vname+"_frame_"+zoom,this.svg).show()

    // if needed, show scale from svg frame:
    //$("#"+vname+"_frame_"+zoom+"_scale",svg).show()

    this.visible=true;
    this.actualZoom=zoom;
  }


  this.set_lw=function(){
    var lwMax=0.7;
    var zoom=[7,8,9];
    for (var i=0; i<zoom.length; i++){
      if (zoom[i]==7) var lw=lwMax;
      else var lw=lwMax/Math.pow(2,zoom[i]-7);
      $("[id^="+this.type+'_'+this.vname+"_frame_"+zoom[i]+"]",this.svg).children().css({"stroke-width":lw});
    }
  }

  this.set_color=function(color){
    $("[id^="+this.type+'_'+this.vname+"_frame]",this.svg).children().css({'stroke':color});
  }

}


function ISOBATHS(svg){
  this.svg=svg;
  this.visible='unk';
  this.actualZoom=0;

  this.hide=function(zoom){
    if (zoom===undefined){
      $("[id*=_bathy_frame]",this.svg).hide()
      this.visible=false;
    }else{
      $("[id*=_bathy_frame_"+zoom+"]",this.svg).hide()
      this.visible='unk';
    }
  }

  this.show=function(zoom){
    if (!zoom) zoom=get_zoom();

    // hide previous:
    if (this.actualZoom) this.hide(this.actualZoom)
    else this.hide()

    $("[id*=_bathy_frame_"+zoom+"]",this.svg).show()
//    $("[id^=h_bathy_frame_"+zoom+"]").children().show()

    this.visible=true;
    this.actualZoom=zoom;
  }


  this.set_lw_fs_r=function(){
    var lwMax=0.7;
    var zoom=[7,8,9];
    for (var i=0; i<zoom.length; i++){
      if (zoom[i]==7){
        var lw=lwMax;
        var fs=6;
        var rr=0.6;
      }else{
        var lw=lwMax/Math.pow(2,zoom[i]-7);
        if (zoom[i]==8){
          var fs=3.5;
          var rr=0.4;
        }else if (zoom[i]==9){
          var fs=2;
          var rr=0.2;
        }
      }

      // lw:
      $("[id^=h_bathy_frame_"+zoom[i]+"]",this.svg).children().css({"stroke-width":lw});

      // update circle radius:
      $("[id^=clab2_bathy_frame_"+zoom[i]+"] defs circle",this.svg).attr('r',rr);

      // clabels font size:
      $("[id^=clab1_bathy_frame_"+zoom[i]+"]",this.svg).children().css({'font-size':fs});
      $("[id^=clab1_bathy_frame_"+zoom[i]+"]",this.svg).children().children().css({'font-size':fs});
    }
  }

  this.set_color=function(color){
    $("[id^=h_bathy_frame]",this.svg).children().css({'stroke':color});  // lines
    $("[id^=clab1_bathy_frame]",this.svg).css({'fill':color});           // texts
    $("[id^=clab1_bathy_frame]",this.svg).children().css({'fill':color});    // texts
    $("[id^=clab1_bathy_frame]",this.svg).children().children().css({'fill':color});  // texts
    //$("[id^=clab2_bathy_frame]",this.svg).children('defs').children('circle').css({'fill':color});
    $("[id^=clab2_bathy_frame] defs circle",this.svg).css({'fill':color});

//    // need to update radius so that fill update works!!! why?
//    var zoom=[7,8,9];
//    for (var i=0; i<zoom.length; i++){
//      var rr=$("[id^=clab2_bathy_frame_"+zoom[i]+"] defs circle",this.svg).attr('r');
//      $("[id^=clab2_bathy_frame_"+zoom[i]+"] defs circle",this.svg).attr('r',rr);
//    }
  }

}

function BUOYMarkers(frame,svg){
  this.frame=frame
  this.svg=svg;
  this.visible='unk';
  this.markers=[];
  self=this;

  // create markers:
  var shadowUrl='https://unpkg.com/leaflet@1.0.2/dist/images/marker-shadow.png';

  // time range for data query:
  var s=frame.date; //M.dates[M.iactual];
  var t1=new Date(Date.UTC(parseInt(s.slice(0,4)),parseInt(s.slice(4,6)),parseInt(s.slice(6,8))));
  // remove one day if current date is at 00h
  if (t1.getUTCHours()==0){
    t1.setTime(t1.getTime()-86400*1000);
  }
  var t0 = new Date();
  var duration = 6; //In Days--> tabsquery will show duratin+1 days !
  t0.setTime(t1.getTime() -  (duration * 24 * 60 * 60 * 1000));
  var trange=t0.getUTCFullYear()+'/'+t0.getUTCMonth()+'/'+t0.getUTCDate()+' - '+ t1.getUTCFullYear()+'/'+t1.getUTCMonth()+'/'+t1.getUTCDate();

  $('[id^=buoy_]',this.svg).each(function(j,i){
    if (i.id.split('_').length==2){
      var disc=parseInt(i.getAttribute('data-discontinued'));
      //if (disc) return true; // means continue
      var data0=i.getAttribute('data-data0');
      var data1=i.getAttribute('data-data1');
      var date1=i.getAttribute('data-date1');
      var data=i.getAttribute('data-data');
      if (!data) return true; // means continue

      var bname=i.id.split('_')[1];
      var type=i.getAttribute('data-type');
      var loc=i.getAttribute('data-location').split(' ');
      var lon=parseFloat(loc[0]);
      var lat=parseFloat(loc[1]);
      console.log('buoy '+i+' '+j+' id='+i.id+' lon='+lon+' lat='+lat+' type='+type);

      if (data){
        var buoyName1='buoy.png';
        var buoyName2='buoy2.png';
      }else{
        var buoyName1='buoy_empty.png';
        var buoyName2='buoy2_empty.png';
      }

      if (type=='TABS'){
        var iw=22;
        var ih=35;
        var buoyName=buoyName1;
        var style='font-size:12px;top:2px; width:'+iw+'px';
        var shadowStyle='top:-3px';
      }else{
        var iw=35;
        var ih=31;
        var buoyName=buoyName2;
        var style='font-size:10px; letter-spacing: -1px;top:0px; width:'+iw+'px';
        var shadowStyle='top:-9px;left:3px';
      }

      var cIcon = L.divIcon({
        iconSize: new L.Point(iw, ih),
        className: 'Any!',
        iconAnchor: [iw/2,ih],
        html: ' \
           <div> \
             <img src="'+shadowUrl+'" style="position: absolute;'+shadowStyle+'"> \
             <img src="/static/icons/'+buoyName+'" style="position: absolute;top:0px"> \
             <div style="'+style+'; margin-left:-1px; text-align: center; position: absolute;">'+bname+'</div>\
           </div>',
      });
      //buoy_info='<div style="overflow: auto; max-height: 150px">SOME info about the buoy !</div>';

      var m=L.marker([lat,lon],{'icon': cIcon, 'riseOnHover': true});
      var table=type.toLowerCase();

      // pupup with data links if TABS:
      if (true){//(table=='tabs'){
        var d0=data0.split(';');
        var d1=data1.split(';');
        d=d1
        var s='';
        s+='<div style="width:170px">';
        s+='<div style="font-weight:bold; width:100%; text-align:center">TABS buoy '+bname+'</div>';
        s+='  <div style="float:left; width:130px">data available</div>';
        s+='  <div>latest</div>';
        s+='<hr>';
        var label,t,tall=[];
        for (var j=0; j<d.length; j++){
          console.log(d[j])
          if (d[j]=='ven'){
             t=date1.split('ven=')[1].split(';')[0].split(' ')[1];
             label = ' &bull; Velocity data'; //Ocean (currents, etc)'
             tall.push(t)
          }
          else if  (d[j]=='met'){
            t=date1.split('met=')[1].split(';')[0].split(' ')[1];
            label = ' &bull; Meteorological data'; //Atmosphere (wind, etc)'
            tall.push(t)
          }
          else if  (d[j]=='salt'){
            t=date1.split('salt=')[1].split(';')[0].split(' ')[1];
            label = ' &bull; Water property data'; //(salinity, etc)'
            tall.push(t)
          }
          else if  (d[j]=='wave'){
            t=date1.split('wave=')[1].split(';')[0].split(' ')[1];
            label = ' &bull; Wave data'; //Waves'
            tall.push(t)
          }
          else if  (d[j]=='ndbc'){
            t=date1.split('ndbc=')[1].split(';')[0].split(' ')[1];
            label = ' &bull; NDBC data'; // NDBC data
            tall.push(t)
          }
          else {continue;}

          console.log(tall+'--->'+mostCommon(tall))
          // most commom measurement time:
          var tModa=mostCommon(tall);

          var url='http://pong.tamu.edu/tabswebsite/subpages/tabsquery.php?Buoyname='+bname+'&table='+d[j]+'&Datatype=pic&tz=UTC&units=M&datepicker='+trange;
          s+='  <div style="float:left; width:130px">';
          s+='    <a href="'+url+'" target="_blank">'+label+'</a>';
          s+='  </div>';
          s+='  <div>'+t+'</div>';
        }
        s+='</div>';
        m.bindPopup(s,{'offset':new L.point(0,-25)});
      }


      m.on('click', function (e){

      if (false){//(table=='ndbc'){
          var url='http://pong.tamu.edu/tabswebsite/subpages/tabsquery.php?Buoyname='+bname+'&table='+table+'&Datatype=pic&tz=UTC&units=M&datepicker='+trange;
          window.open(url, '_blank');
        }
      });
      self.markers.push(m);
    }
  });


  this.show=function(){
    for (var i=0;i<this.markers.length;i++){
      this.markers[i].addTo(map);
    }
    this.visible=true;
  }

  this.hide=function(){
    for (var i=0;i<this.markers.length;i++){
      this.markers[i].removeFrom(map);
    }
    this.visible=false;
  }


  this.field_marker_init=function(){
    // to do once
    // hide buoys name labels:
    $('[id^=buoy_name_]',this.svg).hide();

    // hide info label for now:maybe needed laetr to show measurement time?
    $('[id^=buoy_info_]',this.svg).hide();

    // hide "o" showing pos of all buoys (id is buoy_<name>)
    $('[id^=buoy_]',this.svg).each(function(j,i){
      $(i).hide();
    });


  }
  
  this.field_marker_set_lw=function(vname){
   // to do at each zoom
   // sets circle radius and lw for buoys field markers!
   var zoom=get_zoom();

    var lwMax=0.7;
    if (zoom==7){
      var lw=lwMax;
      var rr=0.6;
    }else{
      var lw=lwMax/Math.pow(2,zoom-7);
      if (zoom==8){
        var rr=0.4;
      }else if (zoom==9){
        var rr=0.2;
      }
    }

    if (vname===undefined) var vnames=['temp','salt','speed'];
    else var vnames=[vname];

    for (var i=0; i<vnames.length;i++){
      // lw:
      $('[id^=buoys_'+vnames[i]+'_frame] defs circle',this.svg).css({"stroke-width":lw/3.});
      // update circle radius:
      $('[id^=buoys_'+vnames[i]+'_frame] defs circle',this.svg).attr('r',rr*5)
    }
  }

}

function BUOYS_DATA(svg){
  this.svg=svg;
  this.visible='unk';


//  $("[id^=buoy_]").click(function(){alert('mmmm')});

var buoyIcon = L.Icon.extend({
    options: {
      shadowUrl: 'https://unpkg.com/leaflet@1.0.2/dist/images/marker-shadow.png',

      iconSize:     [22, 35], // size of the icon
      shadowSize:   [30, 30], // size of the shadow
      iconAnchor:   [11, 0], // point of the icon which will correspond to marker's location
      shadowAnchor: [8, -5],  // the same for the shadow
      popupAnchor:  [-2, -20] // point from which the popup should open relative to the iconAnchor
    }
});


var buoyDivIcon = L.DivIcon.extend({
        createShadow: function(){console.log('creting shaddow')}
});


  $('[id^=buoy_]').each(function(j,i){
    if (i.id.length==6){
      var loc=i.getAttribute('data-location').split(' ');
      var lon=parseFloat(loc[0]);
      var lat=parseFloat(loc[1]);

//      var depth=parseFloat(loc[2]);

      var dType0=i.getAttribute('data-type0').split('--');
      var dType1=i.getAttribute('data-type1').split('--');
      var discont=parseInt(i.getAttribute('data-discontinued'));

      // popup contents:
      //var buoy_info='';
      var buoy_info='<div  style="font-weight: bold; color: #002266">TABS buoy '+i.id[5];
      if (discont) buoy_info+=' (discontinued)';
        buoy_info+='</div>';
      
      if (dType1.indexOf('ocean')>-1){
        var oceanInfo=i.getAttribute('data-ocean').split(';');
        buoy_info+='<div style="font-weight: bold">ocean:</div><div style="font-size: 10px">'+oceanInfo.join('<br>')+'</div>';
        buoy_info+='<div><a href="">link</a></div>';
      }
      if (dType1.indexOf('atm')>-1){
        var atmInfo=i.getAttribute('data-atm').split(';');
        buoy_info+='<div style="font-weight: bold">atm:</div>'+atmInfo.join('<br>');
        buoy_info+='<div><a href="">link</a></div>';
      }
      if (dType1.indexOf('water')>-1){
        var waterInfo=i.getAttribute('data-water').split(';');
        buoy_info+='<div style="font-weight: bold">water:</div>'+waterInfo.join('<br>');
        buoy_info+='<div><a href="">link</a></div>';
      }
      if (dType1.indexOf('wave')>-1){
        var waveInfo=i.getAttribute('data-wave').split(';');
        buoy_info+='<div style="font-weight: bold">waves:</div>'+waveInfo.join('<br>');
        buoy_info+='<div><a href="">link</a></div>';
      }
      

      var c1='', c2='', c3='', c4='', cor, buoyName;

      if (discont) buoyName='buoy_discont.png'
      else buoyName='buoy.png'

      if (dType0.indexOf('ocean')>-1){
        cor='red';
        if (dType1.indexOf('ocean')>-1) cor='white';
        c1='<div style="font-size:10px;color:'+cor+';position: absolute; width: 5px; height:5px; left: 8px; bottom:15px">&bull;</div>';

      }
      if (dType0.indexOf('atm')>-1){
        cor='red';
        if (dType1.indexOf('atm')>-1) cor='white';
        c2='<div style="font-size:10px;color:'+cor+';position: absolute; width: 5px; height:5px; left: 11px; bottom:15px">&bull;</div>';

      }
      if (dType0.indexOf('water')>-1){
        cor='red';
        if (dType1.indexOf('water')>-1) cor='white';
        c3='<div style="font-size:10px;color:'+cor+';position: absolute; width: 5px; height:5px; left: 8px; bottom:12px">&bull;</div>';
      }
      if (dType0.indexOf('wave')>-1){
        cor='red';
        if (dType1.indexOf('wave')>-1) cor='white';
        c4='<div style="font-size:10px;color:'+cor+';position: absolute; width: 5px; height:5px; left: 11px; bottom:12px">&bull;</div>';
      }

//      var m=L.marker([lat,lon]).addTo(map).bindPopup(dtype1)
      var shadowUrl='https://unpkg.com/leaflet@1.0.2/dist/images/marker-shadow.png';
var cIcon = L.divIcon({
    iconSize: new L.Point(22, 35),
    className: 'boyIcons',
    iconAnchor: [11,35],
    html: '<style>.buoyIcons{background-color: none}</style> \
           <div> \
             <img src="'+shadowUrl+'" style="position: absolute;top:-3px"> \
             <img src="/static/icons/'+buoyName+'" style="position: absolute;top:0px">'+c1+c2+c3+c4+' \
             <div style="text-align: center; position: absolute; width: 22px; top:2px">'+i.id[5]+'</div>\
             '+c1+c2+c3+c4+' \
           </div>',
});
      buoy_info='<div style="overflow: auto; max-height: 150px">'+buoy_info+'</div>';
      var m=L.marker([lat,lon],{'icon': cIcon}).addTo(map).bindPopup(buoy_info);

    }
  })

  this.hide=function(zoom){
    $("[id^=buoy_]",this.svg).hide()
    this.visible=false;
  }

  this.show=function(zoom){
    $("[id^=buoy_]",this.svg).show()
    this.visible=true;
  }


  this.set_lw_fs_r=function(){
    var lwMax=0.7;
    var zoom=[7,8,9];
  }
}

function VFieldScale(vname){
  this.visible=false;

  if (vname=='currents'){
     var left=320;
     var label='0.5 m s';
     var ytext=30;
  }else if (vname=='wind'){
    var left=230;
    var label='5 m s';
     var ytext=33;
  }

  var s=' \
  <style> \
    #'+vname+'SvgScale0 { \
      position: absolute; left: '+left+'px; top: 410px; width:80px; height: 35px; border: 0px solid green; \
      background-color: white; border-radius: 7px; box-shadow: 0px 0px 7px #888888; \
      display:none; opacity:0.8; \
      z-index:1000\
    } \
    #'+vname+'SvgScale { \
      position: absolute; left: '+left+'px; top: 410px; width:80px; height: 35px; border: 0px solid red; \
      display:none; \
      z-index:1000\
    } \
    #'+vname+'ScaleLabel { \
      fill:black; font-family:Helvetica; font-size:11px; text-anchor:middle; \
    } \
  </style> \
  \
  <div id="'+vname+'SvgScale0"></div> \
  <div id="'+vname+'SvgScale"> \
    <svg style="width:100%;height:100%"> \
      <polygon id="'+vname+'Scale" points="00,00 00,00" \
        style="stroke:black;stroke-width:1;fill:none" \
        transform="scale(1) translate(5,0)"/> \
      <text id="'+vname+'ScaleLabel" x="40" y="'+ytext+'"> \
        '+label+' <tspan baseline-shift = "super">-1</tspan> \
      </text> \
    </svg> \
  </div> \
  ';

  $('#mapsWrapper').append(s);
  //$('body').append(s);

  this.show=function(svg){
    // svg input needed for update only!
    if (!this.visible){
      $('#'+vname+'SvgScale0').show();//css({'opacity':0.8});
      $('#'+vname+'SvgScale').show();//css({'opacity':1});
      this.visible=true;
    }
    this.update(svg);
  }

  this.hide=function(){
    $('#'+vname+'SvgScale0').hide();//css({'opacity':0});
    $('#'+vname+'SvgScale').hide();//css({'opacity':0});
    this.visible=false;
  }

  this.update=function(svg){
    // update length and lw (on zoom):

    // update lenght:
    //if (svg===undefined) svg=$('svg:first');
    if (svg===undefined){
      if (M.iactual===null) return
      svg=M.frames[M.iactual].svg;
    }
    zoom=get_zoom();
//    var ob=$('#'+vname+'_frame_'+zoom+'_scale',svg);
    var ob=$('#model_'+vname+'_frame_'+zoom+'_scale',svg);
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
    this.set_lw(svg)
  }

  this.set_lw=function(svg,lw){
    if (svg===undefined){
      if (M.iactual===null) return
      svg=M.frames[M.iactual].svg;
    }

    if (lw===undefined){
      zoom=get_zoom();
//      var ob=$('#'+vname+'_frame_'+zoom+'_scale',svg);
      var ob=$('#model_'+vname+'_frame_'+zoom+'_scale',svg);
      var lw=parseFloat($(ob).children('path').css('stroke-width').replace('px',''));
//      console.log('finding lw '+lw+' -- '+svg_scale());
      lw=lw*svg_scale();
    };

//    console.log('|>>>>>>>>>>>>> set lw for scale of '+vname+'  === '+lw);
    $('#'+vname+'Scale').css({'stroke-width':lw});
  }

  this.set_color=function(color){
    //$('#'+vname+'Scale').css({'stroke':color});
    $('#'+vname+'Scale').css({'stroke':color});
  }

}

function COLORBAR(){

  this.visible=false;
  this.field='';
  this.layer=null;

  var s=' \
  <style> \
    #cbarDiv0 { \
      position: absolute; width:368px; height: 55px; top: 400px; left: 420px; border: 0px solid green; \
      background-color: white; border-radius: 7px; box-shadow: 0px 0px 7px #888888; \
      display:none; opacity:0.8;\
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
  </style> \
  \
  <div   id="cbarDiv0"> \
    <i   id="fieldLayer_up"    class="fa fa-arrow-circle-up fa-1"></i> \
    <div id="fieldLayer_num"></div> \
    <i   id="fieldLayer_down"  class="fa fa-arrow-circle-down fa-1"></i> \
  </div> \
  <div id="cbarDiv"></div> \
  ';

  $('#mapsWrapper').append(s);
  //$('body').append(s);

  var self=this;
  $('#fieldLayer_up').click(function(){
    self.change_layer(1);
    //M.frames[M.iactual].field.show(self.field,self.layer);
    M.frames[M.iactual].show_field(self.field,self.layer);
  })

  $('#fieldLayer_down').click(function(){
    self.change_layer(-1);
    //M.frames[M.iactual].field.show(self.field,self.layer); // use next line just to
    M.frames[M.iactual].show_field(self.field,self.layer);   // store vname and layerin config
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
    $('#cbarDiv0').show();//css({'opacity':0.8});
    $('#cbarDiv').show();//css({'opacity':1});
    this.visible=true;
  }

  this.hide=function(){
    $('[id^=cbarDiv]').hide()//css({'opacity':0});
    this.visible=false;
  }

  this.n_layers=function(vname){
    return $('[id^='+vname+'_cbar]').length;
  }

  this.change_layer=function(j){
    this.show_var(this.field,this.layer+j);
  }

  this.show_var=function(vname,layer){
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

    $('[id^='+vname+'_cbar_'+layer+']').show()//css({'opacity':1});
    // hide other layers:
    for (var i = 0; i < nLayers; i++) {
      if (i!=layer){
        $('[id^='+vname+'_cbar_'+i+']').hide()//css({'opacity':0});
        }
      }

    if (nLayers>1){
      $('[id^=fieldLayer]').show();//css({'opacity':1});
      $('#cbarDiv0').css({'width':368});

      // update layer num label:
      $('#fieldLayer_num').html((layer+1)+'/'+nLayers);

      // update up/down icons:
      if (layer==nLayers-1) $('#fieldLayer_up').css({'color':'#9e9e9e','cursor':'auto'});
      else      $('#fieldLayer_up').css({'color':'black','cursor':'pointer'});

      if (layer==0) $('#fieldLayer_down').css({'color':'#9e9e9e','cursor':'auto'});
      else      $('#fieldLayer_down').css({'color':'black','cursor':'pointer'});

    }else{
      $('[id^=fieldLayer]').hide()//css({'opacity':0});
      $('#cbarDiv0').css({'width':350});
    }

  }

}


function CONF_PANEL(){
  this.enabled=true;
  this.visible=false;

  var vars=['Currents','Wind','Isobaths','Radar'];
  var vars_field=['salt','temp','speed','none'];

  s='\
  <style> \
    #conf_panel input { \
      width:33px;font-size:8px; border:1px solid black;display:inline; font-family:"Courier New", Courier, monospace; \
    } \
  </style> \
  \
  <div id="conf_btn" class="menu"><i class="fa fa-cog fa-lg"></i></div> \
  <div id="conf_panel" class="menu" > \
    Colours for:';

    for (var i=0; i<vars.length;i++){
      s+='  <div style="margin:5px;">'
      s+='    '+vars[i]+':';
      s+='    <div style="float:right">';

      for (j=0;j<vars_field.length;j++){
        var color=config[vars[i].toLowerCase()+'_color'][vars_field[j]];
        var fg=hex_isLight(color) ? '#000' : '#FFF';
        s+='    <input value="'+color+'" id="input_'+vars[i].toLowerCase()+'_color_'+vars_field[j]+'" \
            style="color:'+fg+'; background-color:#'+color+'" \
            class="jscolor {closable:true,closeText:\'ok\'}" onchange=\'M.change_color("'+vars[i].toLowerCase()+'","'+vars_field[j]+'",this.jscolor)\'>';
      }
      s+='    </div>';
      s+='  </div>';
    }

  s+='\
    <br> \
    <button style="margin:5px;" type="button" class="btn">done</button> \
  </div>\
  ';

  $('#mapsWrapper').append(s);
  //$('body').append(s);

  var self=this;
  $('#conf_btn').click(function(){
    self.toggle();
  });

  $('#conf_panel button').click(function(){
    self.toggle();
  });


  this.toggle=function(){
    this.visible=show_dialog('conf_panel')
  }

}


function VARS_PANEL(){
  this.enabled=true;
  this.visible=false;

  var vars_field=['salt','temp','speed','none'];
  var vars_field_names=['Salinity','Temperature','Speed','none'];

  s='\
  <style> \
  </style> \
  \
  <div id="vars_btn" class="menu"><i class="fa fa-list-alt fa-lg"></i></div> \
  <div id="vars_panel" class="menu"> \
    <div style="background-color:#dce7f7;border-radius: 4px;"> \
      <strong>fields:</strong><br>';
      s+='      <form>';
      for (var i=0;i<vars_field.length;i++){
        s+='      <input id="radio_'+vars_field[i]+'_model" name="field" type="radio" value="'+vars_field[i]+':model"  style="cursor: pointer" \
           onclick="M.choose(this)"><label style="cursor: pointer"  for="radio_'+vars_field[i]+'_model">'+vars_field_names[i]+'</label><br>';
      }
      s+='      </form>';

      s+='\
      <hr> \
      <strong>overlay:</strong><br> \
      <input id="checkbox_currents_model" type="checkbox" value="currents:model" style="cursor: pointer" onclick="M.choose(this)"><label style="cursor: pointer"  for=checkbox_currents_model>currents</label><br> \
      <input id="checkbox_wind_model"     type="checkbox" value="wind:model" style="cursor: pointer" onclick="M.choose(this)"><label style="cursor: pointer"  for=checkbox_wind_model>wind</label><br> \
    </div> \
    \
    <strong>external:</strong><br> \
    <input id="checkbox_currents_radar"    type="checkbox" value="currents:radar" style="cursor: pointer" onclick="M.choose(this)"><label style="cursor: pointer"  for=checkbox_currents_radar>Radar</label><br> \
    <div style="width: 100%"> \
      <div style="width: 40px; float: left;">Buoys</div> \
      <div style="margin-left: 42px;"> \
         <input id="checkbox_fields_buoys"   type="checkbox" value="fields:buoys"   style="cursor: pointer" onclick="M.choose(this)">fields <br>\
         <input id="checkbox_currents_buoys" type="checkbox" value="currents:buoys" style="cursor: pointer" onclick="M.choose(this)">currents <br>\
         <input id="checkbox_wind_buoys"     type="checkbox" value="wind:buoys"     style="cursor: pointer" onclick="M.choose(this)">wind <br>\
         <input id="checkbox_markers_buoys"  type="checkbox" value="markers:buoys"   style="cursor: pointer" onclick="M.choose(this)">markers \
      </div> \
    </div> \
    <!--<input id="checkbox_buoys_curr"    type="checkbox" value="buoys_curr" style="cursor: pointer" onclick="M.choose(this)">buoys: currents<br> \
    <input id="checkbox_buoys_wind"    type="checkbox" value="buoys_wind" style="cursor: pointer" onclick="M.choose(this)">buoys_ wind<br> \
    --><hr> \
    <strong>aux:</strong><br> \
    <input id="checkbox_isobaths_model" type="checkbox"  value="isobaths:model" style="cursor: pointer" onclick="M.choose(this)"><label style="cursor: pointer"  for=checkbox_isobaths_model>isobaths</label><br> \
    <input id="checkbox_river"    type="checkbox"  style="cursor: pointer" onclick="M.river.show()"><label style="cursor: pointer"  for=checkbox_river>river</label><br> \
  </div>\
  ';

  $('#mapsWrapper').append(s);
  //$('body').append(s);

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


function DATE_SELECT(){

  s=' \
  <style> \
    #date_selector { \
      width: 230px; text-align:center; \
    } \
    #current_date { \
      width: 80px; text-align:center; border: 0px solid #cccccc; border-right:0px; \
    } \
    #current_hour { \
      width: 24px; text-align:center; border: 0px solid #cccccc; border-left:0px; \
      position: relative; right: 20px; \
    } \
    #date_selectorHide { \
      width: 190px; background-color: white; opacity:0.6; padding: 4px 5.5px;border-radius: 4px; \
      display:none; \
      z-index:1000; \
    } \
    #anim_btn { \
      color:#9d0202; margin-left:10px\
    } \
  </style> \
  \
  <div id="date_selector" class="menu"> \
    <div id="previous" class="item_selector"><i class="fa fa-step-backward fa-lg"></i></div> \
    <input id="current_date" readonly> \
    <input id="current_hour" readonly> \
    <div id="next" class="item_selector"><i class="fa fa-step-forward fa-lg"></i></div> \
    <div id="anim_btn" class="item_selector"><i class="fa fa-play-circle-o fa-lg" onclick="M.anim.show_dialog()"></i></div> \
  </div> \
  \
  <div id="date_selectorHide">&nbsp;</div> \
  <div style="display: none"> \
    <img style="position: relative; right: -28px; top: 3px;" id="calImg"  src="js/date_picker/calendar-blue.gif" class="trigger"> \
  </div> \
  ';

  $('#mapsWrapper0').append(s);
  //$('#mapsWrapper').append(s);
  //$('body').append(s);

  $('#date_selector')
    .on('mouseover',function(){
      $(this).find('*').css({'background-color':$(this).css('background-color')});
    })
    .on('mouseout',function(){
      $(this).find('*').css({'background-color':$(this).css('background-color')});
    });


  // show date picker:
  // allow more 7 days from today:
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  var maxDateStr =format_date(maxDate)[1].split(' ')[0];
  $('#current_date').datepick({showOnFocus: false, showTrigger: '#calImg',
  minDate: '2010-01-01', maxDate: maxDateStr,
  dateFormat: 'yyyy-mm-dd',
    onSelect: function(date) {
       date=format_date(new Date(date))[0].slice(0,8)+$('#current_hour').val().slice(0,2);
       M.load_date(date,true);
      }
  });

}

function ANIM(){

  this.newDates=false
//  this.loaded=false;

//  this.svg={}
  this.dates=[]

  var self=this

  s=' \
  <style> \
    #anim_panel { \
      padding-top:2px; padding-bottom:3px; height:60px; \
      display:none \
    } \
    #anim_panel_info0 { \
      text-align: left; Hheight:10px;\
    } \
    #anim_panel_help_btn { \
      color:#98bccf; cursor:pointer \
    } \
    #anim_panel_info1 { \
      font-size:11px;display:inline \
    } \
    #playCont { \
      height:20px; width: 200px; margin-bottom: 5px \
    } \
    #anim_panel_info2 { \
      z-index: 11; position: absolute; width: 70%; background-color:white \
    } \
    #anim_panel_dates_inputDiv { \
      z-index: 10; position: absolute; width: 70%; height:10px \
    } \
    #anim_panel_dates_input { \
      border:0px;  background-color:transparent \
    } \
    #anim_panel_okLoad { \
      z-index: 12; position: absolute; width: 30%; left:70%; \
      display:none; cursor:pointer \
    } \
    #anim_panel_okLoadi { \
      background-color: #bfc8d6; margin-top: 2px;padding: 2px 3px 0px 3px; border: 1px solid #a3acb8; border-radius: 3px; \
    } \
  </style> \
  \
  <div id="anim_panel"> \
    <div id="anim_panel_info0"><i id="anim_panel_help_btn" class="fa fa-question-circle fa"></i><div id="anim_panel_info1"></div></div> \
    <div id="playCont"></div> \
    <div id="anim_panel_info2">&nbsp;</div> \
    <div id="anim_panel_dates_inputDiv"><input id="anim_panel_dates_input"></div> \
    <div id="anim_panel_okLoad"><i id="anim_panel_okLoadi" class="fa fa-download fa-1"> load</i></div> \
    <div>&nbsp;</div> \
  </div> \
  <div style="display:none"> \
    <img style="position: relative; right: -130px; top: -42px;" id="calImg2" src="js/date_picker/calendar-blue.gif" class="trigger"> \
  </div> \
  ';

  $('#date_selector').append(s);

  $('#anim_panel_help_btn').click(function(){
    if ($('#anim_panel_info1').html()){
      $('#anim_panel_info1').html('');
      $(this).css({color:'#98bccf'});
    }
    else{
      $('#anim_panel_info1').html(' animation: choose two dates &rarr; load &rarr; play');
      $(this).css({color:'#bfc8d6'});
    }
  });

  // show player:
  play=new Play('playCont',0,function(i){
    self.replace(i);
   }
  );

  this.replace=function(i){
    if (this.dates[i])
    M.show_frame(M.dates.indexOf(this.dates[i]));
  }

  // show date picker:
  // allow more 7 days from today:
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  var maxDateStr =format_date(maxDate)[1].split(' ')[0];

  $('#anim_panel_dates_input').datepick({showOnFocus: false, showTrigger: '#calImg2',
  minDate: '2010-01-01', maxDate: maxDateStr,
  dateFormat: 'yyyy-mm-dd',
  rangeSelect: true,
  onClose: function(dates) {
    if (dates[1].getTime()==dates[0].getTime()){
        var date0 =format_date(dates[0])[0].slice(0,8);

        // add one day to final date
        var date1=dates[1];
        date1.setDate(date1.getDate() + 1);
        var date1 =format_date(date1)[0].slice(0,8);

        self.choose_dates(date0,date1)
    }
    play.update_n(0);
  },
  onSelect: function(dates) {
      if (dates[1]>dates[0]){

        //read server number of frames and make okload avaiblable
        var date0 =format_date(dates[0])[0].slice(0,8);

        // add one day to final date
        var date1=dates[1];
        date1.setDate(date1.getDate() + 1);
        var date1 =format_date(date1)[0].slice(0,8);

        self.choose_dates(date0,date1)
      }else{
        $('#anim_info').html('please select 2 different dates');
        $('#anim_ok_load').hide;
      }
    }
  });

  this.show_dialog=function(){
    var ob=$('#anim_panel');
    if (ob.css('display')=='none'){
      $("#anim_panel").children().hide();
      $("#anim_panel").children().fadeIn(500);
      $("#anim_panel").fadeIn(500);
      $('#anim_btn').css({'color':'#396fc2'});
      $('#date_selectorHide').show();

      if (this.newDates){// && !this.loaded){
          $('#anim_panel_okLoad').show()
        }else{
          $('#anim_panel_okLoad').hide()
        }

    }else{
      $("#anim_panel").children().fadeOut(200);
      $("#anim_panel").slideUp();
      $('#anim_btn').css({'color':'#9d0202'});
      $('#date_selectorHide').hide();
    }
  }

  this.choose_dates=function(date0,date1){
    this.newDates=true

    // get number of frames:
    M.times(date0,date1,function(t){

      // format dates:
      self.dates=new Array(t.length);
      for (var i=0;i<t.length;i++){
        self.dates[i]=format_date(new Date(t[i]))[0];
      }

      // show number of frames:
      $('#anim_panel_info2').html('frames to load: '+t.length);

      // show load button:
      $('#anim_panel_okLoad').show();

      // set button task:
      $('#anim_panel_okLoad').off('click')
                             .click(function(){self.load();});

    });
  }

  this.load=function(){//date0,n){
    //frame.load_anim(date0,n,0,[$('#anim_panel_info2'),'ready to play'])
    M.load_dates(this.dates,0,
       function(I){ // atLoad
         $('#anim_panel_info2').html('loading '+(I+1)+' of '+self.dates.length);
       },
       function(){ // atEnd
         $('#anim_panel_info2').html('ready to play')
       }
    );


    this.newDates=false
//    this.loaded=true

    // hide load button:
    $('#anim_panel_okLoad').hide();

    // update player:
    play.stop()
    play.update_n(this.dates.length)

  }

}

function RIVER(){
  this.visible=false;
  //this.date={year:0,month:0};
  this.iactual=null;
  this.frames=[];
  this.dates=[];
  this.limits='050 050';

  var self=this;

  //var labL=['025','050','100','200'];
  var labL=['200','100','050','025'];
  var strL=['-2y','-1y','-&frac12;y','-&frac14;y']
  var labM=['000','025','050','100','200'];
  var strM=['+0y','+&frac14;y','+&frac12;y','+1y','+2y'];

  s='\
  <style> \
    #rivDiv { \
      position: absolute; top: 240px; left: 520px; border: 0px solid red; display:none; \
      background-color: white; opacity:0.8;  border-radius: 7px; box-shadow: 0px 0px 7px #888888; \
      z-index:1000 \
    } \
  </style> \
  <div id="rivDiv"> \
   <div style="cursor: pointer; font-size:12px;"> \
     &nbsp; \
     <div style="float:left; padding-left:5px; padding-top:2px;">';
       for (var i = 0; i < labL.length; i++) {
         s+='       <div id="chriv_l_'+labL[i]+'" onmouseover=this.style.color="blue" \
                   onmouseout=this.style.color="black"  style="display:inline" onclick="M.river.choose(\''+labL[i]+'\',null)">'+strL[i]+'</div>';
       }
      s+='     </div>\
     <div style="float:right; padding-right:5px; padding-top:2px">';
       for (var i = 0; i < labM.length; i++) {
         s+='       <div id="chriv_m_'+labM[i]+'" onmouseover=this.style.color="blue" \
                   onmouseout=this.style.color="black"  style="display:inline" onclick="M.river.choose(null,\''+labM[i]+'\')">'+strM[i]+'</div>';
       }
  s+='\
     </div>\
   </div>\
   <div value="050 050" id="river" style="width:250px"></div>\
  </div>';

  $('#mapsWrapper0').append(s);


  this.show=function(vis){
    if (vis===undefined)
    var vis=$('#checkbox_river').prop('checked');

    if (vis) $('#rivDiv').show();
    else $('#rivDiv').hide();

    this.visible=vis;
    $('#checkbox_river').prop('checked',vis);
  }
  this.show(0);

  this.load=function(date){
    year=parseInt(date.slice(0,4));
    month=parseInt(date.slice(4,6));
    var ym=date.slice(0,6)
    //if (!this.dates[this.iactual]) return

    if (this.dates[this.iactual]===ym) return

    $.get(tabs_dir+'/data/svg/river/'+year+'/'+month,function(data){
      var date=format_date(new Date(data.time))[0];
      var svg=$($.parseXML(data.data)).children('svg');
      self.frames.push(svg);
      self.dates.push(ym);

      $('#river svg').detach();
      $('#river').append(svg);
      $('#river svg').css({width:'250px',height:'130px'});
      self.choose();
    });
  }

  this.choose=function(labLess,labMore){

    var curr=this.limits.split(' ');
    if (labLess===null || labLess===undefined) labLess=curr[0];
    if (labMore===null || labMore===undefined) labMore=curr[1];

    this.limits=labLess+' '+labMore;

    $('[id^=river_]',$('#river svg')).hide();
    $('#river_'+labLess+'_'+labMore,$('#river svg')).show();

    $('[id*=chriv]').css({'background-color':''});
    $('#chriv_l_'+labLess).css({'background-color':'#9660bc'});
    $('#chriv_m_'+labMore).css({'background-color':'#9660bc'});

  }

  this.load('201607')
  //M.river.show()
  //this.choose(this.limits.split(' ')[0],this.limits.split(' ')[1])

}
