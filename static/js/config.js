var config = {};

tabs_dir='/tabs_map';
tabs_dir=''; // local

config['currents_color'] = {'salt':'D10E00','temp':'96FF96','speed':'161CC7', 'none':'000000'};
config['radar_color']    = {'salt':'961e96','temp':'961e96','speed':'961e96', 'none':'961e96'}; // radar currents
config['buoys_color']    = {'salt':'961e96','temp':'961e96','speed':'961e96', 'none':'961e96'}; // buoys, for both wind and currents
config['wind_color']     = {'salt':'0e3e87','temp':'0e3e87','speed':'0e3e87', 'none':'000000'};
config['isobaths_color'] = {'salt':'ff0000','temp':'B5EBD5','speed':'5340FF', 'none':'000000'};

config['default_field']='salt';
config['salt_layer']=0;
config['temp_layer']=0;
config['speed_layer']=0;


//config['show_currents']=1;
//config['show_radar']=0;
//config['show_wind']=1;
//config['show_isobaths']=1;
config['show_isobaths_model']=1;
//config['show_buoys_curr']=0;
//config['show_buoys_wind']=1;

config['show_markers_buoys']=1;
///config['show_buoys_field']=1;
config['show_field_buoys']=1;
config['show_currents_model']=1;
config['show_currents_buoys']=0;
config['show_currents_radar']=1;

config['show_wind_model']=1;
config['show_wind_buoys']=0;

var Init=1;
