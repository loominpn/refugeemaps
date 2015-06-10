
<h2><?php echo $title ?></h2>

<div id="filters" class="panel panel-default">
	<div class="panel-body">
		<div style="font-weight: 800; color: #aaa; margin-bottom: 10px">FILTER</div>
		<div id="filters-cont"></div>
	</div>
</div>

<div id="map-cont"></div>
<div class="txt-right" style="margin-bottom: 30px">
	<img src="images/user-location.png" width="30" height="30">
	<small>Dein aktueller Standort</small>
</div>

<div id="table-cont" class="table-responsive"></div>

<script>
	var tableId = '<?php echo $tableId ?>';
</script>