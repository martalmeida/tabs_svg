#!/usr/bin/python3

import os
import logging
from logging.handlers import RotatingFileHandler

from flask import Flask
from flask import redirect, url_for, jsonify, make_response

#app = Flask(__name__)
app = Flask(__name__,static_url_path='')

#pwd=url_for('.index')[1:]
pwd=os.path.dirname(__file__)+'/'
pwd='./' # local

#@app.route("/")
#def hello():
#    return "Hello World...!"

@app.route('/')
def index():
  return app.send_static_file('index.html')
  #return redirect(url_for('static', filename='tabs.html'))


@app.route('/data/svg/datetimes/<string:date0>/<string:date1>')
def svg_dates(date0,date1):
#  try:
  if 1:
    import tools
    t=tools.get_dates(date0,date1,pwd)
    return jsonify(t.tolist())
#  except Exception as e:
#    msg='cannot find available dates'
#    app.logger.error(msg)
#    app.logger.debug(str(e))
#    return make_response(msg, 404)


@app.route('/data/svg/datetime/<string:datet>/<string:move>/<int:add>')
def svg_frame(datet,move,add):
  try:
      import tools
      if move=='more': add=+add
      else: add=-add
      if datet=='nearest':
         o=tools.find_nearest(date=None,add=add,pwd=pwd)
         o['data']=open(o['fname']).read()
         return jsonify(o)
      else:
         o=tools.find_nearest(date=datet,add=add,pwd=pwd)
         o['data']=open(o['fname']).read()
         return jsonify(o)

  except Exception as e:
        msg = 'cannot access svg file for date %s'%datet
        app.logger.error(msg)
        app.logger.debug(str(e))
        return make_response(msg, 404)

@app.route('/data/svg/colorbar/<string:date>')
def svg_colorbars(date):
  try:
    fname=pwd+'/figures/store/colorbars.svg'
    o={}
    o['data']=open(fname).read()
    return jsonify(o)
  except Exception as e:
    msg = 'cannot access colorbar for date %s'%date
    app.logger.error(msg)
    app.logger.debug(str(e))
    return make_response(msg, 404)

@app.route('/data/svg/river/<int:year>/<int:month>')
def svg_river(year,month):
  try:
    f=pwd+'figures/store/mississippi_%d_%02d.svg'%(year,month)
    o={}
    o['data']=open(f).read()
    return jsonify(o)
  except:
    msg = 'cannot access river for date %s'%date
    app.logger.error(msg)
    app.logger.debug(str(e))
    return make_response(msg, 404)



if __name__ == "__main__":
    handler = RotatingFileHandler('/tmp/foo.log', maxBytes=10000, backupCount=1)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.run()#debug=True)

