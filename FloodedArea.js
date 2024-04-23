Map.centerObject(table);
Map.addLayer(table);

var preflood = ee.ImageCollection('COPERNICUS/S3/OLCI')
.filterBounds(table)
.filterDate('2019-08-05','2019-09-10')
.map(function(img){
  
  var clip = img.clip(table);
  var nir = clip.select('Oa17_radiance').multiply(0.00493004);
  var blue = clip.select('Oa03_radiance').multiply(0.0121481);
  var ndwi = (blue.subtract(nir)).divide(blue.add(nir));
  
  return ndwi})
.median()
.rename('preflood');

print(preflood);

Map.addLayer(preflood,{min:0.4,max:0.8,
palette:['white','yellow','blue']});



// postflood for sentinel-3

var postflood = ee.ImageCollection('COPERNICUS/S3/OLCI')
.filterBounds(table)
.filterDate('2019-04-1','2019-05-01')
.map(function(img){
  
  var clip = img.clip(table);
  var nir = clip.select('Oa17_radiance').multiply(0.00493004);
  var blue = clip.select('Oa03_radiance').multiply(0.0121481);
  var ndwi = (blue.subtract(nir)).divide(blue.add(nir));
  
  return ndwi})
.median()
.rename('postflood');

print(postflood);

Map.addLayer(postflood,{min:0.4,max:0.8,
palette:['white','yellow','blue']});


// change detection for flooded areas

var stack = ee.Image.cat([preflood,postflood]);

print(stack)

var change = stack.expression('POST - PRE',{
  'POST': stack.select('postflood'),
  'PRE' : stack.select('preflood')})
  .rename('change_map');
  
Map.addLayer(change,{min:-0.13, max:0.2});

var thr = change.gt(0.1);


var mask = change.updateMask(thr);

Map.addLayer(mask);

var area = mask.multiply(ee.Image.pixelArea().divide(1000000.0));

var stats = area.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: table,
  scale: 300,
  maxPixels:1e13
});

print('flooded area (km2)',stats);
  
  