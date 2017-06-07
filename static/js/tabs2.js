
var im;
function Master(){

//  this.iactual=null;
  this.date=undefined;
  var self=this;

  this.date_select=new DateSelect();
  this.anim=new Anim();
  this.vars_panel=new VarsPanel();
  this.field=new Field();
  this.colorbar=new Colorbar();
  this.colorbar.load();
  //this.vfield=new Vfield();
  //this.vfield_scale=new VFieldScale('currents');
  this.model_currents=new Vfield('model','currents');
  this.radar_currents=new Vfield('radar','currents');
  this.buoys_currents=new Vfield('buoys','currents');
  this.currents_scale=new VFieldScale('currents');

  this.model_wind=new Vfield('model','wind');
  this.buoys_wind=new Vfield('buoys','wind');
  this.wind_scale=new VFieldScale('wind');

  this.buoys_field=new BuoysField();
  this.buoys_markers=new BuoysMarkers(this.buoys_field);


  $.get("/location",function(res){
    var geoShape=JSON.parse(res[0]);
    res=res[1];
    if (false){
      var xc=(res[0]+res[1])/2.,
          yc=(res[2]+res[3])/2.;

      map.setView([yc,xc]);
      map.fitBounds([[res[2],res[0]],[res[3],res[1]]]);
    }

    var imageUrl = '/images/empty_rect.png',
    imageBounds = [[res[2],res[0]],[res[3],res[1]]];
    im=L.imageOverlay(imageUrl, imageBounds).addTo(map);
    // maybe hide image during zoom?
    //$('img.leaflet-image-layer.leaflet-zoom-animated').addClass('leaflet-zoom-hide');

    function projectPoint(x, y) {
      var point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    var transform = d3.geo.transform({point: projectPoint});
    path = d3.geo.path().projection(transform);
    fixedGeoShape = geoShape;



    d3.xml("base.svg", "image/svg+xml", function(svgImg) {
        svg=map.getPanes().overlayPane.appendChild(svgImg.documentElement);
        d3.select(svg).attr('class','leaflet-zoom-hide'); // to hide during zoom !
        map.on("zoomend", Reset);
        Reset();
        self.svg=$('.leaflet-overlay-pane svg');
        self.svg.data('onreset',self.on_reset);

  // load all times (as yyyymmddhh string):
  self.times(0,0,0,function(t){
    self.all_times=t;
    self.set_time_range();
    self.load_nearest(true);
    self.advance('evt',0); // set click events for time selector arrows
    self.vars_panel.toggle();
  })




    });
  });

  this.on_reset=function(){
    console.log('inside reset');
    self.show_frame(this.date);
  }

  this.times=function(date0,date1,dt,func){
    $.get(tabs_dir+'/time/load/'+date0+'/'+date1+'/'+dt,function(data){
      if (func) func(data)
    })
  }

/*
  // load all times (as yyyymmddhh string):
  this.times(0,0,0,function(t){
    self.all_times=t;
    self.set_time_range();
    self.load_nearest(true);
    self.advance('evt',0); // set click events for time selector arrows
    self.vars_panel.toggle();
  })
*/

  this.set_time_range=function(){
    // sets time range of datepick
    var date0=this.all_times[0],
        date1=this.all_times.slice(-1)[0],
        ymd0=date0.slice(0,4)+'-'+date0.slice(4,6)+'-'+date0.slice(6,8),
        ymd1=date1.slice(0,4)+'-'+date1.slice(4,6)+'-'+date1.slice(6,8);

    $('#current_date_pick').datepick('option', {'minDate':ymd0,'maxDate':ymd1});
    $('#anim_panel_dates_input').datepick('option', {'minDate':ymd0,'maxDate':ymd1});
  }

  this.show_time=function(date){
    var ymd=date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8);
    var hh=date.slice(8,10)
    $('#current_date_pick').val(ymd);
    $('#current_date').val(ymd+' '+hh+'h');
  }


  this.advance=function(evt,n){

    var date0=this.date;//all_times[this.iactual];
    if (date0===undefined) return
    var date=this.next_date(date0,n);
    if (date===undefined) return

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

  this.next_date=function(date,n){
    if (n===undefined) n=1;
    var i=this.all_times.indexOf(date)
    if (i<0){
      if (date<this.all_times[0]) i=0
      else if (date>this.all_times.slice(-1)[0]) i=this.all_times.length-1
      else{ // nearest
        var d1=this.all_times.find(function(e){return e>=date})
        var d0=this.all_times.find(function(e){return e<=date})

        // which is nearest, d0 or d1?
        var d0_str=d0.slice(0,4)+'-'+d0.slice(4,6)+'-'+d0.slice(6,8)+' '+d0.slice(8,d0.length)+':00';
        var d1_str=d1.slice(0,4)+'-'+d1.slice(4,6)+'-'+d1.slice(6,8)+' '+d1.slice(8,d1.length)+':00';
        var d__str=date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+' '+date.slice(8,date.length)+':00';
        var t0=new Date(d0_str).getTime()
        var t1=new Date(d1_str).getTime()
        var t =new Date(d__str).getTime()

        if ((t1-t)>(t-t0))
        var T=d0;
        else
        var T=d1;
        return T
      }
    }

    return this.all_times[i+n]
  }

  this.load_nearest=function(show){
    var now=format_date(new Date())[0];
    self.load_next(0,show,now);
  }

  this.load_next=function(n,show,date0){
    if (date0===undefined) date0=this.date;//all_times[this.iactual]
    if (show===undefined) show=false;

    date=this.next_date(date0,n);
    this.load_date(date,show)
  }

  this.load_date=function(date,show){
    if (this.all_times.indexOf(date)===-1)
      date=this.next_date(date,0);

    this.show_frame(date,show);

/*    this.date=date;
    this.show_time(this.date);
//    this.advance('evt',0); // set click events for time selector arrows
// needed here!?

    self.field.load(date,'salt',0)
*/
  }

  this.show_frame=function(date,Show){
    if (Show===undefined) Show=true;
    this.date=date;
    this.show_time(this.date);
//    this.advance('evt',0); // set click events for time selector arrows
// needed here!?

    // field:
    var vname=config.field;
    if (vname=='none') this.colorbar.hide();
    else  this.colorbar.show_var(vname,config[config.field+'_layer']);

    this.field.load(date,config.field,config[config.field+'_layer'],Show);
    var checkBox=$('#radio_'+vname+'_model');
    if (Show && !checkBox.prop('checked'))
    checkBox.prop('checked',1);

    // set color of overlays according to the field shown:
    if (Show){
      // currents:
      if (config.show_currents_model)
      this.model_currents.set_color(config.currents_color[vname]);

      // radar:
      if (config.show_currents_radar)
      this.radar_currents.set_color(config.radar_color[vname]);

      // buoys currents:
      if (config.show_currents_buoys)
      this.buoys_currents.set_color(config.buoys_color[vname]);

      // buoys wind:
      if (config.show_wind_buoys)
      this.buoys_wind.set_color(config.buoys_color[vname]);

      // wind:
      if (config.show_wind_model)
      this.model_wind.set_color(config.wind_color[vname]);

      // isobaths: TODO

      // set color for currents scale:
      if (config.show_currents_model)
      this.currents_scale.set_color(config.currents_color[vname]);
      else if (config.show_currents_radar)
      this.currents_scale.set_color(config.radar_color[vname]);
      else if (config.show_currents_buoys)
      this.currents_scale.set_color(config.buoys_color[vname]);

      // set color for wind scale:
      if (config.show_wind_model)
      this.wind_scale.set_color(config.wind_color[vname]);
      else if (config.show_wind_buoys)
      this.wind_scale.set_color(config.buoys_color[vname]);

    }

    //------------------------- buoys fields
    checkBox=$('#checkbox_field_buoys');
    if (Show) checkBox.prop('checked',config.show_field_buoys);
    //
    if (config.show_field_buoys){
      this.buoys_field.load(date,Show,vname,config[config.field+'_layer']);
    }else{
      if (Show) this.buoys_field.hide();
    }

    //------------------------- currents
    // model currents:
    //
    var zoom=get_zoom();
    var dij,scale;
    if (zoom<=7){
      dij=7;
      scale=0.07;
    }else if  (zoom==8){
      dij=7;
      scale=0.04;
    }else if  (zoom>=9){
      dij=5;
      scale=0.02;
    }

    // about scale vector:
/////////    var overwrite=false;
    var scaleValue=0.5;
    checkBox=$('#checkbox_currents_model');
    if (Show) checkBox.prop('checked',config.show_currents_model);
    //
    if (config.show_currents_model){
//      alert((zoom==8)+'--'+zoom+' dij, scale= '+dij+' '+scale);
      this.model_currents.load(date,Show,dij,scale);
      if (Show){
         this.model_currents.gen_scale(scale,scaleValue);///////////,overwrite);
         //if (!this.currents_scale.visible)
         this.currents_scale.show();
      }
    }else{
      if (Show){
        // hide currents:
        this.model_currents.hide();
        // hide currents_scale if not needed for other overlay!
        if (!config.show_currents_radar && !config.show_currents_buoys)
        this.currents_scale.hide();
      }
    }

    // radar currents:
    if  (zoom==9) dij=1;
    else dij=2;
    checkBox=$('#checkbox_currents_radar');
    if (Show) checkBox.prop('checked',config.show_currents_radar);
    //
    if (config.show_currents_radar){
      this.radar_currents.load(date,Show,dij,scale);
      if (Show){
         this.model_currents.gen_scale(scale,scaleValue);///////////,overwrite);
         this.currents_scale.show();
      }
    }else{
      if (Show) this.radar_currents.hide();
        // hide currents_scale if not needed for other overlay!
        if (!config.show_currents_model && !config.show_currents_buoys)
        this.currents_scale.hide();
    }

    // buoys currents:
    dij=1;
    checkBox=$('#checkbox_currents_buoys');
    if (Show) checkBox.prop('checked',config.show_currents_buoys);
    //
    if (config.show_currents_buoys){
      this.buoys_currents.load(date,Show,dij,scale);
      if (Show){
         this.model_currents.gen_scale(scale,scaleValue);
         this.currents_scale.show();
      }
    }else{
      if (Show) this.buoys_currents.hide();
        // hide currents_scale if not needed for other overlay!
        if (!config.show_currents_model && !config.show_currents_radar)
        this.currents_scale.hide();
    }

    //------------------------- wind
    // model wind:
    //
    var zoom=get_zoom();
    var dij,scale;
    if (zoom<=7){
      dij=5;
      scale=0.07;
    }else if  (zoom==8){
      dij=4;
      scale=0.04;
    }else if  (zoom>=9){
      dij=3;
      scale=0.02;
    }
    //dij=1
    scale=scale/10
    var scaleValue=5;
    checkBox=$('#checkbox_wind_model');
    if (Show) checkBox.prop('checked',config.show_wind_model);
    //
    if (config.show_wind_model){
      this.model_wind.load(date,Show,dij,scale);
      if (Show){
         this.model_wind.gen_scale(scale,scaleValue);
         this.wind_scale.show();
      }
    }else{
      if (Show){
        // hide wind:
        this.model_wind.hide();
        // hide wind_scale if not needed for other overlay!
        if (!config.show_wind_buoys)
        this.wind_scale.hide();
      }
    }

    // buoys wind:
    dij=1;
    checkBox=$('#checkbox_wind_buoys');
    if (Show) checkBox.prop('checked',config.show_wind_buoys);
    //
    if (config.show_wind_buoys){
      this.buoys_wind.load(date,Show,dij,scale);
      if (Show){
         this.model_wind.gen_scale(scale,scaleValue);
         this.wind_scale.show();
      }
    }else{
      if (Show) this.buoys_wind.hide();
        // hide currents_scale if not needed for other overlay!
        if (!config.show_wind_model)
        this.wind_scale.hide();
    }

    // buoys markers:
    checkBox=$('#checkbox_markers_buoys');
    if (Show) checkBox.prop('checked',config.show_markers_buoys);
    //
    if (config.show_markers_buoys){
      this.buoys_markers.load(date,Show);
    }else{
      if (Show) this.buoys_markers.hide();
    }

  }

  this.choose=function(ob){
    if (!this.date) return

    var vname = ob.value.split(':')[0],
    type  = ob.value.split(':')[1],
    vis=$(ob).prop('checked');

    // radio buttons:
    if (config.vars_field.indexOf(vname)>-1){
      config.field=vname;
      this.show_frame(this.date);

    // check boxes:
    }else{// if (['currents','wind','isobaths','markers'].indexOf(vname)>-1){
      config['show_'+vname+'_'+type]=vis;
      this.show_frame(this.date);

    }
    console.log(vname+'--'+vis+'--'+type);
  }


  this.load_frames=function(dates){

    // model field
    if (config.field!=='none'){
      this.field.load_dates(dates,0,config.field,config[config.field+'_layer'],
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading fields...');//field '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           //$('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // model currents
    if (config.show_currents_model){
      this.model_currents.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading currents...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // model wind
    if (config.show_wind_model){
      this.model_wind.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading wind...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // radar currents:
    if (config.show_currents_radar){
      this.radar_currents.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading radar...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // buoys field:
    if (config.show_field_buoys){
      this.buoys_field.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading buoys field...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // buoys currents:
    if (config.show_currents_buoys){
      this.buoys_currents.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading buoys currents...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }

    // buoys wind:
    if (config.show_wind_buoys){
      this.buoys_wind.load_dates(dates,0,
         function(I){ // atLoad
           $('#anim_panel_info2').show();
           $('#anim_panel_info2').html('loading buoys wind...');//uv '+(I+1)+' of '+dates.length);
         },
         function(){ // atEnd
           $('#anim_panel_info2').show().html('ready')
           $('#anim_panel_info2').fadeOut(3000);
         }
      );
    }


  }


}

function Frame(){
  var self=this;

//  this.load=function(date,vname,layer){
//    $.get("/location",function(res){
//    
//  }

}

/*
function _arrayBufferToBase64(uarr) {
    var strings = [], chunksize = 0xffff;
    var len = uarr.length;

    for (var i = 0; i * chunksize < len; i++){
        strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
    }

    return strings.join("");
}
*/

function Field(){
  var self=this;
  this.cache={}
  this.actual=null;


  this.load_dates=function(dates,i,vname,layer,atLoad,atEnd){
    if (i===undefined) i=0
    var date=dates[i];
    if (atLoad) atLoad(i);

    var zz=map.getZoom();
    if (zz==6) dpi=75;
    if (zz==7) dpi=150;
    if (zz==8) dpi=300;
    if (zz==9) dpi=600;

    var ckey=date+'_'+vname+'_'+layer+'_'+dpi;
    if (!self.cache[ckey]){
      $.get(tabs_dir+'/field/load/'+date+'/'+vname+'/'+layer+'/'+dpi,function(res){
        var status=res[1];
        res=res[0];
        if (res) self.cache[ckey]=res;

        i++;
        if (i<dates.length){
          self.load_dates(dates,i,vname,layer,atLoad,atEnd);
        }else{
          if (atEnd) atEnd();
        }

      });
    }else{
      i++;
      if (i<dates.length)  this.load_dates(dates,i,vname,layer,atLoad,atEnd);
      else if (atEnd) atEnd();
    }

  }

/*
  this.test=function(){
  DATES=["2016123020", "2016123021", "2016123022", "2016123023", "2016123100", "2016123101", "2016123102", "2016123103", "2016123104", "2016123105"];
//  DATES=m.all_times.slice(0,10);
  this.load_dates(DATES,0,'salt',0,
       function(I){ // atLoad
         $('#anim_panel_info2').show();
         $('#anim_panel_info2').html('loading '+(I+1)+' of '+DATES.length);
       },
       function(){ // atEnd
         $('#anim_panel_info2').show().html('ready to play')
         $('#anim_panel_info2').fadeOut(3000);
       }
  );
  }
*/

  this.load=function(date,vname,layer){
    if (vname=='none'){
      im.setUrl('');
      return
    }

    var s=JSON.stringify([date,vname,layer,map.getZoom()])
    if (this.actual===s) return

    this.actual=s;

    var zz=map.getZoom();
    if (zz==6) dpi=75;
    if (zz==7) dpi=150;
    if (zz==8) dpi=300;
    if (zz==9) dpi=600;

    var ckey=date+'_'+vname+'_'+layer+'_'+dpi;
    if (self.cache[ckey])
      im.setUrl(self.cache[ckey]);
    else {
      $.get(tabs_dir+'/field/load/'+date+'/'+vname+'/'+layer+'/'+dpi,function(res){
        var status=res[1];
        res=res[0];
        im.setUrl(res);
        if (res) self.cache[ckey]=res;
      });
    }
  }

//  this.show=function
}

function round2(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}


function Vfield(type,vname){
  var self=this;

  this.type=type; // model, radar, buoys
  this.vname=vname; // currents, wind

  this.cache={}
  this.cache2={}
  this.actual=null;
  this.coords=null;

//  this.scale1=50*1/1000; // standard value...
//  this.scale=1;
//  this.dij=7;


  this.load_dates=function(dates,i,atLoad,atEnd){

    var dij=parseInt(this.actual.split('_')[1])
    var scale=parseFloat(this.actual.split('_')[2])
    console.log('VERIFICAR!!! '+dij+'--'+scale);

    if (i===undefined) i=0
    var date=dates[i];
    if (atLoad) atLoad(i);

    if (!this.cache[date]){
      $.get(tabs_dir+'/vfield/load/'+type+'/'+vname+'/'+date,function(res){
        var status=res[1];
        res=res[0];
        self._show(res,date,false,dij,scale);
        if (res) self.cache[date]=res;

        i++;
        if (i<dates.length){
          self.load_dates(dates,i,atLoad,atEnd);
        }else{
          if (atEnd) atEnd();
        }

      });
    }else{
      this._show(this.cache[date],date,false,dij,scale);
      i++;
      if (i<dates.length)  this.load_dates(dates,i,atLoad,atEnd);
      else if (atEnd) atEnd();
    }

  }

/*
  this.test=function(){
  DATES=["2016123020", "2016123021", "2016123022", "2016123023", "2016123100", "2016123101", "2016123102", "2016123103", "2016123104", "2016123105"];
//  DATES=m.all_times.slice(0,10);
  this.load_dates(DATES,0,
       function(I){ // atLoad
         $('#anim_panel_info2').show();
         $('#anim_panel_info2').html('loading '+(I+1)+' of '+DATES.length);
       },
       function(){ // atEnd
         $('#anim_panel_info2').show().html('ready to play')
         $('#anim_panel_info2').fadeOut(3000);
       }
  );
  }
*/

  this.load=function(date,Show,dij,scale){

    var s=date+'_'+dij+'_'+scale;
    //alert(s);
    if (this.actual===s){
      console.log('No need to update vfield!');
      return
    }

    this.actual=s;
    console.log(this.actual);

    var ckey=date
    if (self.cache[ckey])
          self._show(self.cache[ckey],date,Show,dij,scale);
    else {
      console.log('LOADING UV')
      $.get(tabs_dir+'/vfield/load/'+type+'/'+vname+'/'+date,function(res){

//        $('#anim_panel_info2').show()
//        $('#anim_panel_info2').html('loading uv '+date);


        var status=res[1];
        if (status){
          console.log('ERROR with vfield !!');
          self.hide();
          return
        }

        res=res[0];
        console.log('- done LOADING UV')

        if (self.coords===null){
           $.get(tabs_dir+'/vfield/loadxy/'+type+'/'+vname,function(resxy){
             var status=resxy[1];
             resxy=resxy[0];
             self.coords=resxy;///////////////{'x':res[0],'y':res[1]}
             if (status){
                console.log('ERROR with vfield !!');
                if (Show) self.hide();
                return
             }else self._show(res,date,Show,dij,scale);
           });
        }else{
          self._show(res,date,Show,dij,scale);
        }

        if (res) self.cache[ckey]=res;

//        $('#anim_panel_info2').html('ready');
//        $('#anim_panel_info2').fadeOut(1000);
      });
    }
  }

  this._show=function(data,date,Show,dij,scale){

//        if (Show===undefined) Show=true;
//
//        if (dij==undefined) dij=this.dij;
//        else this.dij=dij;
//
//        if (scale==undefined) scale=this.scale;
//        else this.scale=scale;
//
//        var scale1=50*1/1000; // standard value...
//        scale=scale*scale1;

        var ckey=date+'_'+scale+'_'+dij;
        if (self.cache2[ckey]){
          var pts=self.cache2[ckey];
        }else{

          if (!data) data=this.cache[date];

          var H=parseFloat($('svg').attr('viewBox').split(' ')[3]);
          var i,p;
          var pts='';

          for (var xi=0;xi<this.coords.xi; xi+=dij){
            for (var eta=0;eta<this.coords.eta; eta+=dij){
              i=xi*this.coords.eta+eta;
              //i=eta*this.coords.xi+xi;

              if ((data.u[i]!==0) || (data.v[i]!==0)){
                if (vname=='wind')
                p=seta2d(this.coords.x[i],H-this.coords.y[i],data.u[i]*scale,-data.v[i]*scale);
                else
                p=seta(this.coords.x[i],H-this.coords.y[i],data.u[i]*scale,-data.v[i]*scale);

                pts+=' M'+round2(p[0][0])+' '+round2(p[0][1]);
                for (var j=1; j<p.length; j++){
                  pts+=' L'+round2(p[j][0])+' '+round2(p[j][1]);
                }
              }

            }
          }
          self.cache2[ckey]=pts;
        }
        //if (Show) $('svg #vfield').attr('d',pts);
        if (Show) $('svg #'+type+'_'+vname).attr('d',pts);


  }

  this.hide=function(){
    //$('svg #vfield').attr('d','');
    $('svg #'+type+'_'+vname).attr('d','');
    this.actual=null;
  }

  this.gen_scale=function(scale,value){/////////,overwrite){
    if (this.scale_scale==undefined) this.scale_scale=0;//scale0=parseFloat(this.actual.split('_')[2])

//    if (overwrite===undefined) overwrite=false;

    var ob=$('svg #'+vname+'_scale');
//    alert(scale+'  '+scale0);

    if (!ob.attr('d') || (this.scale_scale!==scale)){/////overwrite){
      this.scale_scale=scale;
      var H=parseFloat($('svg').attr('viewBox').split(' ')[3]);
      var pts='';
      var p=seta(10,H-10,1000*value*scale,0);

      pts+=' M'+round2(p[0][0])+' '+round2(p[0][1]);
      for (var j=1; j<p.length; j++){
        pts+=' L'+round2(p[j][0])+' '+round2(p[j][1]);
      }
      ob.attr('d',pts)
      console.log('creating scale '+pts);
      ob.css({'opacity':0});//hide();

    }else console.log(vname+' scale already created!');
  }

  this.set_color=function(color){
    if (!color.startsWith('rgb') && color[0]!='#') color='#'+color;

    $('svg #'+type+'_'+vname).css({'stroke':color});

    // fill wind arrows with stroke color and transparency?
    if (vname=='wind')
    $('svg #'+type+'_'+vname).css({'fill':color,'fill-opacity':0.2});
  }

}


function BuoysField(){
  var self=this;
  this.cache={}
  this.actual=null;

  this.load_dates=function(dates,i,atLoad,atEnd){
    if (i===undefined) i=0
    var date=dates[i];
    if (atLoad) atLoad(i);

    var ckey=date;
    if (!self.cache[ckey]){
      $.get(tabs_dir+'/field_buoys/load/'+date,function(res){
        var status=res[1];
        res=res[0];
        if (res) self.cache[ckey]=res;

        i++;
        if (i<dates.length){
          self.load_dates(dates,i,atLoad,atEnd);
        }else{
          if (atEnd) atEnd();
        }

      });
    }else{
      i++;
      if (i<dates.length)  this.load_dates(dates,i,atLoad,atEnd);
      else if (atEnd) atEnd();
    }

  }


  this.load=function(date,Show,vname,layer){

    var s=date+'_'+vname+'_'+layer+'_'+get_zoom();
    if (this.actual===s){
      console.log('No need to update buoys field!');
      return
    }

    this.actual=s;
    console.log(this.actual);

    var ckey=date
    if (self.cache[ckey] && Show)
          self._show(self.cache[ckey],vname,layer);
    else {
      console.log('LOADING buoys data')
      $.get(tabs_dir+'/field_buoys/load/'+date,function(res){

//        $('#anim_panel_info2').show()
//        $('#anim_panel_info2').html('loading buoys fields '+date);

        var status=res[1];
        if (status){
          console.log('ERROR with buoys fields !!');
          if (Show) self.hide();
          return
        }else{
          res=res[0];
          console.log('- done LOADING buoys fields')
          if (Show) self._show(res,vname,layer);
          self.cache[ckey]=res;
        }



//        $('#anim_panel_info2').html('ready');
//        $('#anim_panel_info2').fadeOut(1000);
      });
    }
  }


  this._show=function(data,vname,layer){
    var H=parseFloat($('svg').attr('viewBox').split(' ')[3]);
    var p,xc,yc,id;
    var pts='';
    //var svg=$('svg').eq(0);
    var svg=$('svg #buoys_fields');

    /*
    if (zoom<=7) var r=10;
    else var r=10/((zoom-7)*2);
    */
    var r=9/svg_scale();
    if (r>12) r=10; // for zoom 6


    // remove previous:
    this.remove();

    colors=data[vname+'_colors_'+layer];
    if (!colors) return
    names=data['name'];

    var add_circle=function(x,y,color,r,id){
       $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'))
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', r)
            .attr('id', id)
            .attr('fill', color)
            .attr('stroke-width',0.5)
            .attr('stroke','black')
            .appendTo(svg);
    };


    for (var i=0;i<data.x.length; i++){
      if (colors[i]!==''){
        xc=data.x[i];
        yc=H-data.y[i];
        id='buoy_field_'+names[i];
        add_circle(xc,yc,colors[i],r,id);
      }
    }

  }

  this.remove=function(){
    $('[id^=buoy_field]').remove();
  }

  this.hide=function(){
    this.remove();
    this.actual=null;
  }

}


function BuoysMarkers(ob){
  var self=this;
  this.cache=ob.cache;//{}
  this.actual=null;

  this.load_dates=ob.load_dates;

  this.load=function(date,Show){

    var s=date;
    if (this.actual===s){
      console.log('No need to update buoys markers');
      return
    }

    this.actual=s;
    console.log(this.actual);

    var ckey=date
    if (self.cache[ckey] && Show)
          self._show(self.cache[ckey]);
    else {
      console.log('LOADING buoys data')
      $.get(tabs_dir+'/field_buoys/load/'+date,function(res){

        var status=res[1];
        if (status){
          console.log('ERROR with buoys markers !!');
          if (Show) self.hide();
          return
        }else{
          res=res[0];
          console.log('- done LOADING buoys markers')
          if (Show) self._show(res);
          self.cache[ckey]=res;
        }

      });
    }
  }


  this.markers=[];

  this._show=function(data){
    // remove previous:
    this.remove();

    var shadowUrl='https://unpkg.com/leaflet@1.0.2/dist/images/marker-shadow.png';

    var name=data['name'];
    var withData=data['with_data'];
    var discont=data['discontinued'];
    var is_tabs=data['is_tabs'];
    var lon=data['lon'];
    var lat=data['lat'];

    // time range for tabsquery:
    var s=this.actual;
    var t1=new Date(Date.UTC(parseInt(s.slice(0,4)),parseInt(s.slice(4,6))-1,parseInt(s.slice(6,8))));
    // remove one day if current date is at 00h
//    if (t1.getUTCHours()==0){
//      t1.setTime(t1.getTime()-86400*1000);
//    }
    var t0 = new Date();
    var duration = 6; //In Days--> tabsquery will show duratin+1 days !
    t0.setTime(t1.getTime() -  (duration * 24 * 60 * 60 * 1000));
    var trange=t0.getUTCFullYear()+'/'+(t0.getUTCMonth()+1)+'/'+t0.getUTCDate()+' - '+ t1.getUTCFullYear()+'/'+(t1.getUTCMonth()+1)+'/'+t1.getUTCDate();

////    alert(s+'=='+t1+'--'+t0+'===='+trange);


    for (var i=0;i<name.length;i++){
      if (withData[i]){
        var buoyName1='buoy.png';
        var buoyName2='buoy2.png';
      }else{
        if (discont[i]){
          var buoyName1='buoy_disc.png';
          var buoyName2='buoy2_disc.png';
        }else{
          var buoyName1='buoy_empty.png';
          var buoyName2='buoy2_empty.png';
        }
      }


      if (is_tabs[i]){
        var iw=22;
        var ih=35;
        iw*=0.75;
        ih*=0.75;
        var buoyName=buoyName1;
        var style='font-size:10px;top:1px; width:'+iw+'px; margin-left:1px;';
        var shadowStyle='top:0px; left:4px';
      }else{
        var iw=35;
        var ih=31;
        iw*=0.75;
        ih*=0.75;
        var buoyName=buoyName2;
        var style='font-size:8px;top:1px; width:'+iw+'px; margin-left:0px;';
        var shadowStyle='top:0px;left:4px';
      }

      iw=Math.round(iw);
      ih=Math.round(ih);

      var cIcon = L.divIcon({
        //iconSize: new L.Point(iw, ih),
        className: 'Any!',
        iconAnchor: [iw/2,ih],
        html: ' \
           <div> \
             <img src="'+shadowUrl+'" width='+iw+' height='+ih+' style="position: absolute;'+shadowStyle+'"> \
             <img src="'+tabs_icons_dir+'/'+buoyName+'" width='+iw+' height='+ih+' style="position: absolute;top:0px"> \
             <div style="'+style+'; text-align: center; position: absolute;">'+name[i]+'</div>\
           </div>',
      });

      var m=L.marker([lat[i],lon[i]],{'icon': cIcon, 'riseOnHover': true});
      m.on('click', function (e){
          if (!is_tabs[i]){
            var url='http://pong.tamu.edu/tabswebsite/subpages/tabsquery.php?Buoyname='+name[i]+'&table='+'ndbc'+'&Datatype=pic&tz=UTC&units=M&datepicker='+trange;
          }else{
            var url='http://pong.tamu.edu/tabswebsite/subpages/tabsquery.php?Buoyname='+name[i]+'&table=ven&Datatype=pic&tz=UTC&units=M&datepicker='+trange;
          }
          window.open(url, '_blank');
      });
      if (discont[i] & !withData) m.setZIndexOffset(10)
      else if (!withData)   m.setZIndexOffset(20)
      else                  m.setZIndexOffset(30)

      if (withData[i]){
        this.markers.push(m);
        m.addTo(map);
      }


    }
  }

  this.remove=function(){
    for (var i=0;i<this.markers.length;i++){
      this.markers[i].removeFrom(map);
    }
    this.markers=[];

  }

  this.hide=function(){
    this.remove();
    this.actual='';
  }

}







function DateSelect(){

  var s0=' \
  <style> \
    #date_selector { \
      width:180px; wwidth: 230px; text-align:center; \
      position: absolute; top: 10px; left: 350px;\
    } \
    #current_date { \
      width: 100px; text-align:center; border: 1px solid #cccccc; Bborder-right:0px; \
      cursor: pointer;\
    } \
/*    #current_hour { \
      width: 24px; text-align:center; border: 1px solid #cccccc; Bborder-left:0px; \
      position: relative; left: 80px; \
    }*/ \
    #anim_btn { \
      Ccolor:#9d0202; Mmargin-right:10px;\
      color: #396fc2;\
    } \
    .mmm{margin-top:10px;} \
\
    .selH{margin:1px; display:inline-block; width:17px; border:1px solid transparent} \
\
    .selH.enabled{text-decoration: none; cursor:pointer; background-color:#abbcd6; color:#010188} \
\
    .selH.disabled{text-decoration:line-through; cursor:default; background-color:#f2f2f2; color:#6d6d88} \
\
    .selH.enabled.current{border: 1px solid #9d0202 !important} \
  </style>';

  var s1='\
  <div id="date_selector" class="menu"> \
\
      <div style="height:20px;">\
        <div style="float: left;">\
          <div style="display: table-cell; width: 20px" id="previous"><i class="fa fa-step-backward fa-lg"></i></div> \
\
          <div style="display: table-cell; width: 0px"> \
            <input style="border:1px; width:0px" id="current_date_pick"  readonly> \
          </div> \
\
          <div style="display: table-cell">\
            <input id="current_date" style="background-color: transparent;border: 1px solid #cccccc; border-radius: 3px" readonly> \
          </div>\
          <div style="display: table-cell; width: 20px" id="next"><i class="fa fa-step-forward fa-lg"></i></div> \
        </div>\
\
<!--        <div style="float: left; width: 40px"> \
          <input style="border:0px; width:0px" id="current_date_pick"  readonly> \
        </div>--> \
\
        <div style="float:right;margin-top:3px;" id="anim_btn">\
          <i style="cursor:pointer;position" class="fa fa-plus-square-o fa-lg" onclick="m.anim.show_dialog()"></i>\
<!--          <i style="cursor:pointer;position" class="fa fa-play-circle-o fa-lg" onclick="M.anim.show_dialog()"></i>-->\
        </div>&nbsp;\
      </div>\
\
      <div style="display: none"> \
        <img id="calImg"  style="cursor:pointer;position: relative; top: 2px;" src="js/date_picker/calendar-blue.gif" class="trigger"> \
      </div> \
\
      <div id="date_selector_anim"></div> \
  </div> \
  ';

  $('head').append(s0);
  $('#mapsWrapper0').append(s1);

  // select hour:
  var style='style="text-align: center;font-size: 12px;display: none; position: absolute; top:40px;left:400px;width:130px" class="menu"';
  var html='Select hour<p>';
  for (var i=0; i<24;i++){
    if (i<10) i='0'+i;
    html+='<div class="selH enabled" id="sel_hour_'+i+'">'+i+'</div>';
  }
  this.hourSelect=new Panel(null,'select_hour',html,style,true);

  for (var i=0; i<24;i++){
    if (i<10) i='0'+i;
    $('#sel_hour_'+i).click(function(){
        if ($(this).prop('enabled')){
          var hh=$(this).text();
          var date=$('#current_date').val().slice(0,10).replace(/-/g,'');
          M.load_date(date+hh,true);
        }else
        console.log('doing nothing!');
      })
      .mouseover(function(){
        if ($(this).prop('enabled') & !$(this).prop('isCurrent'))
        $(this).css({border:'1px solid #010188'})
       })
      .mouseout(function(){
        if ($(this).prop('enabled') & !$(this).prop('isCurrent'))
        $(this).css({border:'1px solid transparent'})
       })
  }

  var self=this;

  $('#current_date').click(function(e){
    if (this.selectionStart>=10){
      // show hour selector!
      // 1st check if hours are available; anso highlight current hour!
      var date=$('#current_date').val().slice(0,10).replace(/-/g,'');
      var hhCurrent=$('#current_date').val().slice(11,13);
      for (var i=0; i<24;i++){
        if (i<10) i='0'+i;
        var ob=$('#sel_hour_'+i)
        var hh=ob.text();
//        console.log(date+hh+' HHH='+hhCurrent);

        if (hhCurrent==hh){
          ob.addClass('current');
          ob.prop('isCurrent',true);
        }else{
          ob.removeClass('current');
          ob.prop('isCurrent',false);
        }


        if (M.all_times.indexOf(date+hh)===-1){
          //ob.css({'text-decoration':'line-through',cursor:'default','background-color':'#f2f2f2',color:'#6d6d88'})
          ob.removeClass('enabled');
          ob.addClass('disabled');
          ob.prop('enabled',false);
        }else{
          ob.removeClass('disabled');
          ob.addClass('enabled');
          //ob.css({'text-decoration':'',cursor:'pointer','background-color':'#abbcd6',color:'#010188'})
          ob.prop('enabled',true);
        }
      }

      self.hourSelect.show();
//      $(this).css({'cursor':'pointer'});
    }else{
      // show date selector!
      $('#current_date_pick').datepick('show');
    }
  });

  /* set whole input as pointer instead !
  $('#current_date').mousemove(function(e){
    var x = e.pageX - $(this).offset().left;
    var y = e.pageY - $(this).offset().top;
    x=x/$(this).width();
    if (x>0.7)
    $(this).css({'cursor':'pointer'});
    else
    $(this).css({'cursor':''});

//    console.log(this.width+' '+x+' '+y);//this.selectionStart);
//    if (this.selectionStart>=10){
//      // show hour selector!
//      self.hourSelect.show();
//      $(this).css({'cursor':'pointer'});
//    }
  });
*/

/*
  $('#date_selector')
    .on('mouseover',function(){
      $(this).find('*').css({'background-color':$(this).css('background-color')});
    })
    .on('mouseout',function(){
      $(this).find('*').css({'background-color':$(this).css('background-color')});
    });
*/

  // show date picker:
  // allow more 7 days from today:
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  var maxDateStr =format_date(maxDate)[1].split(' ')[0];
  $('#current_date_pick').datepick({showOnFocus: false,//, showTrigger: '#calImg',
  minDate: config.date_min, maxDate: maxDateStr,pickerClass:'mmm',
  dateFormat: 'yyyy-mm-dd',
    onSelect: function(date) {

       // get hour:
       var hour=$('#current_date').val().split(' ')
       if (hour.length>1) hour=hour[1].slice(0,2);
       else hour='00';

       date=format_date(new Date(date))[0].slice(0,8)+hour;//+$('#current_hour').val().slice(0,2);
///       $('#current_date').val(date);
//       alert(date);
       M.load_date(date,true);
      }
  });

}

function Anim(){

  this.newDates=false
//  this.loaded=false;

//  this.svg={}
  this.dates=[]

  var self=this

  var s0=' \
  <style> \
    #anim_panel { \
      padding-top:5px; padding-bottom:3px; height:45px; \
      display: none;\
    } \
    #anim_panel_info0 { \
      text-align: left;\
    } \
    #anim_panel_help_btn { \
      color:#98bccf; cursor:pointer \
    } \
    #anim_panel_info1 { \
      font-size:11px;display:inline \
    } \
    #playCont { \
      height:20px; width: 200px; margin-bottom: 5px; float: left \
    } \
    #anim_panel_info2 { \
      width: 77%; float:left;\
      padding-top:2px;\
    } \
    #anim_panel_dates_input { \
      Wwidth:0px; Bborder:0px; \
    } \
    #anim_panel_okLoadi { \
      background-color: #bfc8d6; margin-top: 2px;padding: 2px 3px 0px 3px; border: 1px solid #a3acb8; border-radius: 3px; \
      cursor: pointer;\
    } \
  </style>';

  var s1='\
  <div id="anim_panel"> \
\
<!--\
    <div id="anim_panel_info0">\
      <i id="anim_panel_help_btn" class="fa fa-question-circle fa"></i>\
      <div id="anim_panel_info1"> <div id="anim_opts_btn">\
      <i style="cursor:pointer;" class="fa fa-calendar-check-o fa-lg faa-shake animated" onclick="M.anim.show_dialog()"></i>\
     </div></div>\
    </div> \
-->\
\
    <div style="height:25px">\
      <div id="playCont"></div> \
      <div  style="float:right">\
<!--        <input id="anim_panel_dates_input">-->\
        <i id="anim_opts_btn" style="cursor:pointer;" class="fa fa-calendar-check-o fa-lg faa-shake animated"></i>\
      </div>\
    </div>\
\
    <div id="anim_panel_info2">&nbsp;</div> \
\
    <div id="anim_panel_okLoad"><i id="anim_panel_okLoadi" class="fa fa-download fa-1"> load</i></div> \
  </div> \
\
  <div style="display:none"> \
    <img style="cursor:pointer;position;position: relative; top: 2px;" id="calImg2" src="js/date_picker/calendar-blue.gif" class="trigger"> \
  </div> \
  ';

  $('head').append(s0);
  $('#date_selector_anim').append(s1);

  // anim opts panel:
  var style='style="font-size: 12px;display: none; position: absolute; top:95px;left:350px;width:230px" class="menu"';
  var html='<p>Animation Options</p>\
            <ul style="padding-left:15px">\
              <li style="margin-top:10px">interval between frames</li>\
\
            <div style="padding-left:0px">\
              <input type="radio" name="dt" id="dt_1"  value="1"><label for="dt_1">1h</label>\
              <input type="radio" name="dt" id="dt_3"  value="3"><label for="dt_3">3h</label>\
              <input type="radio" name="dt" id="dt_6"  value="6" checked><label for="dt_6">6h</label>\
              <input type="radio" name="dt" id="dt_12" value="12"><label for="dt_12">12h</label>\
              <input type="radio" name="dt" id="dt_24" value="24"><label for="dt_24">1 day</label>\
            </div>\
\
              <li  style="margin-top:5px">Period</li>\
              <ul style="padding-left:15px">\
                <li id="anim_prev_wk">animate previous week</li>\
                <li id="anim_next_wk">animate next week (forecast)</li>\
                <li id="anim_sel_rng">select range</li>\
                  <input style="border: 1px solid rgb(204, 204, 204); border-radius: 3px; width:150px;height:12px;font-size:12px" id="anim_panel_dates_input">\
                  <input readonly style="text-align:center; border: 1px solid #a3acb8;  background-color: #bfc8d6;  border-radius: 3px; width:30px;height:12px;font-size:12px" id="anim_panel_dates_input_sub" value="go">\
              </ul>\
            </ul>\
            <div>\
            Usage: after selecting the interval and period, press the load button (if present)\
            </div>\
            ';
  this.opts=new Panel('anim_opts_btn','anim_opts',html,style,false,'datepick');

  $('#anim_opts input,label').css({'cursor':'pointer'});//,color:'#0a46a2'})
  $('#anim_opts li[id^=anim]').css({cursor:'pointer','margin-top':'3px'})
  $('#anim_opts li[id*=_wk]').css({color:'#0a46a2'})

  // remove animation of button opts after 1st click
  $('#anim_opts_btn').one('click',function(){$(this).removeClass('animated')});

  this.submit=function(type){
    if (type==='prev_wk' || type=='next_wk'){
      var date0 = new Date();
      var date1 = new Date();

      date0.setDate(31);
      date0.setMonth(12);
      date0.setYear(2016);

      if (type==='prev_wk'){
        date0.setDate(date0.getDate()-7);
        date0 =format_date(date0)[0];
        date1 =format_date(date1)[0];
      }else{
        date1.setDate(date1.getDate()+7);
        date1 =format_date(date1)[0];
        date0 =format_date(date0)[0];
      }
    }else if (type=='range'){
      var dates=$('#anim_panel_dates_input').val().split(' - ');
      var date0=new Date(dates[0]);
      var date1=new Date(dates[1]);

      // add one day to final date
      date1.setDate(date1.getDate() + 1);

      date0 =format_date(date0)[0];
      date1 =format_date(date1)[0];
    }

    console.log('HELLO '+date0+' '+date1);
    var dt=parseInt($('input[name=dt]:checked').val());

    self.choose_dates(date0,date1,dt)
    play.update_n(0);
    self.opts.hide(0); // close panel !
  }

  $('#anim_prev_wk').click(function(){
    self.submit('prev_wk');
  });
  $('#anim_next_wk').click(function(){
    self.submit('next_wk');
  });
  $('#anim_panel_dates_input_sub').click(function(){
    self.submit('range');
  });
/*
    var date0 = new Date();
    var date1 = new Date();

    date0.setDate(31);
    date0.setMonth(12);
    date0.setYear(2016);

    date0.setDate(date0.getDate()-7);
    date0 =format_date(date0)[0];
    date1 =format_date(date1)[0];
//    alert(date0+' to '+date1);

    var dt=parseInt($('input[name=dt]:checked').val());

    self.choose_dates(date0,date1,dt)
    play.update_n(0);
    self.opts.hide(0); // close panel !
  });
*/

  /*
  // anim help panel:
  var style='style="font-size: 12px;display: none; position: absolute; top:50px;left:280px;width:200px" class="menu"';
  var html='<p>Animations Help</p>\
            1. select two dates in the calendar at right<br> \
            2. click to load the frames<br> \
            3. play<br> \
            <img align="right" src="'+tabs_images_dir+'/ahelp.png"><br>\
            <!--(use <i class="fa fa-play-circle-o fa-lg"></i> to show/hide the animation options)-->';
  this.help=new PANEL('anim_panel_help_btn','anim_help',html,style,true);
  */

  /*
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
  */

  // show player:
  play=new Play('playCont',0,function(i){
    self.replace(i);
   }
  );

  this.replace=function(i){
    if (this.dates[i])
    m.show_frame(this.dates[i]);
  }

  // show date picker:
  // allow more 7 days from today:
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  var maxDateStr =format_date(maxDate)[1].split(' ')[0];

  $('#anim_panel_dates_input').datepick({showOnFocus: true, //false,showTrigger: '#calImg2',
  minDate: '2010-01-01', maxDate: maxDateStr,
  dateFormat: 'yyyy-mm-dd',
  rangeSelect: true});/*,
  onClose: function(dates) {
    if (dates!=''){
      if (dates[1].getTime()==dates[0].getTime()){
          var date0 =format_date(dates[0])[0].slice(0,8);

          // add one day to final date
          var date1=dates[1];
          date1.setDate(date1.getDate() + 1);
          var date1 =format_date(date1)[0].slice(0,8);

          // submit:
          //var dt=parseInt($('input[name=dt]:checked').val());
          //self.choose_dates(date0,date1,dt)
      }
//      play.update_n(0);
      //self.opts.hide(0); // close panel !
    }
  },
  onSelect: function(dates) {
      if (dates[1]>dates[0]){

        //read server number of frames and make okload avaiblable
        var date0 =format_date(dates[0])[0].slice(0,8);

        // add one day to final date
        var date1=dates[1];
        date1.setDate(date1.getDate() + 1);
        var date1 =format_date(date1)[0].slice(0,8);

        // submit:
        //var dt=parseInt($('input[name=dt]:checked').val());
        //self.choose_dates(date0,date1,dt)
      }else{
        $('#anim_info').html('please select 2 different dates');
        $('#anim_ok_load').hide;
      }
    }
  });
*/

  this.show_dialog=function(){
    var ob=$('#anim_panel');
    if (ob.css('display')=='none'){  // ----> show
      $('#date_selector').css({'width':230});
      $('#current_date').prop('disabled',true).css({'cursor':'default'});

      $('#anim_panel').fadeIn(250);;
      $("#anim_panel").children().fadeIn(500);

      // hide again info 2 (the "ready to play message" , etc)
      if (!self.newDates){
        $('#anim_panel_info2').fadeOut(3000);
      }

      //$('#anim_btn').css({'color':'#396fc2'});

      $('#anim_btn i').removeClass('fa-plus-square-o');
      $('#anim_btn i').addClass('fa-minus-square-o');

      $('#date_selector #previous i').hide()
      $('#date_selector #next i').hide()
      $('#date_selector .trigger').eq(0).hide();

      if (this.newDates){// && !this.loaded){
          $('#anim_panel_okLoad').show()
        }else{
          $('#anim_panel_okLoad').hide()
        }

    }else{
      $('#date_selector').css({'width':180});
      $('#current_date').prop('disabled',false).css({'cursor':'pointer'});

      $("#anim_panel").children().fadeOut(10);
      $("#anim_panel").slideUp();
      //$('#anim_btn').css({'color':'#9d0202'});

      $('#anim_btn i').removeClass('fa-minus-square-o');
      $('#anim_btn i').addClass('fa-plus-square-o');

      $('#date_selector #previous i').show()
      $('#date_selector #next i').show()
      $('#date_selector .trigger').eq(0).show();
    }
  }

  this.choose_dates=function(date0,date1,dt){
    // get number of frames:
    m.times(date0,date1,dt,function(t){

    console.log('CHOOSING dates '+date0+' '+date1+' '+dt);
    console.log('n dates= '+t.length);

    self.dates=t;
    // update player:
    play.stop()
    console.log('updating PLAYER '+self.dates.length);
    play.update_n(self.dates.length)

    m.load_frames(t);

    return
      // format dates and find number of new dates (not yet loaded by MASTER)
      self.dates=new Array(t.length);
      var nNewDates=0;
      for (var i=0;i<t.length;i++){
        self.dates[i]=format_date(new Date(t[i]))[0];
        if (M.dates.indexOf(self.dates[i])===-1) nNewDates++;
      }
      console.log('n dates= '+t.length+ ' new dates= '+nNewDates);

      if (t.length==0){
        $('#anim_panel_info2').show().html('no frames found');
      }else if (t.length<2){
        $('#anim_panel_info2').show().html('need more than '+t.length+' frames');
      }else{

        //if (t.length<=57){ //one week of hourly frames: load autmatically
        if (nNewDates<=6){
          //$('#anim_panel_info2').html('');
          $('#anim_panel_okLoad').hide();
          self.load();

        }else { // ask for user's conformation !
          // show number of frames:
          $('#anim_panel_info2').show().html('frames to load: '+t.length +'('+nNewDates+' new)');

          // show load button:
          $('#anim_panel_okLoad').show();

          // set button task:
          $('#anim_panel_okLoad').off('click')
                                 .click(function(){self.load();});
          self.newDates=true
        }


      }

    });
  }

  this.load=function(){//date0,n){
   console.log('LOADING');
    //frame.load_anim(date0,n,0,[$('#anim_panel_info2'),'ready to play'])
    M.load_dates(this.dates,0,
       function(I){ // atLoad
         $('#anim_panel_info2').html('loading '+(I+1)+' of '+self.dates.length);
       },
       function(){ // atEnd
//         $('#anim_panel_info2').html('')
//         $('#anim_panel_info2').show()
         $('#anim_panel_info2').show().html('ready to play')
         $('#anim_panel_info2').fadeOut(3000);
       }
    );

    this.newDates=false
//    this.loaded=true

    // hide load button:
    $('#anim_panel_okLoad').hide();

    // update player:
    play.stop()
   console.log('updating PLAYER '+this.dates.length);
    play.update_n(this.dates.length)

  }

}
