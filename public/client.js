
$( document ).ready(function() {
  
  $('#testForm').submit(function(e) {
    $.ajax({
      url: '/api/stock-prices',
      type: 'post',
      data: $('#testForm').serialize(),
      success: function(data) {
        $('.status').css("display", "block");
        $('#jsonResult').text(JSON.stringify(data));
      }
    });
    //setTimeout(() => location.reload(), 1000); //update list
    e.preventDefault();
  });
  
  $('#testForm2').submit(function(e) {
    $.ajax({
      url: '/api/stock-compare',
      type: 'post',
      data: $('#testForm2').serialize(),
      success: function(data) {
        $('.status').css("display", "block");
        $('#jsonResult').text(JSON.stringify(data)); 
      }
    });
    e.preventDefault();
  });

});
