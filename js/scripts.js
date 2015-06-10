var map;
var infoWindow;
var response;
var markers = [];
var visibleMarkers = [];
var visibleColumns = [];
var columnLabels = [];
var filterColumns = [];

google.load('visualization', '1');

google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function() {

	$('#filters-cont').on('change', '.filter', function() {
		filterMarkers();
		drawTable();
		$('#hits').text(visibleMarkers.length);
	});
	
	$('#table-cont').on('click', '.show-on-map', function() {
		var markerId = $(this).data('marker-id');
		google.maps.event.trigger(markers[markerId], 'click');
		$('html, body').animate({
	        scrollTop: $("#map-cont").offset().top
	    }, 500);
	});
});

function detectUserLocation() {

    if (!!navigator.geolocation) {
    
    	navigator.geolocation.getCurrentPosition(function(position) {
        
            var coordinates = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            
            var content = '<b>Dein aktueller Standort.</b>';
            
            createMarker(coordinates, content, 'images/user-location.png');
        }), "", {enableHighAccuracy: true};   
    }    
}

function drawTable() {
	
	var numRows = visibleMarkers.length;
	var numCols = visibleColumns.length;
	
	var table = '<table class="table table-striped"><thead><tr><th>#</th>';
	
	for (var c = 0; c < numCols; c++) {
		table += '<th>' + columnLabels[visibleColumns[c]] + '</th>';
	}
	
	table += '<th></th></tr></thead><tbody>';

	for (var r = 0; r < numRows; r++) {
		var markerId = visibleMarkers[r];
		table += '<tr><td>' + (r + 1) + '</td>' ;
		for (var c = 0; c < numCols; c++) {
			var value = response.getDataTable().getValue(visibleMarkers[r], visibleColumns[c]).replace("\n", "<br />", "g");
			table += '<td>' + value + '</td>';
		}
		table += '<td><a class="show-on-map" data-marker-id="' + markerId + '" title="Zeige auf der Karte"></a></td></tr>';
	}
	
	table += '</tbody></table>';
	document.getElementById('table-cont').innerHTML = table;
}

function filterMarkers() {
	
	var selectedFiltersIds = [];
	var selectedFiltersValues = [];
	visibleMarkers = [];
	
	// get selected filters
	$('.filter').each(function() {
		if ($(this).val() != 'all') {
			selectedFiltersIds.push($(this).data('filter'));
			selectedFiltersValues.push($(this).val());
		}
	});
	
	for (var r = 0; r < response.getDataTable().getNumberOfRows(); r++) {
		
		var visible = true;
		
		for (var f = 0; f < selectedFiltersIds.length; f++) {
			var cellValue = response.getDataTable().getValue(r, selectedFiltersIds[f]);
			var filterValue = selectedFiltersValues[f];
			if (cellValue != filterValue) {
				visible = false;
			}
		}
		
		if (visible) {
			markers[r].setMap(map);
			visibleMarkers.push(r);
		} else {
			markers[r].setMap(null);
		}
	}
}

function createMarker(coordinate, content, markerIcon) {
	
	markerIcon = typeof markerIcon !== 'undefined' ? markerIcon : 'images/marker-icon.png';
	
	var marker = new google.maps.Marker({
		map : map,
		position : coordinate,
		icon : new google.maps.MarkerImage(markerIcon)
	});
	
	google.maps.event.addListener(marker, 'click', function(event) {
		infoWindow.setPosition(coordinate);
		infoWindow.setContent(content);
		infoWindow.open(map);
	});
	
	return marker;
};

function createFilters() {
	
	var filtersHtml = '<div class="row">';
	var filterOptions = [];
	var numRows = response.getDataTable().getNumberOfRows();
	
	for (var f = 0; f < filterColumns.length; f++) {
		
		filtersHtml += '<div class="form-group col-md-3 col-sm-6 col-xs-12">' + 
				'<label>' + columnLabels[filterColumns[f]] +	':</label>' + 
				'<select class="filter" data-filter="' + filterColumns[f] + '" autocomplete="off">' + 
				'<option value="all">Alle</option>';
	
		var options = [];
		
		// find all options for this filter
		for (var r = 0; r < numRows; r++) {
			value = response.getDataTable().getValue(r, filterColumns[f]);
			if (value && options.indexOf(value) == -1) {
				filtersHtml += '<option value="' + value + '">' + value + '</option>';
				options.push(value);
			}
		}
		
		filtersHtml += '</select></div>';
	}
	
	filtersHtml += '</div><div><span id="hits">' + numRows + '</span> Treffer</div>';
	document.getElementById('filters-cont').innerHTML = filtersHtml;
}

function initialize() {

	infoWindow = new google.maps.InfoWindow();
	map = new google.maps.Map(document.getElementById('map-cont'),
			{
				center : new google.maps.LatLng(52.514285905058195,
						13.403518310546838),
				zoom : 11,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			});

	var query = "SELECT * FROM " + tableId;
	query = encodeURIComponent(query);
	var gvizQuery = new google.visualization.Query(
			'http://www.google.com/fusiontables/gvizdata?tq=' + query);

	gvizQuery.send(function(resp) {
		
		response = resp;
		var numRows = response.getDataTable().getNumberOfRows();
		var numCols = response.getDataTable().getNumberOfColumns();
		var latCol;
		var lngCol;

		for (var c = 0; c < numCols; c++) {
			
			var colLabel = response.getDataTable().getColumnLabel(c);
			
			// find latitude and longitude columns
			if (colLabel === "Latitude") {
				latCol = c;
			} else if (colLabel === "Longitude") {
				lngCol = c;
			} else {
				visibleColumns.push(c);
			}
			
			// find filter columns
			if (colLabel.indexOf('(filter)') > -1 ) {
				columnLabels.push(colLabel.substr(0, colLabel.indexOf('(filter)')));
				filterColumns.push(c);
			} else {
				columnLabels.push(colLabel);
			}
		}

		// create a marker for each row
		for (var r = 0; r < numRows; r++) {

			var lat = response.getDataTable().getValue(r, latCol);
			var lng = response.getDataTable().getValue(r, lngCol);
			var coordinate = new google.maps.LatLng(lat, lng);
			var windowContent = '';

			for (var c = 0; c < numCols; c++) {
				var columnLabel = response.getDataTable().getColumnLabel(c);
				var value = response.getDataTable().getValue(r, c);
				if (visibleColumns.indexOf(c) != -1 && value) {
					windowContent += '<p><b>' + columnLabels[c] + ':</b> ' + value;				
				}
			}

			markers.push(createMarker(coordinate, windowContent));
			visibleMarkers.push(r);
		}
		
		createFilters();
		drawTable();
		detectUserLocation();
	});
}
