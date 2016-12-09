
function astride(a,d,i0){
  // arrray stride
  if (i0===undefined) i0=0;
  var i=i0;
  res=[];
  while (i<a.length){
    res.push(a[i]);
    i+=d;
  }
  return res
}

function timeAtFixedHours(time,hours){
  // returns time at hours defined in array hours
  res=[]
  for (var i=0;i<time.length;i++){
    var hh=parseInt(time[i].slice(-2));
    if (hours.indexOf(hh)>-1) res.push(time[i]);
  }
  return res
}

function format_date(date){
//  if ($.type(date)==='string')
//    var d = new Date(date);
//  else var d = date;
  var d=date;

  // yyyymmddhh
  var res0=d.getUTCFullYear()+''+('0'+(d.getUTCMonth()+1)).slice(-2)+''
         +('0'+d.getUTCDate()).slice(-2)+''+('0'+d.getUTCHours()).slice(-2);

  // yyyy-mm-dd HHh
  var res1=d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'
         +('0'+d.getUTCDate()).slice(-2)+' '+('0'+d.getUTCHours()).slice(-2)+'h';
  return [res0,res1]
}


function capitalize(str) {
    var strVal = '';
    str = str.split(' ');
    for (var chr = 0; chr < str.length; chr++) {
        strVal += str[chr].substring(0, 1).toUpperCase() + str[chr].substring(1, str[chr].length) + ' '
    }
    return strVal
}


function rgb2hsv () {
    var rr, gg, bb,
        r = arguments[0] / 255,
        g = arguments[1] / 255,
        b = arguments[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}

function  rgb_isLight(rgb){
  return (0.213*rgb[0]+0.715*rgb[1]+0.072*rgb[2] > 255 / 2);
}

function  hex_isLight(hex){
  return rgb=rgb_isLight(hex2rgb(hex));
}

function hex2rgb(hex){
  hex = hex.replace('#','');
  var r = parseInt( hex.slice(0,2), 16 ),
      g = parseInt( hex.slice(2,4), 16 ),
      b = parseInt( hex.slice(4,6), 16 );

  return [r,g,b];
}

  function add(A,B){
    return [A[0]+B[0],A[1]+B[1]]
  }
  function rem(A,B){
    return [A[0]-B[0],A[1]-B[1]]
  }
  function smul(s,A){
    return [s*A[0],s*A[1]]
  }
  function norm(A){
    return Math.sqrt(Math.pow(A[0],2)+Math.pow(A[1],2));
  }

function seta(x,y,u,v){
  var a=1./5*norm([u,v]);
  var Fi=20*Math.PI/180;
  var teta=Math.atan2(v,u);
  var fi=Math.PI-Fi+teta;
  var fii=Math.PI+Fi+teta;

  var P=[x,y];
  var P1=[x+u,y+v];
  var P2=[x+u+a*Math.cos(fi)/Math.cos(Fi),y+v+a*Math.sin(fi)/Math.cos(Fi)];
  var P3=[x+u+a*Math.cos(fii)/Math.cos(Fi),y+v+a*Math.sin(fii)/Math.cos(Fi)];
  return [P,P1,P2,P1,P3,P1]
}

function seta2d(x,y,u,v){

  var param1=2/3;
  var param2=1/3;
  var param3=1/3;
  var teta=45;

  var V=[u,v];
  var P=[x,y];
  var L=norm(V);
  var r=[u/L,v/L];
  var P4=add(P,smul(L,r));
  var Pi=add(P,smul(param1*L,r));
  if (v==0){
    var aux=Math.PI/2;
  }else{
    var aux=Math.atan(-u/v);
  }
  var ri=[Math.cos(aux),Math.sin(aux)];
  var PiP3=norm(rem(P4,Pi))*Math.tan(teta*Math.PI/180);
  var P3=add(Pi,smul(+PiP3,ri));
  var P5=add(Pi,smul(-PiP3,ri));
  var P1=add(P,smul(+PiP3*param2,ri));
  var P7=add(P,smul(-PiP3*param2,ri));
  var b=param3*norm(rem(P4,Pi));
  var bb=b/PiP3*(PiP3-norm(rem(P1,P)));
  var P2=add(P1,smul(param1*L+bb,r));
  var P6=add(P7,smul(param1*L+bb,r));
  return [P,P1,P2,P3,P4,P5,P6,P7,P]

}

