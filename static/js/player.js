/*
<html>
<head>


<script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>
<script language=javascript>
*/
function range(start, end, step, offset) { return Array.apply(null, Array((Math.abs(end - start) + ((offset||0)*2))/(step||1)+1)) .map(function(_, i) { return start < end ? i*(step||1) + start - (offset||0) :  (start - (i*(step||1))) + (offset||0) }) }

function Play(cid,n,acc){
  var w=parseInt($('#'+cid).css('width').split('px')[0]);
  var h=parseInt($('#'+cid).css('height').split('px')[0]);
  var dx=10;
  var dx0=47;
  var X=[0.5,1.7,2.2,2.7,2.9,3.4];
  for (var i=0;i<X.length;i++) X[i]*=dx;
  this.L=w-dx0-dx;
  this.drag=false;
  this.x=[];
  this.i=0;
  this.status='stop';

  this.innerPoints=function(n){
    var s=''
    this.x=[]
    for (var i=0;i<n;i++){
      var xx=dx0+i/(n-1)*this.L;
      this.x.push(xx);
      s+='<circle cx="'+xx+'" cy="'+h/2+'" r="2" fill="#597cc0"/>';
    }
    return s
  }

  var s=' \
  <style> \
    .drag {fill: #788497; cursor:pointer} \
    .drag:hover {fill: #abbcd6} \
    .playb {stroke: #abbcd6; stroke-width:0.5; fill:#597cc0;cursor:pointer} \
    .playb:hover {stroke: #002266;} \
  </style> \
  <svg height="'+h+'" width="'+w+'" style="border:0px solid red"> \
  <polygon class="playb" id="stopb"\
    points="'+X[0]+','+(h/2+h/4)+' '+X[1]+','+(h/2+h/4)+' '+X[1]+','+(h/2-h/4)+' '+X[0]+','+(h/2-h/4)+'" /> \
  <polygon class="playb" id="playb"\
    points="'+X[2]+','+(h/2+h/4)+' '+X[5]+','+(h/2)+' '+X[2]+','+(h/2-h/4)+'" /> \
  <path class="playb" id="pauseb"\
    d="M'+X[2]+' '+(h/2+h/4)+' L'+X[3]+' '+(h/2+h/4)+' L'+X[3]+' '+(h/2-h/4)+' L'+X[2]+' '+(h/2-h/4)+' Z \
       M'+X[4]+' '+(h/2+h/4)+' L'+X[5]+' '+(h/2+h/4)+' L'+X[5]+' '+(h/2-h/4)+' L'+X[4]+' '+(h/2-h/4)+' Z" \
       style="display:none" /> \
  <path style="stroke: #002266;cursor:pointer" \
    d="M'+dx0+' '+h/2+' L'+(this.L+dx0)+' '+h/2+'" /> \
  <circle id="pmove0" cx="'+dx0+'" cy="'+h/2+'" r="5" fill="#d4d4d4"/> \
  <circle id="pmove1" cx="'+(this.L+dx0)+'" cy="'+h/2+'" r="5" fill="#d4d4d4"/> \
  <circle class="drag" id="pmove"  cx="'+dx0+'" cy="'+h/2+'" r="7" fill="blue"/>'
  s+='<g id="inner_pts">';
  s+=this.innerPoints(n);
  s+='</g>';
  s+=' \
  </svg>';
//  alert(s);
  $('#'+cid).html(s);

  this.update_n=function(N){
    $('#inner_pts').html(this.innerPoints(N));
  }

  this.nearest=function(x){
    var dist=[];
    for (var i=0;i<self.x.length;i++){
      dist.push(Math.pow(self.x[i]-x,2))
    }
    var vmin=Math.min.apply(null,dist);
    i=dist.indexOf(vmin)
    return i
  }

  function mousePos(e){

//    var x = e.pageX - $(e.target).offset().left;
//    var y = e.pageY - $(e.target).offset().top;

    var x = e.pageX - $('#playCont').offset().left;
    var y = e.pageY - $('#playCont').offset().top;

    var xm=parseInt($('#pmove0').attr('cx'));
    var xM=parseInt($('#pmove1').attr('cx'));
    if (x<xm) return
    x = x<xm ? xm:x;
    x = x>xM ? xM:x;

    // find nearest indice:
    i=self.nearest(x);
    //var dist=[];
    //for (var i=0;i<self.x.length;i++){
    //  dist.push(Math.pow(self.x[i]-x,2))
    //}
    //var vmin=Math.min.apply(null,dist);
    //i=dist.indexOf(vmin)
    return [x,i]
  }

  var self=this;

  this.next=function(k){
    var i0=this.i;
    this.i=this.i+k;
    this.i=Math.min(this.i,this.x.length-1);
    this.i=Math.max(this.i,0);
    //console.log(this.i);
    var cx=this.x[this.i];
    $('#pmove').attr('cx',cx);
    if (i0!==this.i) acc(this.i);
//    this.status='pause';
  }

  this.play=function(interval){
    this.status='play';
    if (interval===undefined) interval=250;
//    var id = setInterval(frame, interval);
    setTimeout(frame, interval);
    var i=play.i;
    function frame(){
      if (i===self.x.length || self.status!=='play'){
//        clearInterval(id);
//        clearTimeout(id);
        if (i===self.x.length){
           // hide pause/show play:
           $('#pauseb').css({'display':'none'});
           $('#playb').css({'display':'inline'});
         }
      }else{
        //console.log('update...'+i);
        self.next(1);
        setTimeout(frame, interval)
//        self.status='play';
        i++;
      }
    }
  }

  $('#'+cid).click(function(e){
    var x=mousePos(e);
    if (x===undefined) return

    var i=x[1]
    x=x[0]
    self.update((x-dx0)/self.L*100);
    if (i!==self.i){
        acc(i);
        self.i=i
      }
  })

  $('#'+cid).mousedown(function(e){
    self.drag=true;
  })

  $('#'+cid).mouseup(function(e){
    self.drag=false;
  })

  $('#'+cid).mousemove(function(e){
    if (self.drag){
      var x=mousePos(e);
      if (x===undefined) return
      var i=x[1]
      x=x[0]
      self.update((x-dx0)/self.L*100,1);
      if (i!==self.i){
        acc(i);
        self.i=i
      }
    }
  })


  $('#playb').click(function(){
    if (self.i===self.x.length-1) self.next(-self.x.length);
    self.play();
    $('#pauseb').css({'display':'inline'});
    $('#playb').css({'display':'none'});
  });
  $('#pauseb').click(function(){
    play.status='pause';
    $('#pauseb').css({'display':'none'});
    $('#playb').css({'display':'inline'});
  });
  $('#stopb').click(function(){
    self.stop()
//    self.status='stop';
//    self.next(-self.x.length)
//    $('#pauseb').css({'display':'none'});
//    $('#playb').css({'display':'inline'});
  });

  this.stop=function(){
    this.status='stop';
    if (this.x.length){
      this.next(-this.x.length)
    }else{
      this.update(0)
    }
    $('#pauseb').hide();//css({'display':'none'});
    $('#playb').show();//css({'display':'inline'});

  }

  this.update=function(p){
    // p as %
    $('#pmove').attr('cx',p/100*this.L+dx0);
//   --> update so se mudar a variavel !!
//    acc();
  };
}
/*
$(document).ready(function() {
  var data=range(0,9);
  play=new Play('playCont',data.length,function(){
    console.log('updatting...');
  });

});


</script>

</head>
<body>
<div id='playCont' style='width: 250px; border: 1px solid red; height: 25px'>
</div>
</body>
</html>
*/
